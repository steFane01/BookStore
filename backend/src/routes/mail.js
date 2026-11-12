import { Router } from 'express'
import { sendMail, describeMailConfig } from '../mailer.js'
import { requireAdmin } from '../auth.js'
import { getPublicUrl } from '../config.js'
import { getSiteName } from '../settings.js'
import { cleanString, escapeHtml } from '../lib/text.js'
import { renderEmail } from '../lib/emailLayout.js'
import { verifyEmail } from '../lib/emailDomain.js'

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
  const emailCheck = await verifyEmail(to)
  if (!emailCheck.ok) {
    return res.status(422).json({ error: emailCheck.error })
  }
  const subject = cleanString(req.body?.subject, 200) || 'Mesaj de test'
  try {
    const brand = await getSiteName()
    const config = describeMailConfig()
    const { text, html } = renderEmail({
      brand,
      eyebrow: 'Test',
      title: subject,
      bodyHtml:
        `<p style="margin:0 0 16px;">Acesta este un <strong>email de test</strong> trimis din magazinul online.</p>` +
        `<p style="margin:0;">Dacă îl vezi, integrarea cu serviciul de email funcționează corect.</p>`,
      bodyText:
        'Acesta este un email de test trimis din magazinul online.\n\n' +
        'Dacă îl vezi, integrarea cu serviciul de email funcționează corect.',
      cta: { label: 'Deschide librăria', url: getPublicUrl() },
      footerHtml: [`Transport: ${escapeHtml(config.mode)} (${escapeHtml(config.host)}:${config.port}).`],
      footerText: [`Transport: ${config.mode} (${config.host}:${config.port}).`],
    })
    const info = await sendMail({ to, subject, text, html })
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
