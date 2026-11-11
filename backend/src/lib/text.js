/** Small text/validation helpers shared by the API routes and email builders. */

/** Escape a value for safe interpolation into HTML (emails, admin UI). */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

/** Loose email validator (same rule the frontend uses). */
export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Trim + hard length cap, so no request can push huge strings into the DB. */
export function cleanString(value, maxLength = 500) {
  const text = String(value ?? '').trim()
  return text.length > maxLength ? text.slice(0, maxLength) : text
}
