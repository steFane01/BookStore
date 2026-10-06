/**
 * Minimal HTTP client for the Librăria frontend services.
 *
 * Every call goes to the same-origin `/api` path (proxied by nginx in the
 * Docker build, or by the Vite dev server via `server.proxy`). The current
 * session token, when present, is attached as an `Authorization: Bearer` header
 * so the backend can authorize admin/book-mutation endpoints.
 */

export const TOKEN_KEY = 'libraria.session-token'

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

/** True when the current environment talks to a reachable backend. */
let backendKnownUnreachable = false
export function backendAvailable(): boolean {
  return !backendKnownUnreachable
}

/**
 * Thrown when the backend could not be reached at all (network/DNS error), as
 * opposed to the backend answering with an HTTP error (401/404/422/500…).
 * Callers use this to decide whether it is safe to fall back to mock data.
 */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    const message = cause instanceof Error ? cause.message : 'Rețeaua nu este disponibilă.'
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * Thrown when the backend answered with a non-2xx response. Carries the HTTP
 * status so callers can react precisely (e.g. treat 404 as "not found").
 */
export class HttpError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Attach the auth token (default true). */
  authed?: boolean
}

/**
 * Perform an API request. Throws an Error with the backend's `error` message
 * (or a generic fallback) on failure. Marks the backend unreachable on network
 * errors so callers can transparently fall back to mock data.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authed = true } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authed) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    backendKnownUnreachable = true
    throw new NetworkError(err) // network/DNS failure — backend truly unreachable
  }

  backendKnownUnreachable = false

  if (res.status === 204) return undefined as T

  // A 401 from any authed endpoint means the stored session token is missing,
  // invalid or expired. Drop it so the app doesn't keep trying a stale token
  // forever (which previously left the admin page spinning "pending" endlessly).
  // The AuthContext restores/redirects the user based on the resulting state.
  if (res.status === 401 && authed) {
    setToken(null)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data && typeof data.error === 'string' ? data.error : `Cerere eșuată (${res.status}).`
    throw new HttpError(message, res.status)
  }
  return data as T
}
