/**
 * SameDay Courier Client API client (used for the EasyBox pickup-points).
 *
 * The SameDay REST API is consumed server-side (never from the browser) so the
 * API credentials stay out of the frontend. Flow:
 *
 *   1. POST {SAMEDAY_API}/api/authentication
 *        headers: X-AUTH-USERNAME, X-AUTH-PASSWORD
 *        body:    { remember_me: 0|1 }
 *        -> returns an access token (valid 12 h, or 30 days with remember_me=1).
 *   2. GET  {SAMEDAY_API}/api/client/lockers
 *        header: X-AUTH-TOKEN: <token>
 *        -> returns the list of lockers (EasyBoxes).
 *
 * Configuration (env):
 *   SAMEDAY_API         Base URL of the SameDay API (defaults to the Sandbox URL).
 *   SAMEDAY_USERNAME    API username (from your SameDay account).
 *   SAMEDAY_PASSWORD    API password.
 *   SAMEDAY_REMEMBER_ME "1" to request a 30-day token instead of the 12 h one.
 *
 * When SAMEDAY_USERNAME/SAMEDAY_PASSWORD are not configured the module simply
 * serves the bundled static list marked `source: 'static'`, so the shop keeps
 * working in local/demo environments before the SameDay account is wired up.
 */

import { EASYBOXES as STATIC_EASYBOXES } from './data/easyboxes.js'

/** SameDay sandbox API (the default when SAMEDAY_API is not set). */
const DEFAULT_API = 'https://sameday-api.demo.zitec.com'

function config() {
  const api = (process.env.SAMEDAY_API || DEFAULT_API).replace(/\/+$/, '')
  const username = process.env.SAMEDAY_USERNAME || ''
  const password = process.env.SAMEDAY_PASSWORD || ''
  const rememberMe = process.env.SAMEDAY_REMEMBER_ME === '1' ? 1 : 0
  return { api, username, password, rememberMe }
}

/** True when SameDay credentials exist, i.e. a live integration is possible. */
export function isSamedayConfigured() {
  const { username, password } = config()
  return Boolean(username && password)
}

// Cache the auth token so we don't re-authenticate on every request. Kept well
// under SameDay's real expiry (12 h, or 30 days with remember_me) — 10 h is
// safe either way and a fresh token is fetched once it lapses.
let cachedToken = null
let cachedTokenAt = 0
const TOKEN_TTL_MS = 10 * 60 * 60 * 1000 // 10 h

async function authenticate() {
  const { api, username, password, rememberMe } = config()
  const res = await fetch(`${api}/api/authentication`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-AUTH-USERNAME': username,
      'X-AUTH-PASSWORD': password,
    },
    body: JSON.stringify({ remember_me: rememberMe }),
  })
  if (!res.ok) {
    throw new Error(`SameDay autentificare eșuată (${res.status}).`)
  }
  const data = await res.json().catch(() => ({}))
  const token = data?.token || data?.data?.token
  if (!token) {
    throw new Error('SameDay nu a returnat un token de acces.')
  }
  return token
}

async function getToken() {
  const now = Date.now()
  if (cachedToken && now - cachedTokenAt < TOKEN_TTL_MS) {
    return cachedToken
  }
  const token = await authenticate()
  cachedToken = token
  cachedTokenAt = now
  return token
}

/** Coerce any of the JSON shapes SameDay returns into an EasyBox object. */
function normalize(raw) {
  if (!raw || typeof raw !== 'object') return null

  const id = String(raw.id ?? raw.lockerId ?? raw.code ?? '').trim()
  if (!id) return null

  // `name` can be a plain string, `{ name }`, or missing in favour of an id.
  let name = ''
  if (typeof raw.name === 'string') name = raw.name
  else if (raw.name && typeof raw.name === 'object' && typeof raw.name.name === 'string') {
    name = raw.name.name
  }
  if (!name) name = `EasyBox ${id}`

  // `city` may be a string, `{ name }`, or an array `[{ name }]` (SameDay style).
  let city = ''
  if (typeof raw.city === 'string') city = raw.city
  else if (raw.city && typeof raw.city === 'object' && !Array.isArray(raw.city)) {
    if (typeof raw.city.name === 'string') city = raw.city.name
    else if (typeof raw.city.city === 'string') city = raw.city.city
  } else if (Array.isArray(raw.city) && raw.city[0] && typeof raw.city[0].name === 'string') {
    city = raw.city[0].name
  }
  if (!city && typeof raw.cityName === 'string') city = raw.cityName

  const address = [raw.address, raw.street, city].filter((x) => typeof x === 'string' && x).join(', ')

  // Coordinates — SameDay may return them flat (`lat`/`lng`), or nested under a
  // `latLong`/`coordinates` object, or as `{ latitude, longitude }`. We coerce
  // whatever shape is present and skip the pair otherwise.
  const toNum = (v) => {
    const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  const nested = raw.latLong && typeof raw.latLong === 'object' ? raw.latLong : null
  const coords = raw.coordinates && typeof raw.coordinates === 'object' ? raw.coordinates : null
  const lat =
    toNum(raw.lat) ??
    toNum(nested?.lat ?? nested?.latitude) ??
    toNum(coords?.lat ?? coords?.latitude)
  const lng =
    toNum(raw.lng) ??
    toNum(raw.long ?? raw.lon ?? raw.longitude) ??
    toNum(nested?.lng ?? nested?.long ?? nested?.longitude ?? nested?.lon) ??
    toNum(coords?.lng ?? coords?.long ?? coords?.longitude ?? coords?.lon)

  const out = { id, city, name, address }
  if (lat !== undefined && lng !== undefined) {
    out.lat = lat
    out.lng = lng
  }
  return out
}

/**
 * Return the list of SameDay lockers as EasyBox objects.
 *
 * @returns {Promise<{ boxes: Array<{id,city,name,address}>, source: 'sameday'|'static' }>}
 */
export async function getLockers() {
  if (!isSamedayConfigured()) {
    return { boxes: STATIC_EASYBOXES.map((e) => ({ ...e })), source: 'static' }
  }

  const { api } = config()
  const token = await getToken()
  const res = await fetch(`${api}/api/client/lockers`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-AUTH-TOKEN': token,
    },
  })
  if (!res.ok) {
    throw new Error(`SameDay nu a putut încărca lockerele (${res.status}).`)
  }

  const data = await res.json().catch(() => null)
  // The response may be `{ lockers: [...] }`, `{ data: [...] }`, or a bare array.
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.lockers)
      ? data.lockers
      : Array.isArray(data?.data)
        ? data.data
        : []

  const boxes = list.map(normalize).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error('SameDay nu a returnat niciun locker.')
  }
  return { boxes, source: 'sameday' }
}

/** Resolve a single locker by id (live API first, then the bundled list). */
export async function findLocker(id) {
  if (!id) return null
  try {
    const { boxes } = await getLockers()
    const hit = boxes.find((b) => String(b.id) === String(id))
    if (hit) return hit
  } catch {
    // fall through to the static list
  }
  return STATIC_EASYBOXES.find((e) => String(e.id) === String(id)) || null
}

