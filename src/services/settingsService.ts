import type { SiteSettings } from '../config/site'
import { api } from './http'

/**
 * Owner-editable storefront settings (`/api/settings`).
 *
 * GET is public (the storefront needs the brand/contact/legal copy) and PUT is
 * admin-only. Values are merged over the built-in defaults by the provider.
 */
export const settingsService = {
  async get(): Promise<Partial<SiteSettings>> {
    return api<Partial<SiteSettings>>('/settings', { authed: false })
  },

  async save(settings: Partial<SiteSettings>): Promise<Partial<SiteSettings>> {
    return api<Partial<SiteSettings>>('/settings', { method: 'PUT', body: settings })
  },
}
