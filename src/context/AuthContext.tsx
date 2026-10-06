import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '../types'
import { authService } from '../services/authService'
import { getToken, setToken } from '../services/http'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  /** Request a password reset; resolves silently (mock only). */
  requestPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'libraria.session-user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = window.localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await authService.login(email, password)
    if (token) setToken(token)
    setUser(u)
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(u))
    } catch {
      // ignore
    }
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: u, token } = await authService.register(name, email, password)
      if (token) setToken(token)
      setUser(u)
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(u))
      } catch {
        // ignore
      }
    },
    [],
  )

  // Restore a persistent session from the stored token (e.g. after a reload).
  useEffect(() => {
    let active = true
    if (!getToken()) return
    authService.restoreSession().then((u) => {
      if (active && u) setUser(u)
    })
    return () => {
      active = false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    try {
      window.localStorage.removeItem(USER_KEY)
    } catch {
      // ignore
    }
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    await authService.requestPasswordReset(email)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      requestPasswordReset,
    }),
    [user, login, register, logout, requestPasswordReset],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
