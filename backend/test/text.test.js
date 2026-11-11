import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanString, escapeHtml, isEmail } from '../src/lib/text.js'

test('escapeHtml neutralises markup and quotes', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  assert.equal(escapeHtml("Tom & Jerry's"), 'Tom &amp; Jerry&#39;s')
  assert.equal(escapeHtml(null), '')
})

test('isEmail accepts normal addresses and rejects junk', () => {
  assert.equal(isEmail('client@example.ro'), true)
  assert.equal(isEmail('  client@example.ro  '), true)
  assert.equal(isEmail('client@example'), false)
  assert.equal(isEmail('client example@test.ro'), false)
  assert.equal(isEmail(null), false)
})

test('cleanString trims and caps length', () => {
  assert.equal(cleanString('  text  '), 'text')
  assert.equal(cleanString('abcdef', 3), 'abc')
  assert.equal(cleanString(undefined), '')
})
