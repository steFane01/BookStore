import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { defaultSettings, type SiteSettings } from '../config/site'
import { settingsService } from '../services/settingsService'

interface SettingsContextValue {
  settings: SiteSettings
  /** True once the first fetch finished (successfully or not). */
  loaded: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const remote = await settingsService.get()
      setSettings({ ...defaultSettings, ...remote })
    } catch {
      // Offline: keep the defaults so the storefront still renders.
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Keep the document title in sync with the brand until a page overrides it.
  useEffect(() => {
    if (!loaded) return
    if (!document.title || document.title.includes('Librăria')) {
      document.title = `${settings.brandName} — ${settings.tagline}`
    }
  }, [loaded, settings.brandName, settings.tagline])

  const value = useMemo<SettingsContextValue>(() => ({ settings, loaded, refresh }), [settings, loaded, refresh])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
