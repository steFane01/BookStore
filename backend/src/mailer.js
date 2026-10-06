import nodemailer from 'nodemailer'

/**
 * Librăria mail service.
 *
 * Two modes, selected by environment variables (see .env.example):
 *
 * 1. LOCAL (default): sends through the `mailpit` container, which catches every
 *    message and shows it in a web UI at http://localhost:8025. Zero credentials,
 *    ideal for testing without a real inbox or domain.
 * 2. SMTP (real): when SMTP_HOST / SMTP_USER / SMTP_PASS are set (e.g. Gmail with
 *    an app password), mail is delivered to real inboxes. Best for sending the
 *    user's real Gmail address now, before a domain is registered.
 */
function buildTransporter() {
  const host = process.env.SMTP_HOST
  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  }
  // Local fallback -> the `mailpit` service in docker-compose.
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST_LOCAL || 'mailpit',
    port: Number(process.env.SMTP_PORT_LOCAL || 1025),
  })
}

let transporter = null
function getTransporter() {
  if (!transporter) transporter = buildTransporter()
  return transporter
}

const FROM =
  process.env.MAIL_FROM || `Librăria <${process.env.MAIL_FROM_ADDRESS || 'no-reply@libraria.local'}>`

/**
 * Send an email. Returns the nodemailer info object. Throws on failure so
 * callers can decide whether a failure is fatal.
 */
export async function sendMail({ to, subject, text, html }) {
  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
  })
  return info
}

/** Informational string for diagnostics (never includes the password). */
export function describeMailConfig() {
  if (process.env.SMTP_HOST) {
    return {
      mode: 'smtp',
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || null,
    }
  }
  return {
    mode: 'local-mailpit',
    host: process.env.SMTP_HOST_LOCAL || 'mailpit',
    port: Number(process.env.SMTP_PORT_LOCAL || 1025),
  }
}
