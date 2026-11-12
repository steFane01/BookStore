/**
 * Client-side search helpers.
 *
 * Matching is accent-insensitive, so a visitor typing „carti” finds „Cărți”
 * and „stiinta” finds „Știință”. `normalizeSearch` keeps one character per
 * original character, which lets the UI highlight the match in place.
 */

export function normalizeSearch(value: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[şţ]/g, (char) => (char === 'ş' ? 's' : 't'))
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when every word of `query` appears somewhere in `text`. */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = normalizeSearch(text)
  if (!haystack) return false
  const words = normalizeSearch(query).split(' ').filter(Boolean)
  if (words.length === 0) return true
  return words.every((word) => haystack.includes(word))
}

/**
 * Locate the query inside `text` in normalized space (for <mark> highlighting).
 * Falls back to the first word when the full phrase is not contiguous.
 */
export function findSearchMatch(
  text: string,
  query: string,
): { start: number; length: number } | null {
  const haystack = normalizeSearch(text)
  const normalizedQuery = normalizeSearch(query)
  if (!haystack || !normalizedQuery) return null

  const candidates = [normalizedQuery, ...normalizedQuery.split(' ')]
  for (const candidate of candidates) {
    if (!candidate) continue
    const index = haystack.indexOf(candidate)
    if (index !== -1 && index + candidate.length <= text.length) {
      return { start: index, length: candidate.length }
    }
  }
  return null
}
