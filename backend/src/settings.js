/**
 * Storefront settings (owner-editable content), persisted in `site_settings`.
 *
 * The frontend sends the whole settings object; we whitelist the known keys so
 * nothing unexpected can be stored or rendered later. Values are short strings
 * (brand copy, contact details, legal company data).
 */
import { pool } from './db.js'

/** Keys the owner may edit from the admin panel. */
export const SETTINGS_KEYS = [
  'brandName',
  'brandNameLong',
  'tagline',
  'description',
  'heroImage',
  'heroAlt',
  'logoImage',
  'contactEmail',
  'contactPhone',
  'instagram',
  'facebook',
  'newsletter',
  'legalCompany',
  'legalCui',
  'legalRegCom',
  'legalAddress',
  'legalEmail',
  'deliveryInfo',
  'paymentInfo',
  'returnsInfo',
  'aboutText',
]

const MAX_VALUE_LENGTH = 4000
const CACHE_TTL_MS = 10_000
let cache = { at: 0, data: {} }

/** Keep only whitelisted keys, trimmed, as strings. */
export function sanitizeSettings(input) {
  const out = {}
  if (!input || typeof input !== 'object') return out
  for (const key of SETTINGS_KEYS) {
    if (!(key in input)) continue
    const raw = input[key]
    if (raw == null) continue
    const value = String(raw).trim().slice(0, MAX_VALUE_LENGTH)
    if (value) out[key] = value
  }
  return out
}

/** Current settings (cached briefly; empty object means "use defaults"). */
export async function getSettings({ force = false } = {}) {
  if (!force && Date.now() - cache.at < CACHE_TTL_MS) return cache.data
  try {
    const { rows } = await pool.query('SELECT data FROM site_settings WHERE id = 1')
    const data = rows[0]?.data
    cache = { at: Date.now(), data: data && typeof data === 'object' ? data : {} }
  } catch (err) {
    // The storefront must keep working even before the table exists.
    console.warn('[libraria] settings unavailable:', err.message)
    cache = { at: Date.now(), data: {} }
  }
  return cache.data
}

/** Replace the settings object (admin only). */
export async function saveSettings(input) {
  const data = sanitizeSettings(input)
  await pool.query(
    `INSERT INTO site_settings (id, data) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(data)],
  )
  cache = { at: Date.now(), data }
  return data
}

/** Brand name used in email subjects/bodies, with a safe fallback. */
export async function getSiteName(fallback = 'RV STUDIO') {
  const settings = await getSettings()
  const name = typeof settings.brandName === 'string' ? settings.brandName.trim() : ''
  return name || fallback
}
