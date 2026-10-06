import jwt from 'jsonwebtoken'

/**
 * Shared auth helpers for the Librăria backend.
 *
 * Sessions use short-lived JSON Web Tokens carrying the user id and role.
 * The secret comes from the environment (never committed; see `.env.example`).
 */
const JWT_SECRET = process.env.JWT_SECRET || 'libraria-dev-secret-change-me'
const TOKEN_TTL = process.env.JWT_TTL || '7d'

/** Sign a token for a user row. */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  )
}

/** Express middleware: requires a valid Bearer token; attaches `req.user`. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Neautorizat.' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
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
