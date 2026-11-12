import test from 'node:test'
import assert from 'node:assert/strict'
import { emailDomain, isPlausibleDomain, verifyEmail } from '../src/lib/emailDomain.js'

const MX = [{ exchange: 'mx.exemplu.ro', priority: 1 }]

function dnsError(code) {
  const error = new Error(code)
  error.code = code
  throw error
}

/** Fake resolver with the same methods `node:dns` exposes. */
function fakeResolver({ mx = null, a = null, aaaa = null, code = null } = {}) {
  return {
    resolveMx: async () => {
      if (code) dnsError(code)
      if (mx) return mx
      dnsError('ENODATA')
    },
    resolve4: async () => {
      if (code) dnsError(code)
      if (a) return a
      dnsError('ENOTFOUND')
    },
    resolve6: async () => {
      if (code) dnsError(code)
      if (aaaa) return aaaa
      dnsError('ENOTFOUND')
    },
  }
}

test('emailDomain extracts the domain after the last @', () => {
  assert.equal(emailDomain('Cineva@Exemplu.RO'), 'exemplu.ro')
  assert.equal(emailDomain('a.b+c@sub.exemplu.ro.'), 'sub.exemplu.ro')
  assert.equal(emailDomain('fara-arroba'), '')
  assert.equal(emailDomain('@exemplu.ro'), '')
  assert.equal(emailDomain('ion@'), '')
})

test('isPlausibleDomain accepts real-looking domains only', () => {
  assert.equal(isPlausibleDomain('gmail.com'), true)
  assert.equal(isPlausibleDomain('sub.exemplu.ro'), true)
  assert.equal(isPlausibleDomain('xn--domeniu-9ta.ro'), true)
  assert.equal(isPlausibleDomain('localhost'), false)
  assert.equal(isPlausibleDomain('exemplu'), false)
  assert.equal(isPlausibleDomain('exemplu.123'), false)
  assert.equal(isPlausibleDomain('-exemplu.ro'), false)
  assert.equal(isPlausibleDomain('exemplu-.ro'), false)
  assert.equal(isPlausibleDomain('a..ro'), false)
  assert.equal(isPlausibleDomain(''), false)
})

test('verifyEmail rejects invalid format and implausible domains without DNS', async () => {
  let called = false
  const resolver = {
    resolveMx: async () => {
      called = true
      return MX
    },
  }
  const format = await verifyEmail('nu-e-email', { resolver, cache: new Map() })
  assert.equal(format.ok, false)
  assert.equal(format.reason, 'format')

  const domain = await verifyEmail('ion@exemplu.123', { resolver, cache: new Map() })
  assert.equal(domain.ok, false)
  assert.equal(domain.reason, 'domain')
  assert.equal(called, false)
})

test('verifyEmail accepts a domain with MX records', async () => {
  const result = await verifyEmail('ion@exemplu.ro', {
    resolver: fakeResolver({ mx: MX }),
    cache: new Map(),
  })
  assert.deepEqual(result, { ok: true })
})

test('verifyEmail falls back to A/AAAA records when there is no MX', async () => {
  const result = await verifyEmail('ion@exemplu.ro', {
    resolver: fakeResolver({ a: ['93.184.216.34'] }),
    cache: new Map(),
  })
  assert.deepEqual(result, { ok: true })
})

test('verifyEmail rejects a domain that does not resolve', async () => {
  const result = await verifyEmail('ion@nu-exista.ro', {
    resolver: fakeResolver(),
    cache: new Map(),
  })
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'not-found')
  assert.match(result.error, /nu există/)
})

test('verifyEmail fails open on temporary DNS errors', async () => {
  const result = await verifyEmail('ion@exemplu.ro', {
    resolver: fakeResolver({ code: 'EAI_AGAIN' }),
    cache: new Map(),
  })
  assert.deepEqual(result, { ok: true })
})

test('verifyEmail caches definitive results', async () => {
  let calls = 0
  const resolver = {
    resolveMx: async () => {
      calls += 1
      return MX
    },
    resolve4: async () => dnsError('ENOTFOUND'),
    resolve6: async () => dnsError('ENOTFOUND'),
  }
  const cache = new Map()
  await verifyEmail('ion@exemplu.ro', { resolver, cache })
  await verifyEmail('ion@exemplu.ro', { resolver, cache })
  assert.equal(calls, 1)
})

test('verifyEmail allows the address when the lookup times out', async () => {
  const never = new Promise(() => {})
  const resolver = { resolveMx: () => never }
  const result = await verifyEmail('ion@exemplu.ro', {
    resolver,
    cache: new Map(),
    timeoutMs: 20,
  })
  assert.deepEqual(result, { ok: true })
})
