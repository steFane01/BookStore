import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanImageUrl } from '../src/lib/imageUrl.js'

test('cleanImageUrl accepts same-origin paths and http(s) urls', () => {
  assert.equal(cleanImageUrl('/uploads/colectii/carti.jpg'), '/uploads/colectii/carti.jpg')
  assert.equal(cleanImageUrl('  /welcomepage.jpeg  '), '/welcomepage.jpeg')
  assert.equal(cleanImageUrl('https://cdn.exemplu.ro/poza.jpg'), 'https://cdn.exemplu.ro/poza.jpg')
  assert.equal(cleanImageUrl('HTTP://exemplu.ro/x.png'), 'HTTP://exemplu.ro/x.png')
})

test('cleanImageUrl rejects unsafe or empty values', () => {
  assert.equal(cleanImageUrl(''), '')
  assert.equal(cleanImageUrl(null), '')
  assert.equal(cleanImageUrl('javascript:alert(1)'), '')
  assert.equal(cleanImageUrl('data:image/png;base64,AAAA'), '')
  assert.equal(cleanImageUrl('uploads/fara-slash.jpg'), '')
})

test('cleanImageUrl caps very long urls', () => {
  const long = `https://exemplu.ro/${'a'.repeat(600)}.jpg`
  assert.equal(cleanImageUrl(long).length, 500)
})
