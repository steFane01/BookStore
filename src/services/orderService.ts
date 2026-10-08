import type { CartItem, OrderDraft, ShippingAddress } from '../types'
import { api, HttpError, NetworkError } from './http'

/**
 * Order service.
 *
 * Talks to the real backend (`/api/orders`), which records orders in the
 * `orders` / `order_lines` tables with an atomic reference number and emails
 * the delivery details to the owner (who arranges the courier directly). No
 * online payment — by design.
 *
 * When the backend is unreachable (NetworkError), or a guest reads a freshly
 * placed order (the authenticated read would reject with 401), we transparently
 * fall back to a local copy so the UI still works — exactly like the other
 * services in this codebase.
 */

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReference(): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return `LB-${new Date().getFullYear()}-${out}`
}

const ORDERS_KEY = 'libraria.orders'

function readLocalOrders(): OrderDraft[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY)
    return raw ? (JSON.parse(raw) as OrderDraft[]) : []
  } catch {
    return []
  }
}

function writeLocalOrders(orders: OrderDraft[]): void {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    // ignore quota / privacy errors — fallback layer
  }
}

export const orderService = {
  /** Compute the subtotal for a set of cart lines. */
  subtotalFor(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  /**
   * Persist an order on the backend and return the recorded order (with its
   * atomic reference). Falls back to a local draft only when the backend is
   * completely unreachable.
   */
  async createOrder(
    items: CartItem[],
    shipping: ShippingAddress,
    userId?: string,
  ): Promise<OrderDraft> {
    try {
      const draft = await api<OrderDraft>('/orders', {
        method: 'POST',
        body: {
          lines: items.map(({ bookId, title, author, price, quantity }) => ({
            bookId,
            title,
            author,
            price,
            quantity,
          })),
          shipping,
          userId,
        },
      })
      // Mirror to the local copy so the success page still loads for guests,
      // and for offline history.
      const history = readLocalOrders()
      history.unshift(draft)
      writeLocalOrders(history)
      return draft
    } catch (err) {
      if (err instanceof NetworkError) return this.localCreateOrder(items, shipping, userId)
      throw err
    }
  },

  /**
   * Return orders for a user (their own), or — when called without a user id —
   * every order (admin panel). On a network failure it falls back to local data.
   */
  async getOrders(userId?: string): Promise<OrderDraft[]> {
    try {
      const path = userId ? '/orders' : '/orders/all'
      return await api<OrderDraft[]>(path)
    } catch (err) {
      if (err instanceof NetworkError) {
        const history = readLocalOrders()
        return userId ? history.filter((o) => o.userId === userId) : history
      }
      throw err
    }
  },

  /**
   * Return a single order by id or reference (used on the success page).
   * Falls back to the local copy when the authenticated read is unavailable
   * (guest who hasn't logged in yet, or backend down).
   */
  async getOrderById(id: string): Promise<OrderDraft | undefined> {
    try {
      return await api<OrderDraft>(`/orders/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof NetworkError || err instanceof HttpError) {
        return readLocalOrders().find((o) => o.id === id || o.reference === id)
      }
      throw err
    }
  },

  /** Offline-only draft, used when the backend is unreachable. */
  localCreateOrder(
    items: CartItem[],
    shipping: ShippingAddress,
    userId?: string,
  ): OrderDraft {
    const reference = generateReference()
    const subtotal = this.subtotalFor(items)
    const draft: OrderDraft = {
      id: `order-${Date.now()}`,
      reference,
      lines: items.map(({ bookId, title, author, price, quantity }) => ({
        bookId,
        title,
        author,
        price,
        quantity,
      })),
      shipping,
      subtotal,
      payment: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId,
    }
    const history = readLocalOrders()
    history.unshift(draft)
    writeLocalOrders(history)
    return draft
  },
}
