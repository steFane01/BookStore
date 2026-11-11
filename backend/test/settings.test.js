import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeSettings, shippingFeesFromSettings } from '../src/settings.js'

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

test('shipping fees use the owner values and fall back on invalid input', () => {
  assert.deepEqual(shippingFeesFromSettings({}), { courier: 19, easybox: 12, fanbox: 12 })
  assert.deepEqual(
    shippingFeesFromSettings({
      shippingFeeCourier: '25',
      shippingFeeEasybox: '10,5',
      shippingFeeFanbox: '0',
    }),
    { courier: 25, easybox: 10.5, fanbox: 0 },
  )
  assert.deepEqual(
    shippingFeesFromSettings({
      shippingFeeCourier: '-3',
      shippingFeeEasybox: 'abc',
      shippingFeeFanbox: '999',
    }),
    { courier: 19, easybox: 12, fanbox: 12 },
  )
})
