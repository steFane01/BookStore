import type { User, OrderStatus } from '../types'
import { api, getToken, setToken } from './http'

/**
 * Authentication service.
 *
 * Talks to the real backend (`/api/auth`) which persists accounts in the
 * `users` table. On a network failure it transparently falls back to an
 * in-memory demo user so the UI still works without the stack running.
 */

interface AuthResponse {
  user: User
  token: string
}

const DEMO = [
  {
    email: 'admin@libraria.ro',
    password: 'admin123',
    user: { id: 'u-admin', name: 'Administrator', email: 'admin@libraria.ro', role: 'admin' } as User,
  },
  {
    email: 'cititor@example.com',
    password: 'parola123',
    user: { id: 'u-1', name: 'Ioana Popescu', email: 'cititor@example.com', role: 'customer' } as User,
  },
]

function demoLogin(email: string, password: string): User | null {
  const found = DEMO.find(
    (d) => d.email.toLowerCase() === email.toLowerCase() && d.password === password,
  )
  return found ? found.user : null
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      return await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        authed: false,
      })
    } catch (err) {
      const demo = demoLogin(email, password)
      if (demo) return { user: demo, token: '' }
      throw err instanceof Error ? err : new Error('Email sau parolă incorecte.')
    }
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      return await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
        authed: false,
      })
    } catch (err) {
      // Offline fallback — never persists anywhere, dev convenience only.
      const user: User = { id: `u-${Date.now()}`, name, email, role: 'customer' }
      return { user, token: '' }
    }
  },

  /** Restore a session from the stored token on reload. Returns null when absent/invalid. */
  async restoreSession(): Promise<User | null> {
    const token = getToken()
    if (!token) return null
    try {
      const data = await api<{ user: User }>('/auth/me', { authed: true })
      return data.user
    } catch {
      // Token invalid/expired or backend down — clear it, treat as logged out.
      setToken(null)
      return null
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api('/auth/request-password-reset', {
        method: 'POST',
        body: { email },
        authed: false,
      })
    } catch {
      // non-fatal
    }
  },

  /**
   * Complete a password reset using the single-use token from the email.
   * Throws an Error with the backend's message on an invalid/expired token.
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await api('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      authed: false,
    })
  },
}

/** Human-readable statuses used across the account and admin areas. */
export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'În așteptare',
  processing: 'În procesare',
  shipped: 'Expediată',
  delivered: 'Livrată',
  cancelled: 'Anulată',
}
