import type { CustomerAddress } from '../types'
import { api, HttpError, NetworkError } from './http'

/**
 * Saved-address service.
 *
 * Talks to the real backend (`/api/addresses`), which persists each user's saved
 * shipping addresses in the `addresses` table. Every mutation is scoped to the
 * authenticated user via the session token.
 *
 * When the backend is unreachable (NetworkError) we transparently fall back to a
 * local per-user copy (localStorage) so the account "Adrese" tab and checkout
 * still work in offline/demo mode — matching the other services in this codebase.
 */

const ADDRESSES_KEY = 'libraria.addresses'

interface Stored {
  [userId: string]: CustomerAddress[]
}

function readStore(): Stored {
  try {
    const raw = window.localStorage.getItem(ADDRESSES_KEY)
    return raw ? (JSON.parse(raw) as Stored) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Stored): void {
  try {
    window.localStorage.setItem(ADDRESSES_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / privacy errors — fallback layer
  }
}

function readUser(userId?: string): CustomerAddress[] {
  if (!userId) return []
  return readStore()[userId] || []
}

function writeUser(userId: string, addresses: CustomerAddress[]): void {
  const store = readStore()
  store[userId] = addresses
  writeStore(store)
}

/** Map the fields the form collects into the frontend `CustomerAddress` shape. */
export function buildAddress(data: {
  label?: string
  recipient: string
  phone?: string
  address: CustomerAddress['address']
}): CustomerAddress {
  return {
    id: `addr-${Date.now()}`,
    label: data.label?.trim() || data.recipient.trim() || 'Adresă',
    recipient: data.recipient.trim(),
    phone: data.phone?.trim() || '',
    address: {
      county: data.address.county,
      locality: data.address.locality,
      street: data.address.street,
      number: data.address.number,
      block: data.address.block || undefined,
      staircase: data.address.staircase || undefined,
      floor: data.address.floor || undefined,
      apartment: data.address.apartment || undefined,
      postalCode: data.address.postalCode || undefined,
    },
  }
}

export const addressService = {
  async list(userId?: string): Promise<CustomerAddress[]> {
    try {
      return await api<CustomerAddress[]>('/addresses')
    } catch (err) {
      if (err instanceof NetworkError) return readUser(userId)
      throw err
    }
  },

  async create(
    userId: string,
    data: Parameters<typeof buildAddress>[0],
  ): Promise<CustomerAddress> {
    try {
      const created = await api<CustomerAddress>('/addresses', {
        method: 'POST',
        body: data,
      })
      // Mirror to the per-user local copy for offline history + selectors.
      writeUser(userId, [created, ...readUser(userId)])
      return created
    } catch (err) {
      if (err instanceof NetworkError) {
        const item = buildAddress(data)
        writeUser(userId, [item, ...readUser(userId)])
        return item
      }
      throw err
    }
  },

  async update(
    userId: string,
    id: string,
    data: Parameters<typeof buildAddress>[0],
  ): Promise<CustomerAddress> {
    try {
      const updated = await api<CustomerAddress>(`/addresses/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: data,
      })
      const next = readUser(userId).map((a) => (a.id === id ? updated : a))
      writeUser(userId, next)
      return updated
    } catch (err) {
      if (err instanceof NetworkError) {
        const item = buildAddress(data)
        item.id = id
        const next = readUser(userId).map((a) => (a.id === id ? item : a))
        writeUser(userId, next)
        return item
      }
      throw err
    }
  },

  async remove(userId: string, id: string): Promise<void> {
    try {
      await api(`/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' })
      writeUser(
        userId,
        readUser(userId).filter((a) => a.id !== id),
      )
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        // Already gone — treat as success so the UI can remove the row.
        writeUser(
          userId,
          readUser(userId).filter((a) => a.id !== id),
        )
        return
      }
      if (err instanceof NetworkError) {
        writeUser(
          userId,
          readUser(userId).filter((a) => a.id !== id),
        )
        return
      }
      throw err
    }
  },
}
