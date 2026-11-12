/**
 * Newsletter campaign helpers.
 *
 * The owner composes a plain-text email from Admin → „Campanie email”; these
 * pure functions validate it and render the text/HTML variants sent to every
 * subscriber. Keeping them free of DB/mail dependencies makes the template and
 * the limits unit-testable without a database or an SMTP server.
 */
import { escapeHtml } from './text.js'
import { renderEmail, textToHtml } from './emailLayout.js'

export const CAMPAIGN_LIMITS = { subject: 160, message: 8000 }

/** Longest line the campaign may contain (kept short for the HTML layout). */
const MAX_MESSAGE_LENGTH = CAMPAIGN_LIMITS.message

/**
 * Validate the owner's input. Newlines in the subject are collapsed on purpose:
 * a subject header must stay on a single line (header-injection guard).
 */
export function validateCampaign(input) {
  const subject = String(input?.subject ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
  const message = String(input?.message ?? '')
    .replace(/\r\n/g, '\n')
    .trim()

  if (subject.length < 3) {
    return { ok: false, error: 'Subiectul trebuie să aibă cel puțin 3 caractere.' }
  }
  if (subject.length > CAMPAIGN_LIMITS.subject) {
    return {
      ok: false,
      error: `Subiectul poate avea cel mult ${CAMPAIGN_LIMITS.subject} caractere.`,
    }
  }
  if (message.length < 10) {
    return { ok: false, error: 'Mesajul trebuie să aibă cel puțin 10 caractere.' }
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Mesajul poate avea cel mult ${MAX_MESSAGE_LENGTH} caractere.`,
    }
  }
  return { ok: true, subject, message }
}

/**
 * Render the plain-text message as safe HTML paragraphs (blank line = new
 * paragraph, single newline = line break, everything escaped).
 */
export function messageToHtml(message) {
  return textToHtml(message)
}

/**
 * Build the email sent to a subscriber. It uses the same brand shell as every
 * other message the shop sends; the footer explains why the address is on the
 * list and how to opt out.
 */
export function buildCampaignEmail({
  brand = 'Librăria',
  subject = '',
  message = '',
  publicUrl = '',
  contactEmail = '',
}) {
  const footerHtml = [
    `Ai primit acest email pentru că te-ai abonat la newsletter-ul ${escapeHtml(brand)}.`,
  ]
  const footerText = [
    `Ai primit acest email pentru că te-ai abonat la newsletter-ul ${brand}.`,
  ]

  if (contactEmail) {
    footerHtml.push(
      `Dacă nu mai vrei să primești scrisori, scrie-ne la ` +
        `<a href="mailto:${escapeHtml(contactEmail)}" style="color:#642a2e;">${escapeHtml(contactEmail)}</a> ` +
        `și te scoatem de pe listă.`,
    )
    footerText.push(
      `Dacă nu mai vrei să primești scrisori, scrie-ne la ${contactEmail} și te scoatem de pe listă.`,
    )
  }

  const { text, html } = renderEmail({
    brand,
    eyebrow: 'Newsletter',
    title: subject,
    bodyHtml: textToHtml(message),
    bodyText: String(message ?? '').trim(),
    cta: publicUrl ? { label: 'Vezi librăria', url: publicUrl } : null,
    footerHtml,
    footerText,
  })

  return { subject, text, html }
}

