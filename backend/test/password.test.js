import test from 'node:test'
import assert from 'node:assert/strict'
import { PASSWORD_MAX_LENGTH, validatePassword } from '../src/lib/password.js'

test('validatePassword accepts strong passwords', () => {
  for (const value of ['Parola123!', 'ĂÂÎȘȚĂ1!', 'Abcdefg1$', 'X9#abcdef']) {
    assert.deepEqual(validatePassword(value), { ok: true }, value)
  }
})

test('validatePassword enforces the elementary rules', () => {
  assert.equal(validatePassword('Par1!').ok, false) // too short
  assert.equal(validatePassword('parola123!').ok, false) // no uppercase
  assert.equal(validatePassword('Parolabuna!').ok, false) // no digit
  assert.equal(validatePassword('Parola1234').ok, false) // no special character
  assert.equal(validatePassword('').ok, false)
  assert.equal(validatePassword(null).ok, false)
})

test('validatePassword rejects overly long passwords', () => {
  const atLimit = `Aa1!${'a'.repeat(PASSWORD_MAX_LENGTH - 4)}`
  assert.equal(atLimit.length, PASSWORD_MAX_LENGTH)
  assert.deepEqual(validatePassword(atLimit), { ok: true })
  assert.equal(validatePassword(`${atLimit}a`).ok, false)
})

test('validatePassword messages can target the new password', () => {
  const result = validatePassword('parola123!', 'Parola nouă')
  assert.equal(result.ok, false)
  assert.match(result.error, /^Parola nouă trebuie/)
})
