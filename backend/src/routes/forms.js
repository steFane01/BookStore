import { Router } from 'express'
import { pool } from '../db.js'
import { sendMail, getContactRecipient } from '../mailer.js'
import { getSiteName } from '../settings.js'
import { getPublicUrl } from '../config.js'
import { serverError } from '../lib/errors.js'
import { cleanString, escapeHtml } from '../lib/text.js'
import { renderEmail } from '../lib/emailLayout.js'
import { verifyEmail } from '../lib/emailDomain.js'

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

  if (!name || !email || !message) {
    return res.status(422).json({ error: 'Numele, emailul și mesajul sunt obligatorii.' })
  }
  const emailCheck = await verifyEmail(email)
  if (!emailCheck.ok) {
    return res.status(422).json({ error: emailCheck.error })
  }

  const to = getContactRecipient()
  if (!to) {
    console.warn('[libraria] contact form: niciun destinatar configurat (CONTACT_TO / SMTP_USER)')
    return res.status(500).json({ error: 'Formularul nu este configurat. Scrie-ne direct pe email.' })
  }

  const brand = await getSiteName()
  try {
    const { text, html } = renderEmail({
      brand,
      eyebrow: 'Formular de contact',
      title: `Mesaj nou de la ${name}`,
      bodyHtml:
        `<p style="margin:0 0 6px;"><span style="color:#6b6458;">Nume:</span> ${escapeHtml(name)}</p>` +
        `<p style="margin:0 0 18px;"><span style="color:#6b6458;">Email:</span> ` +
        `<a href="mailto:${escapeHtml(email)}" style="color:#642a2e;">${escapeHtml(email)}</a></p>` +
        `<div style="white-space:pre-wrap;">${escapeHtml(message)}</div>`,
      bodyText:
        `Ai primit un mesaj din formularul de contact:\n\n` +
        `Nume: ${name}\nEmail: ${email}\n\n${message}`,
      cta: { label: 'Răspunde pe email', url: `mailto:${email}` },
      footerHtml: [`Mesaj trimis din formularul de contact al site-ului ${escapeHtml(brand)}.`],
      footerText: [`Mesaj trimis din formularul de contact al site-ului ${brand}.`],
    })
    await sendMail({
      to,
      replyTo: email,
      subject: `Mesaj din formularul de contact — ${name} (${brand})`,
      text,
      html,
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
  const emailCheck = await verifyEmail(email)
  if (!emailCheck.ok) {
    return res.status(422).json({ error: emailCheck.error })
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
  const { text, html } = renderEmail({
    brand,
    eyebrow: 'Newsletter',
    title: 'Mulțumim că te-ai abonat',
    bodyHtml:
      `<p style="margin:0 0 16px;">Mulțumim că te-ai abonat la newsletter-ul <strong>${escapeHtml(brand)}</strong>.</p>` +
      `<p style="margin:0;">Vei primi vești despre produsele noi, din când în când.</p>`,
    bodyText:
      `Mulțumim că te-ai abonat la newsletter-ul ${brand}.\n\n` +
      `Vei primi vești despre produsele noi, din când în când.`,
    cta: { label: 'Vezi librăria', url: getPublicUrl() },
    footerHtml: ['Te poți dezabona oricând printr-un simplu răspuns la acest email.'],
    footerText: ['Te poți dezabona oricând printr-un simplu răspuns la acest email.'],
  })
  sendMail({
    to: email,
    subject: `Abonare la newsletter — ${brand}`,
    text,
    html,
  }).catch((mailErr) => console.warn('[libraria] newsletter email skipped:', mailErr.message))

  return res.json({ ok: true })
})
