/**
 * Search helpers shared by the catalog endpoint and its unit tests.
 *
 * Visitors type without diacritics (“carti”), while the catalog stores “Cărți”,
 * so both sides are normalised: lowercase, diacritics stripped (comma-below and
 * cedilla variants) and whitespace collapsed.
 */

const SQL_DIACRITICS_FROM = 'ăâîșțşţü'
const SQL_DIACRITICS_TO = 'aaiststu'

/** Normalise a user query for matching (lowercase, no diacritics). */
export function normalizeSearchTerm(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[şţ]/g, (char) => (char === 'ş' ? 's' : 't'))
    .replace(/\s+/g, ' ')
    .trim()
}

/** SQL `LIKE` pattern for a query, with wildcard characters escaped. */
export function likePattern(value) {
  const term = normalizeSearchTerm(value)
  if (!term) return ''
  return `%${term.replace(/[\\%_]/g, '\\$&')}%`
}

/** SQL expression: lowercase + strip Romanian diacritics from a column. */
export function searchExpression(column) {
  return `translate(lower(${column}), '${SQL_DIACRITICS_FROM}', '${SQL_DIACRITICS_TO}')`
}
