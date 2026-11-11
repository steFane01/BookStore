import { Router } from 'express'
import { pool } from '../db.js'
import { sendMail, getContactRecipient } from '../mailer.js'
import { getSiteName } from '../settings.js'
import { serverError } from '../lib/errors.js'
import { cleanString, escapeHtml, isEmail } from '../lib/text.js'

export const formsRouter = Router()

/**
 * POST /api/forms/contact
 *
 * A visitor fills in the public contact form. We email their message TO the
 * site's own mailbox (CONTACT_TO / SMTP_USER), so the owner receives it. Every
 * field is HTML-escaped before it lands in the email body.
 */
formsRouter.post('/contact', async (req, res) => {
  const name = cleanString(req.body?.name, 120)
  const email = cleanString(req.body?.email, 200)
  const message = cleanString(req.body?.message, 4000)

  if (!name || !isEmail(email) || !message) {
    return res.status(422).json({ error: 'Numele, emailul și mesajul sunt obligatorii.' })
  }

  const to = getContactRecipient()
  if (!to) {
    console.warn('[libraria] contact form: niciun destinatar configurat (CONTACT_TO / SMTP_USER)')
    return res.status(500).json({ error: 'Formularul nu este configurat. Scrie-ne direct pe email.' })
  }

  const brand = await getSiteName()
  try {
    await sendMail({
      to,
      replyTo: email,
      subject: `Mesaj din formularul de contact — ${name} (${brand})`,
      text:
        `Ai primit un mesaj din formularul de contact:\n\n` +
        `Nume: ${name}\nEmail: ${email}\n\n${message}`,
      html:
        `<p><strong>Ai primit un mesaj din formularul de contact:</strong></p>` +
        `<p><strong>Nume:</strong> ${escapeHtml(name)}<br/>` +
        `<strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` +
        `<hr/><div style="white-space:pre-wrap">${escapeHtml(message)}</div>`,
    })
    return res.json({ ok: true })
  } catch (err) {
    console.error('[libraria] contact form send failed:', err.message)
    return res.status(502).json({ error: 'Mesajul nu a putut fi trimis. Încearcă din nou.' })
  }
})

/**
 * POST /api/forms/newsletter
 * Stores the subscriber (so the owner has a real list to export) and sends a
 * confirmation to the address typed in the form.
 */
formsRouter.post('/newsletter', async (req, res) => {
  const email = cleanString(req.body?.email, 200).toLowerCase()
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Adresa de email nu este validă.' })
  }

  try {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, source) VALUES ($1, 'newsletter-site')
       ON CONFLICT (email) DO NOTHING`,
      [email],
    )
  } catch (err) {
    return serverError(res, err, 'newsletter-subscribe')
  }

  const brand = await getSiteName()
  sendMail({
    to: email,
    subject: `Abonare la newsletter — ${brand}`,
    text:
      `Mulțumim că te-ai abonat la newsletter-ul ${brand}.\n\n` +
      `Vei primi vești despre produsele noi, din când în când.\n\n` +
      `Cu drag, echipa ${brand}.`,
    html:
      `<p>Mulțumim că te-ai abonat la newsletter-ul <strong>${escapeHtml(brand)}</strong>.</p>` +
      `<p>Vei primi vești despre produsele noi, din când în când.</p>` +
      `<p style="color:#642A2E">Cu drag, echipa ${escapeHtml(brand)}.</p>`,
  }).catch((mailErr) => console.warn('[libraria] newsletter email skipped:', mailErr.message))

  return res.json({ ok: true })
})
