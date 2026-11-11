import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeSettings } from '../src/settings.js'

test('only whitelisted settings keys are stored', () => {
  const result = sanitizeSettings({ brandName: '  RV  ', hackerKey: 'x', contactEmail: 'a@b.ro' })
  assert.deepEqual(result, { brandName: 'RV', contactEmail: 'a@b.ro' })
})

test('empty values are dropped and input is coerced to strings', () => {
  const result = sanitizeSettings({ tagline: '   ', contactPhone: 12345 })
  assert.deepEqual(result, { contactPhone: '12345' })
})

test('non-object input yields an empty object', () => {
  assert.deepEqual(sanitizeSettings(null), {})
  assert.deepEqual(sanitizeSettings('nope'), {})
})
