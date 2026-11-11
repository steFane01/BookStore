import type { OrderStatus, User } from '../types'
import { api, getToken, setToken } from './http'

/**
 * Authentication service — real API only.
 *
 * All demo/offline credentials were removed: a failed request now surfaces the
 * backend's error instead of silently signing the visitor into a fake account.
 */

interface AuthResponse {
  user: User
  token: string
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    return api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      authed: false,
    })
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      authed: false,
    })
  },

  /** Restore a session from the stored token on reload. Returns null when absent/invalid. */
  async restoreSession(): Promise<User | null> {
    const token = getToken()
    if (!token) return null
    try {
      const data = await api<{ user: User }>('/auth/me')
      return data.user
    } catch {
      setToken(null)
      return null
    }
  },

  /** Request a password-reset email. Throws on invalid input (e.g. bad email). */
  async requestPasswordReset(email: string): Promise<void> {
    await api('/auth/request-password-reset', {
      method: 'POST',
      body: { email },
      authed: false,
    })
  },

  /** Complete a password reset using the single-use token from the email. */
  async resetPassword(token: string, password: string): Promise<void> {
    await api('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      authed: false,
    })
  },

  /** Update the signed-in customer's display name. */
  async updateProfile(name: string): Promise<User> {
    const data = await api<{ user: User }>('/auth/me', { method: 'PATCH', body: { name } })
    return data.user
  },

  /** Change the password of the signed-in account. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
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
