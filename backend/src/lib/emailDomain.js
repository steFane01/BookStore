/**
 * Email domain verification.
 *
 * Format checks alone accept addresses like `cineva@nu-exista.ro`; here the
 * domain is resolved through DNS (MX first, then A/AAAA per RFC 5321). Results
 * are cached in memory for 10 minutes so a checkout/registration does not pay
 * the DNS round-trip twice.
 *
 * Transient resolver failures (temporary DNS outage) fail **open** — blocking
 * all sign-ups during a resolver hiccup would hurt real customers more than the
 * occasional fake address.
 */
import { promises as dns } from 'node:dns'
import { domainToASCII } from 'node:url'
import { isEmail } from './text.js'

const CACHE_TTL_MS = 10 * 60_000
const DEFAULT_TIMEOUT_MS = 2500

const MISSING_CODES = new Set(['ENOTFOUND', 'ENODATA', 'ENONAME', 'NXDOMAIN', 'NODATA'])
const defaultCache = new Map()

export const EMAIL_DOMAIN_ERRORS = {
  format: 'Adresa de email nu este validă.',
  domain: 'Domeniul adresei de email nu este valid.',
  'not-found': 'Domeniul adresei de email nu există sau nu poate primi emailuri. Verifică adresa.',
}

/** The part after the last `@`, lowercased and without a trailing dot. */
export function emailDomain(email) {
  const value = String(email ?? '').trim()
  const at = value.lastIndexOf('@')
  if (at <= 0 || at === value.length - 1) return ''
  return value
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
}

/** Syntax/IDN check for a domain name (no DNS lookup). */
export function isPlausibleDomain(domain) {
  const ascii = domainToASCII(String(domain ?? '').trim())
  if (!ascii || ascii.length > 253) return false
  const labels = ascii.split('.')
  if (labels.length < 2) return false
  const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
  if (!labels.every((label) => validLabel.test(label))) return false
  const tld = labels[labels.length - 1]
  return /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(tld)
}

function isMissing(error) {
  return Boolean(error && typeof error === 'object' && MISSING_CODES.has(error.code))
}

/** Resolve MX/A/AAAA; returns `{ ok, uncertain }`. */
async function lookupDomain(domain, resolver) {
  let transient = false

  const tryResolve = async (method) => {
    if (typeof resolver?.[method] !== 'function') return false
    try {
      const records = await resolver[method](domain)
      return Array.isArray(records) && records.length > 0
    } catch (err) {
      if (!isMissing(err)) transient = true
      return false
    }
  }

  if (await tryResolve('resolveMx')) return { ok: true, uncertain: false }
  if (await tryResolve('resolve4')) return { ok: true, uncertain: false }
  if (await tryResolve('resolve6')) return { ok: true, uncertain: false }
  // Temporary DNS problems must not block real customers.
  if (transient) return { ok: true, uncertain: true }
  return { ok: false, uncertain: false }
}

function withTimeout(promise, timeoutMs) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ ok: true, uncertain: true }), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Verify that an address is well formed AND its domain can receive mail.
 * Returns `{ ok, reason?, error? }`. `reason` is `format` / `domain` /
 * `not-found`; uncertain (timeout) results are allowed and not cached.
 */
export async function verifyEmail(
  email,
  { resolver = dns, cache = defaultCache, timeoutMs = DEFAULT_TIMEOUT_MS, now = Date.now() } = {},
) {
  const value = String(email ?? '').trim()
  if (!isEmail(value)) {
    return { ok: false, reason: 'format', error: EMAIL_DOMAIN_ERRORS.format }
  }

  const domain = emailDomain(value)
  if (!isPlausibleDomain(domain)) {
    return { ok: false, reason: 'domain', error: EMAIL_DOMAIN_ERRORS.domain }
  }

  const cached = cache.get(domain)
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.result

  const lookup = await withTimeout(lookupDomain(domain, resolver), timeoutMs)
  const result = lookup.ok
    ? { ok: true }
    : { ok: false, reason: 'not-found', error: EMAIL_DOMAIN_ERRORS['not-found'] }

  if (!lookup.uncertain) cache.set(domain, { at: now, result })
  return result
}
