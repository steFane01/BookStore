import nodemailer from 'nodemailer'
import { getSiteName } from './settings.js'

/**
 * Mail service.
 *
 * Two modes, selected by environment variables:
 *
 * 1. LOCAL (default in dev): sends through the `mailpit` container, which catches
 *    every message and shows it in a web UI at http://localhost:8025.
 * 2. SMTP (real): when SMTP_HOST / SMTP_USER / SMTP_PASS are set, mail is
 *    delivered to real inboxes.
 *
 * The `From` display name follows the brand configured by the owner in the
 * admin panel; the address always stays the authenticated SMTP account so
 * SPF/DKIM/DMARC alignment keeps working.
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

/** Resolve the `From` header (brand display name + authenticated address). */
async function resolveFrom() {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM
  const brand = await getSiteName('Librăria').catch(() => 'Librăria')
  const address =
    process.env.SMTP_USER || process.env.MAIL_FROM_ADDRESS || 'no-reply@libraria.local'
  return `${brand} <${address}>`
}

/**
 * Send an email. Returns the nodemailer info object. Throws on failure so
 * callers can decide whether a failure is fatal.
 */
export async function sendMail({ to, subject, text, html, replyTo }) {
  const from = await resolveFrom()
  return getTransporter().sendMail({ from, to, subject, text, html, replyTo })
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

/**
 * The inbox that receives messages from the public contact form and new orders.
 * Defaults to the address the site sends from (SMTP_USER) — i.e. the mailbox
 * configured for the site. Override with CONTACT_TO.
 */
export function getContactRecipient() {
  return process.env.CONTACT_TO || process.env.SMTP_USER || process.env.MAIL_FROM_ADDRESS || null
}
