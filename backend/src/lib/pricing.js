/**
 * Order pricing helpers.
 *
 * Prices and stock ALWAYS come from the database — never from the browser. These
 * functions are pure so they can be unit-tested without a database.
 */
export const MAX_LINE_QUANTITY = 99

/** Positive integer quantity within a sane bound, or null when invalid. */
export function normalizeLineQuantity(value) {
  const quantity = Number(value)
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_LINE_QUANTITY) return null
  return quantity
}

/** Find a variant on a book row (variants is a JSONB array). */
export function findVariant(book, variantId) {
  if (!variantId) return null
  const variants = Array.isArray(book?.variants) ? book.variants : []
  return variants.find((variant) => String(variant.id) === String(variantId)) || null
}

/** Effective unit price: base price plus the variant delta. null if unknown. */
export function unitPrice(book, variantId) {
  const base = Number(book?.price) || 0
  if (!variantId) return Math.round(base * 100) / 100
  const variant = findVariant(book, variantId)
  if (!variant) return null
  const delta = Number(variant.priceDelta) || 0
  return Math.round((base + delta) * 100) / 100
}

/** Effective available stock: the variant's stock when set, else the book's. */
export function availableStock(book, variantId) {
  const variant = findVariant(book, variantId)
  if (variant && variant.stock != null) return Math.max(0, Number(variant.stock) || 0)
  return Math.max(0, Number(book?.stock) || 0)
}

/**
 * Resolve the client's cart lines against real catalog rows.
 *
 * Returns `{ lines, errors }`:
 *  - `lines` carry the authoritative title/author/price/productType
 *  - `errors` are human-readable, in Romanian, and stop the order when non-empty
 */
export function resolveOrderLines(rawLines, booksById) {
  const lines = []
  const errors = []

  for (const raw of Array.isArray(rawLines) ? rawLines : []) {
    const bookId = String(raw?.bookId ?? '').trim()
    if (!bookId) {
      errors.push('O linie din coș nu are produs asociat.')
      continue
    }
    const quantity = normalizeLineQuantity(raw?.quantity)
    if (quantity == null) {
      errors.push('Cantitatea unui produs din coș este invalidă.')
      continue
    }
    const book = booksById.get(bookId)
    if (!book) {
      errors.push('Un produs din coș nu mai există în catalog.')
      continue
    }
    const variantId = raw?.variantId ? String(raw.variantId) : undefined
    const price = unitPrice(book, variantId)
    if (price == null) {
      errors.push(`Varianta selectată pentru „${book.title}” nu mai este disponibilă.`)
      continue
    }
    const productType = book.product_type === 'digital' ? 'digital' : 'physical'
    const stock = availableStock(book, variantId)
    if (productType === 'physical' && stock < quantity) {
      errors.push(
        stock <= 0
          ? `„${book.title}” nu mai este în stoc.`
          : `Stoc insuficient pentru „${book.title}” (disponibile: ${stock}).`,
      )
      continue
    }
    const variant = findVariant(book, variantId)
    lines.push({
      bookId,
      title: book.title,
      author: book.author,
      price,
      quantity,
      variantId,
      variantName: variant ? String(variant.name ?? '').trim() || undefined : undefined,
      productType,
      stock,
    })
  }

  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    errors.push('Coșul nu poate fi gol.')
  }
  return { lines, errors }
}

/** Subtotal + shipping + total, rounded to bani. */
export function computeOrderTotals(lines, shippingCost) {
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100
  const shipping = Math.max(0, Math.round((Number(shippingCost) || 0) * 100) / 100)
  const total = Math.round((subtotal + shipping) * 100) / 100
  return { subtotal, shipping, total }
}
