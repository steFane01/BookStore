import { Router } from 'express'
import { sendMail, getContactRecipient } from '../mailer.js'

export const formsRouter = Router()

/** Loose email validator. */
function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * POST /api/contact
 *
 * A visitor fills in the public contact form. We email their message TO the
 * site's own mailbox (the address configured in `.env` via SMTP_USER / MAIL_FROM
 * — see `getContactRecipient()`), so the owner receives it. This is the standard
 * "contact form" pattern: the message goes to the site owner, not back to the
 * visitor.
 */
formsRouter.post('/contact', async (req, res) => {
  const { name, email, message } = req.body || {}
  const senderName = String(name ?? '').trim()
  const senderEmail = String(email ?? '').trim()
  const body = String(message ?? '').trim()

  if (!senderName || !isEmail(senderEmail) || !body) {
    return res.status(422).json({ error: 'Numele, emailul și mesajul sunt obligatorii.' })
  }

  const to = getContactRecipient()
  if (!to) {
    return res.status(500).json({ error: 'Emailul destinatar nu este configurat în .env.' })
  }

  try {
    await sendMail({
      to,
      subject: `Mesaj din formularul de contact — ${senderName}`,
      text:
        `Ai primit un mesaj din formularul de contact:\n\n` +
        `Nume: ${senderName}\nEmail: ${senderEmail}\n\n${body}`,
      html:
        `<p><strong>Ai primit un mesaj din formularul de contact:</strong></p>` +
        `<p><strong>Nume:</strong> ${senderName}<br/>` +
        `<strong>Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>` +
        `<hr/><div style="white-space:pre-wrap">${String(body).replace(/</g, '&lt;')}</div>`,
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: `Eroare la trimiterea emailului: ${err.message}` })
  }
})

/**
 * POST /api/newsletter
 *
 * A visitor subscribes to the newsletter; we email a confirmation TO the address
 * they typed in the "Mă abonez" field (from the `.env` mail account).
 */
formsRouter.post('/newsletter', async (req, res) => {
  const email = String((req.body || {}).email ?? '').trim()
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Adresa de email nu este validă.' })
  }
  try {
    await sendMail({
      to: email,
      subject: 'Abonare la newsletter — Librăria',
      text:
        'Mulțumim că te-ai abonat la newsletter-ul Librăria.\n\n' +
        'Vei primi vești despre cărțile noi, din când în când. Cu drag, echipa Librăria.',
      html:
        '<p>Mulțumim că te-ai abonat la newsletter-ul <strong>Librăria</strong>.</p>' +
        '<p>Vei primi vești despre cărțile noi, din când în când.</p>' +
        '<p style="color:#642A2E">Cu drag, echipa Librăria.</p>',
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: `Eroare la trimiterea emailului: ${err.message}` })
  }
})
