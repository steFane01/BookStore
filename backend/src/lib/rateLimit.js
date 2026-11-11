/**
 * Minimal in-memory rate limiter (no external dependency).
 *
 * Protects the public write/credential endpoints (login, register, password
 * reset, contact form, newsletter, order creation) from brute force and email
 * bombing. Counters live per process: for a single-container deployment this is
 * exactly the protection needed; several instances would need a shared store.
 */
export function rateLimit({ windowMs = 15 * 60_000, max = 20, message } = {}) {
  const hits = new Map()
  const limitMessage =
    message || 'Prea multe cereri. Așteaptă câteva minute și încearcă din nou.'

  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, Math.min(windowMs, 60_000))
  if (typeof timer.unref === 'function') timer.unref()

  return function rateLimiter(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return res.status(429).json({ error: limitMessage })
    }
    return next()
  }
}
