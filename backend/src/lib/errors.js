/**
 * Consistent API error handling.
 *
 * Routes used to echo raw database/exception messages back to the browser, which
 * leaks schema details. `serverError` logs the real cause server-side and sends
 * a neutral message to the client; `ApiError` lets a route return a specific
 * status/message on purpose (e.g. 409 out of stock).
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** True when the error is a Postgres unique-violation. */
export function isUniqueViolation(err) {
  return Boolean(err && err.code === '23505')
}

export function serverError(res, err, context = 'request') {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error(`[libraria] ${context} error:`, err)
  return res.status(500).json({ error: 'A apărut o eroare internă. Încearcă din nou.' })
}
