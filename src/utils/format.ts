/** Format a number as Romanian RON, e.g. 89 -> "89 RON". */
export function formatPrice(value: number, currency = 'RON'): string {
  return `${value.toLocaleString('ro-RO')} ${currency}`
}
