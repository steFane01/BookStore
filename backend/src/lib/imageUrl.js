/**
 * Validate an image URL stored by the owner (category pages, hero image…).
 *
 * Only same-origin paths (`/uploads/…`, `/welcomepage.jpeg`) and absolute
 * http(s) URLs are accepted, so a stored value can never become a `javascript:`
 * or `data:` URL in the storefront. Empty/invalid input yields an empty string.
 */
export function cleanImageUrl(value, maxLength = 500) {
  const url = String(value ?? '').trim()
  if (!url) return ''
  const capped = url.length > maxLength ? url.slice(0, maxLength) : url
  if (capped.startsWith('/')) return capped
  if (/^https?:\/\//i.test(capped)) return capped
  return ''
}
