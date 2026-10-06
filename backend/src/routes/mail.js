import { Router } from 'express'
import { sendMail, describeMailConfig } from '../mailer.js'

export const mailRouter = Router()

/**
 * GET /api/mail/status
 * Diagostic — which transport is active and whether the previous test send
 * succeeded. Never exposes SMTP credentials.
 */
const state = { lastSend: null, lastError: null, lastTo: null }
mailRouter.get('/status', (_req, res) => {
  res.json({ config: describeMailConfig(), lastSend: state.lastSend, lastError: state.lastError, lastTo: state.lastTo })
})

/**
 * POST /api/mail/test
 * Send a test email to the given address. Use this to verify real delivery
 * (e.g. to your Gmail) or to see the message in the Mailpit web UI.
 *
 * Body: { to: string, subject?: string }
 */
mailRouter.post('/test', async (req, res) => {
  const { to, subject } = req.body || {}
  if (!to || !String(to).includes('@')) {
    return res.status(422).json({ error: 'Adresa de email destinatar este obligatorie.' })
  }
  const recipient = String(to).trim()
  const subj = String(subject || 'Mesaj de test — Librăria')
  try {
    const info = await sendMail({
      to: recipient,
      subject: subj,
      text:
        'Acesta este un email de test trimis din aplicația Librăria.\n\n' +
        'Dacă îl vezi, integrarea cu serviciul de email funcționează corect.\n\n' +
        'Cu drag, echipa Librăria.',
      html:
        '<div style="font-family:Arial,sans-serif;color:#1d1d1b">' +
        '<h2>Librăria</h2>' +
        '<p>Acesta este un <strong>email de test</strong> trimis din aplicația Librăria.</p>' +
        '<p>Dacă îl vezi, integrarea cu serviciul de email funcționează corect.</p>' +
        '<p style="color:#642A2E">Cu drag, echipa Librăria.</p>' +
        '</div>',
    })
    state.lastSend = new Date().toISOString()
    state.lastTo = recipient
    state.lastError = null
    res.json({ ok: true, messageId: info.messageId, to: recipient })
  } catch (err) {
    state.lastError = err.message
    res.status(502).json({ error: `Eroare la trimiterea emailului: ${err.message}` })
  }
})
