import test from 'node:test'
import assert from 'node:assert/strict'
import {
  availableStock,
  computeOrderTotals,
  normalizeLineQuantity,
  resolveOrderLines,
  unitPrice,
} from '../src/lib/pricing.js'

const catalog = new Map([
  [
    'book-1',
    {
      id: 'book-1',
      title: 'Carte',
      author: 'Autor',
      price: '49.99',
      stock: 5,
      product_type: 'physical',
      variants: [],
    },
  ],
  [
    'digital-1',
    {
      id: 'digital-1',
      title: 'Curs digital',
      author: 'Autor',
      price: 100,
      stock: 0,
      product_type: 'digital',
      variants: [],
      digital_file_url: '/uploads/curs.pdf',
    },
  ],
  [
    'variant-1',
    {
      id: 'variant-1',
      title: 'Gravura',
      author: 'Autor',
      price: 50,
      stock: 1,
      product_type: 'physical',
      variants: [{ id: 'v1', name: 'A3', priceDelta: 20, stock: 2 }],
    },
  ],
])

test('the price always comes from the catalog, never from the browser', () => {
  const { lines, errors } = resolveOrderLines(
    [{ bookId: 'book-1', title: 'X', author: 'Y', price: 0.01, quantity: 2 }],
    catalog,
  )
  assert.deepEqual(errors, [])
  assert.equal(lines[0].price, 49.99)
  assert.equal(lines[0].title, 'Carte')
})

test('rejects quantities outside the allowed range', () => {
  assert.equal(normalizeLineQuantity(1), 1)
  assert.equal(normalizeLineQuantity(99), 99)
  assert.equal(normalizeLineQuantity(0), null)
  assert.equal(normalizeLineQuantity(-2), null)
  assert.equal(normalizeLineQuantity(1.5), null)
  assert.equal(normalizeLineQuantity(100), null)

  const { errors } = resolveOrderLines([{ bookId: 'book-1', quantity: 0 }], catalog)
  assert.equal(errors.length, 1)
})

test('stops the order when stock is insufficient', () => {
  const { lines, errors } = resolveOrderLines([{ bookId: 'book-1', quantity: 6 }], catalog)
  assert.equal(lines.length, 0)
  assert.match(errors[0], /Stoc insuficient/)
})

test('digital products need no stock', () => {
  const { lines, errors } = resolveOrderLines([{ bookId: 'digital-1', quantity: 3 }], catalog)
  assert.deepEqual(errors, [])
  assert.equal(lines[0].productType, 'digital')
  assert.equal(lines[0].price, 100)
})

test('variant price delta and variant stock are applied', () => {
  const { lines, errors } = resolveOrderLines(
    [{ bookId: 'variant-1', variantId: 'v1', quantity: 2 }],
    catalog,
  )
  assert.deepEqual(errors, [])
  assert.equal(lines[0].price, 70)
  assert.equal(lines[0].variantName, 'A3')
  assert.equal(lines[0].stock, 2)
})

test('an unknown variant is rejected', () => {
  const { errors } = resolveOrderLines(
    [{ bookId: 'variant-1', variantId: 'nope', quantity: 1 }],
    catalog,
  )
  assert.equal(errors.length, 1)
  assert.match(errors[0], /nu mai este disponibilă/)
})

test('an unknown product is rejected', () => {
  const { errors } = resolveOrderLines([{ bookId: 'missing', quantity: 1 }], catalog)
  assert.match(errors[0], /nu mai există/)
})

test('an empty cart is rejected', () => {
  const { errors } = resolveOrderLines([], catalog)
  assert.match(errors[0], /Coșul nu poate fi gol/)
})

test('unit price and stock helpers fall back to the book values', () => {
  const book = catalog.get('variant-1')
  assert.equal(unitPrice(book), 50)
  assert.equal(availableStock(book), 1)
  assert.equal(unitPrice(book, 'v1'), 70)
  assert.equal(availableStock(book, 'v1'), 2)
})

test('totals are rounded to bani', () => {
  const lines = [
    { price: 49.99, quantity: 3 },
    { price: 0.1, quantity: 1 },
  ]
  const { subtotal, shipping, total } = computeOrderTotals(lines, 19)
  assert.equal(subtotal, 150.07)
  assert.equal(shipping, 19)
  assert.equal(total, 169.07)
})
