import { Router } from 'express'
import { pool } from '../db.js'
import { requireAdmin } from '../auth.js'
import { getPublicUrl } from '../config.js'
import { getSiteName, getSettings } from '../settings.js'
import { sendMail, getContactRecipient } from '../mailer.js'
import { serverError } from '../lib/errors.js'
import { cleanString } from '../lib/text.js'
import { buildCampaignEmail, validateCampaign } from '../lib/newsletterCampaign.js'
import { verifyEmail } from '../lib/emailDomain.js'

export const newsletterRouter = Router()

/** Safety rails for a single campaign send (one SMTP mailbox, one request). */
const MAX_RECIPIENTS = 500
const SEND_CONCURRENCY = 5
const SEND_COOLDOWN_MS = 30_000

let lastCampaignAt = 0

/**
 * Run `worker` over `items` with a bounded number of in-flight promises, so a
 * large list doesn't open hundreds of SMTP connections at once.
 */
async function forEachWithConcurrency(items, limit, worker) {
  let index = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index]
      index += 1
      await worker(item)
    }
  })
  await Promise.all(runners)
}

/** GET /api/newsletter — subscriber list, admin only. */
newsletterRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email, source, created_at AS "createdAt" FROM newsletter_subscribers ORDER BY created_at DESC',
    )
    return res.json(rows)
  } catch (err) {
    return serverError(res, err, 'list-subscribers')
  }
})

/** GET /api/newsletter/export — CSV download for the owner's mailing tool. */
newsletterRouter.get('/export', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email, created_at FROM newsletter_subscribers ORDER BY created_at DESC',
    )
    const csv = ['email,abonat_la']
      .concat(rows.map((row) => `${row.email},${row.created_at.toISOString()}`))
      .join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="abonati-newsletter.csv"')
    return res.send(`\uFEFF${csv}`)
  } catch (err) {
    return serverError(res, err, 'export-subscribers')
  }
})

/**
 * POST /api/newsletter/send — send the owner's offer email, admin only.
 *
 * Body: `{ subject, message, testTo? }`. With `testTo` a single preview copy is
 * delivered to that address; otherwise the campaign goes to every subscriber.
 * A short cooldown stops an accidental double click from sending twice.
 */
newsletterRouter.post('/send', requireAdmin, async (req, res) => {
  const parsed = validateCampaign(req.body)
  if (!parsed.ok) return res.status(422).json({ error: parsed.error })

  const brand = await getSiteName()
  const settings = await getSettings()
  // Public contact address for the opt-out note, in order of preference.
  const contactEmail = getContactRecipient() || settings.contactEmail || ''
  const email = buildCampaignEmail({
    brand,
    subject: parsed.subject,
    message: parsed.message,
    publicUrl: getPublicUrl(),
    contactEmail,
  })

  // Test copy: never touches the subscriber list and ignores the cooldown.
  const testTo = cleanString(req.body?.testTo, 200).toLowerCase()
  if (testTo) {
    const emailCheck = await verifyEmail(testTo)
    if (!emailCheck.ok) {
      return res.status(422).json({ error: emailCheck.error })
    }
    try {
      await sendMail({ to: testTo, subject: `[TEST] ${email.subject}`, text: email.text, html: email.html })
      return res.json({ ok: true, test: true, total: 1, sent: 1, failed: 0, to: testTo })
    } catch (err) {
      console.error('[libraria] newsletter test send failed:', err.message)
      return res.status(502).json({ error: 'Emailul de test nu a putut fi trimis. Verifică setările SMTP.' })
    }
  }

  const now = Date.now()
  if (now - lastCampaignAt < SEND_COOLDOWN_MS) {
    return res.status(429).json({
      error: 'Campania a fost trimisă de curând. Așteaptă 30 de secunde înainte de a trimite din nou.',
    })
  }

  let recipients
  try {
    const { rows } = await pool.query(
      'SELECT email FROM newsletter_subscribers ORDER BY created_at ASC',
    )
    recipients = rows.map((row) => row.email)
  } catch (err) {
    return serverError(res, err, 'campaign-recipients')
  }

  if (recipients.length === 0) {
    return res.status(422).json({ error: 'Nu există abonați la newsletter încă.' })
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return res.status(422).json({
      error: `Lista are ${recipients.length} abonați, peste limita de ${MAX_RECIPIENTS} per trimitere. Folosește un serviciu de newsletter dedicat pentru liste mai mari.`,
    })
  }

  // Set before sending so a double submit arriving mid-send is rejected too.
  lastCampaignAt = now

  const failures = []
  let sent = 0
  await forEachWithConcurrency(recipients, SEND_CONCURRENCY, async (to) => {
    try {
      await sendMail({ to, subject: email.subject, text: email.text, html: email.html })
      sent += 1
    } catch (err) {
      failures.push(to)
      console.warn(`[libraria] campaign send failed for ${to}:`, err.message)
    }
  })

  console.log(
    `[libraria] campaign "${parsed.subject}": ${sent}/${recipients.length} sent, ${failures.length} failed`,
  )

  if (sent === 0) {
    return res.status(502).json({
      error: 'Niciun email nu a putut fi trimis. Verifică setările SMTP și încearcă din nou.',
      total: recipients.length,
      sent: 0,
      failed: failures.length,
    })
  }

  return res.json({
    ok: true,
    total: recipients.length,
    sent,
    failed: failures.length,
    // Enough for the owner to act on; keeps the response small.
    failures: failures.slice(0, 10),
  })
})

/** DELETE /api/newsletter/:email — remove a subscriber (GDPR requests). */
newsletterRouter.delete('/:email', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM newsletter_subscribers WHERE email = $1', [
      String(req.params.email || '').trim().toLowerCase(),
    ])
    if (rowCount === 0) return res.status(404).json({ error: 'Abonatul nu a fost găsit.' })
    return res.status(204).end()
  } catch (err) {
    return serverError(res, err, 'delete-subscriber')
  }
})
