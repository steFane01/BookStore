/**
 * Shared email layout.
 *
 * Every transactional email (account, password reset, contact form, order
 * confirmation/status, newsletter) is wrapped in the same brand shell as the
 * owner's campaign email: warm paper background, a 600px card with an oxblood
 * top rule, a small brass eyebrow, a serif title, the body, an optional button
 * and a muted footer.
 *
 * Inline styles only, so the result looks the same in Gmail, Outlook and Apple
 * Mail. All caller-provided HTML is expected to be escaped already; the shell
 * escapes the brand, eyebrow and title itself.
 */
import { escapeHtml } from './text.js'

/** Font stacks shared by the shell and the helper blocks below. */
export const EMAIL_FONTS = {
  sans: 'Arial,Helvetica,sans-serif',
  serif: "Georgia,'Times New Roman',serif",
}

/** Paragraph style used by the plain-text → HTML helpers. */
export const EMAIL_PARAGRAPH_STYLE = 'margin:0 0 16px;'

export function renderEmail({
  brand = 'Librăria',
  eyebrow = '',
  title = '',
  bodyHtml = '',
  bodyText = '',
  cta = null,
  footerHtml = [],
  footerText = [],
}) {
  const safeBrand = escapeHtml(brand)
  const safeTitle = escapeHtml(title)
  const label = eyebrow ? escapeHtml(eyebrow) : ''
  const year = new Date().getFullYear()

  const ctaHtml =
    cta && cta.url && cta.label
      ? `<div style="padding:0 32px 24px;">
          <a href="${escapeHtml(cta.url)}" style="display:inline-block;background-color:#642a2e;color:#fbf8f2;text-decoration:none;font-family:${EMAIL_FONTS.sans};font-size:14px;letter-spacing:0.3px;padding:12px 22px;">
            ${escapeHtml(cta.label)}
          </a>
        </div>`
      : ''

  const footerLines = footerHtml.length
    ? footerHtml
    : [`${safeBrand} &middot; ${year}`]

  const html = `<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:0;background-color:#f5f0e6;">
    <div style="background-color:#f5f0e6;padding:32px 16px;font-family:${EMAIL_FONTS.sans};color:#1c1a17;">
      <div style="max-width:600px;margin:0 auto;background-color:#fbf8f2;border:1px solid #e2d6c1;">
        <div style="height:4px;background-color:#642a2e;"></div>
        <div style="padding:32px 32px 8px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a6d42;">
            ${safeBrand}${label ? ` &middot; ${label}` : ''}
          </p>
          ${
            safeTitle
              ? `<h1 style="margin:0 0 22px;font-family:${EMAIL_FONTS.serif};font-size:26px;font-weight:500;line-height:1.25;color:#1c1a17;">
            ${safeTitle}
          </h1>`
              : ''
          }
          <div style="font-size:15px;line-height:1.65;color:#3a362f;">
            ${bodyHtml}
          </div>
        </div>
        ${ctaHtml}
        <div style="padding:18px 32px;border-top:1px solid #e2d6c1;font-size:12px;line-height:1.6;color:#6b6458;">
          ${footerLines.map((line) => `<p style="margin:0 0 6px;">${line}</p>`).join('')}
        </div>
      </div>
    </div>
  </body>
</html>`

  const text = [
    String(bodyText ?? '').trim(),
    '',
    '—',
    brand,
    ...(cta && cta.url && cta.label ? ['', `${cta.label}: ${cta.url}`] : []),
    ...(footerText.length ? ['', ...footerText] : []),
  ].join('\n')

  return { text, html }
}

/**
 * Convert plain text to safe HTML paragraphs: a blank line starts a new
 * paragraph, single newlines become `<br/>`, everything is escaped.
 */
export function textToHtml(message) {
  return String(message ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="${EMAIL_PARAGRAPH_STYLE}">${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('')
}

/** Small definition list used by order/contact emails (label + value). */
export function detailRows(rows) {
  return rows
    .filter(([, value]) => value != null && value !== '')
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 6px;"><span style="color:#6b6458;">${escapeHtml(label)}:</span> ${value}</p>`,
    )
    .join('')
}
