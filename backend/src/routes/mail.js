import { Router } from 'express'
import { sendMail, describeMailConfig } from '../mailer.js'
import { requireAdmin } from '../auth.js'
import { cleanString, isEmail } from '../lib/text.js'

export const mailRouter = Router()

/**
 * Mail diagnostics — ADMIN ONLY.
 *
 * These endpoints used to be public, which turned the SMTP account into an open
 * relay for anyone who found the URL. They are now restricted to the owner.
 */
const state = { lastSend: null, lastError: null, lastTo: null }

mailRouter.get('/status', requireAdmin, (_req, res) => {
  res.json({
    config: describeMailConfig(),
    lastSend: state.lastSend,
    lastError: state.lastError,
    lastTo: state.lastTo,
  })
})

mailRouter.post('/test', requireAdmin, async (req, res) => {
  const to = cleanString(req.body?.to, 200)
  if (!isEmail(to)) {
    return res.status(422).json({ error: 'Adresa de email destinatar este obligatorie.' })
  }
  const subject = cleanString(req.body?.subject, 200) || 'Mesaj de test'
  try {
    const info = await sendMail({
      to,
      subject,
      text:
        'Acesta este un email de test trimis din magazinul online.\n\n' +
        'Dacă îl vezi, integrarea cu serviciul de email funcționează corect.',
      html:
        '<div style="font-family:Arial,sans-serif;color:#1d1d1b">' +
        '<p>Acesta este un <strong>email de test</strong> trimis din magazinul online.</p>' +
        '<p>Dacă îl vezi, integrarea cu serviciul de email funcționează corect.</p>' +
        '</div>',
    })
    state.lastSend = new Date().toISOString()
    state.lastTo = to
    state.lastError = null
    return res.json({ ok: true, messageId: info.messageId, to })
  } catch (err) {
    state.lastError = err.message
    console.error('[libraria] test email failed:', err.message)
    return res.status(502).json({ error: 'Emailul de test nu a putut fi trimis. Verifică setările SMTP.' })
  }
})
