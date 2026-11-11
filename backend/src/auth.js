import jwt from 'jsonwebtoken'
import { getJwtSecret, getTokenTtl } from './config.js'

/**
 * Shared auth helpers for the Librăria backend.
 *
 * Sessions use JSON Web Tokens carrying the user id and role. The signing secret
 * is resolved lazily from the environment so a production boot without a real
 * secret fails fast instead of accepting forgeable tokens.
 */

/** Sign a token for a user row. */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: getTokenTtl() },
  )
}

/** Extract the Bearer token from the request headers, if present. */
function readBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

/**
 * Attach `req.user` when a valid token is present, but never fail the request.
 * Used by guest-friendly endpoints (order creation) where a logged-in customer
 * should be linked to their order while guests still check out.
 */
export function optionalAuth(req, _res, next) {
  const token = readBearerToken(req)
  if (!token) return next()
  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
  } catch {
    // Invalid/expired token -> treat the request as anonymous.
  }
  return next()
}

/** Express middleware: requires a valid Bearer token; attaches `req.user`. */
export function requireAuth(req, res, next) {
  const token = readBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Neautorizat.' })
  }
  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
    return next()
  } catch {
    return res.status(401).json({ error: 'Sesiune expirată sau nevalidă.' })
  }
}

/** Express middleware: requires a valid Bearer token with role `admin`. */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acces interzis.' })
    }
    return next()
  })
}
