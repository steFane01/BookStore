import type { CartItem, DeliveryMethod, OrderDraft, OrderStatus, ShippingAddress } from '../types'
import { api } from './http'
import { SHIPPING_FEES } from '../data/easyboxes'

/** Extra order options chosen in checkout (delivery method + SameDay EasyBox). */
export interface OrderOptions {
  deliveryMethod: DeliveryMethod
  easyboxId?: string
  /** Shipping fee (RON); the backend clamps it to the known rate. */
  shippingCost: number
}

/**
 * Order service — real backend only.
 *
 * The backend re-prices every line from the catalog and reserves stock, so the
 * cart sent from here is a request, not an authority.
 */
export const orderService = {
  /** Compute the subtotal for a set of cart lines (display only). */
  subtotalFor(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  /** Grand total = subtotal + shipping fee for the chosen delivery method. */
  totalFor(items: CartItem[], shippingCost: number): number {
    return this.subtotalFor(items) + shippingCost
  },

  /** Default shipping fee for a delivery method (mirrors the backend). */
  shippingFeeFor(method: DeliveryMethod): number {
    return SHIPPING_FEES[method]
  },

  /** Place an order. Guests are allowed; a session token links it to the account. */
  async createOrder(
    items: CartItem[],
    shipping: ShippingAddress,
    _userId: string | undefined,
    options: OrderOptions,
  ): Promise<OrderDraft> {
    return api<OrderDraft>('/orders', {
      method: 'POST',
      body: {
        lines: items.map(
          ({ bookId, title, author, price, quantity, variantId, variantName, productType }) => ({
            bookId,
            title,
            author,
            price,
            quantity,
            variantId,
            variantName,
            productType,
          }),
        ),
        shipping,
        deliveryMethod: options.deliveryMethod,
        easyboxId: options.easyboxId,
        shippingCost: options.shippingCost,
      },
    })
  },

  /**
   * Orders for the signed-in customer (when `userId` is given) or every order
   * for the admin panel (admin token required).
   */
  async getOrders(userId?: string): Promise<OrderDraft[]> {
    return api<OrderDraft[]>(userId ? '/orders' : '/orders/all')
  },

  async getOrderById(id: string): Promise<OrderDraft> {
    return api<OrderDraft>(`/orders/${encodeURIComponent(id)}`)
  },

  /** Guest order tracking: order reference + the email used at checkout. */
  async lookup(reference: string, email: string): Promise<OrderDraft> {
    return api<OrderDraft>('/orders/lookup', {
      method: 'POST',
      body: { reference, email },
      authed: false,
    })
  },

  /** Admin: change the status (and optionally the internal note) of an order. */
  async updateStatus(id: string, status: OrderStatus, adminNote?: string): Promise<OrderDraft> {
    return api<OrderDraft>(`/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status, adminNote },
    })
  },
}
