/**
 * Runtime configuration and production guards.
 *
 * Everything security-relevant that used to fall back to a hard-coded demo
 * value now goes through here. In production a missing/insecure value throws,
 * so the process fails fast instead of running with forgeable sessions.
 */
const DEV_JWT_SECRET = 'libraria-dev-secret-change-me'

export const isProduction = process.env.NODE_ENV === 'production'

/** Signing secret for session JWTs. Never falls back to a known value in prod. */
export function getJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim()
  if (!secret || secret === DEV_JWT_SECRET) {
    if (isProduction) {
      throw new Error(
        'JWT_SECRET lipsește sau folosește valoarea demo. Setează un secret real (minim 32 de caractere).',
      )
    }
    return DEV_JWT_SECRET
  }
  if (isProduction && secret.length < 32) {
    throw new Error('JWT_SECRET trebuie să aibă minim 32 de caractere în producție.')
  }
  return secret
}

/** Session lifetime (e.g. "7d"). */
export function getTokenTtl() {
  return process.env.JWT_TTL || '7d'
}

/** Public base URL of the storefront — used for links inside emails. */
export function getPublicUrl() {
  return (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, '')
}

/** Shipping fees (RON) — courier to the door vs. EasyBox pickup point. */
export const SHIPPING_FEES = { courier: 19, easybox: 12 }

/** Origins allowed to call the API from a browser (empty = any, dev only). */
export function allowedOrigins() {
  const list = []
  if (process.env.PUBLIC_URL) list.push(process.env.PUBLIC_URL.replace(/\/+$/, ''))
  if (process.env.CORS_ORIGINS) {
    for (const item of process.env.CORS_ORIGINS.split(',')) {
      const origin = item.trim().replace(/\/+$/, '')
      if (origin) list.push(origin)
    }
  }
  return [...new Set(list)]
}

/**
 * Problems that make a production boot unsafe. Returned instead of thrown so
 * the server can log every issue at once before exiting.
 */
export function validateRuntimeConfig() {
  const problems = []
  if (!isProduction) return problems
  try {
    getJwtSecret()
  } catch (err) {
    problems.push(err.message)
  }
  if (!process.env.PUBLIC_URL) {
    problems.push('PUBLIC_URL nu este setat — linkurile din emailuri ar fi greșite.')
  }
  if (!process.env.SMTP_HOST) {
    problems.push('SMTP_HOST nu este setat — emailurile de comandă/resetare nu vor fi livrate.')
  }
  return problems
}
