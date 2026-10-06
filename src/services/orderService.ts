import type { CartItem, OrderDraft, ShippingAddress } from '../types'
import { mockLatency } from './bookService'

/**
 * Mock order service.
 *
 * `createOrder` does NOT process payment (by design — no online payment in
 * this frontend build). It simply records the draft and returns a reference
 * number, exactly as a future backend endpoint would.
 */

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const orderService = {
  /**
   * Compute the subtotal for a set of cart lines.
   */
  subtotalFor(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  /**
   * Persist an order draft. Returns the created draft with a mock reference.
   */
  async createOrder(
    items: CartItem[],
    shipping: ShippingAddress,
    userId?: string,
  ): Promise<OrderDraft> {
    await mockLatency(900)

    const reference = `LB-${new Date().getFullYear()}-${generateReference()}`
    const subtotal = this.subtotalFor(items)

    const draft: OrderDraft = {
      id: `order-${Date.now()}`,
      reference,
      lines: items.map((item) => ({
        bookId: item.bookId,
        title: item.title,
        author: item.author,
        price: item.price,
        quantity: item.quantity,
      })),
      shipping,
      subtotal,
      payment: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId,
    }

    // Persist to localStorage so the order appears in the account area.
    const history = readLocalOrders()
    history.unshift(draft)
    writeLocalOrders(history)

    return draft
  },

  /**
   * Return orders for a user (or all mock orders when no user given).
   */
  async getOrders(userId?: string): Promise<OrderDraft[]> {
    await mockLatency(500)
    const history = readLocalOrders()
    if (!userId) return history
    return history.filter((o) => o.userId === userId)
  },

  /**
   * Return a single order by its id (used on the success page).
   */
  async getOrderById(id: string): Promise<OrderDraft | undefined> {
    await mockLatency(300)
    return readLocalOrders().find((o) => o.id === id || o.reference === id)
  },
}

export function generateReference(length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
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
    // ignore quota / privacy errors — mock layer
  }
}
