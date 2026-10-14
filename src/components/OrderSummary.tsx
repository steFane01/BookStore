import type { CartItem, DeliveryMethod } from '../types'
import { formatPrice } from '../utils/format'
import { BookCover } from './BookCover'
import { SHIPPING_FEES } from '../data/easyboxes'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  compact?: boolean
  /** Shipping fee (RON). Defaults to the courier rate when not provided. */
  shippingCost?: number
  /** How the order will be delivered (used for the shipping label). */
  deliveryMethod?: DeliveryMethod
}

/**
 * Order summary list. On checkout it is shown in a side panel on desktop and
 * as a collapsible/compact block on mobile.
 */
export function OrderSummary({
  items,
  subtotal,
  compact = false,
  shippingCost,
  deliveryMethod = 'courier',
}: OrderSummaryProps) {
  const methodLabel = deliveryMethod === 'easybox' ? 'Livrare EasyBox' : 'Livrare curier'
  const fee = shippingCost ?? SHIPPING_FEES[deliveryMethod]
  const total = subtotal + fee

  return (
    <div className="border border-ink/10 bg-paper-50">
      <h3 className="border-b border-ink/10 px-6 py-4 font-serif text-xl text-ink">
        Comanda ta
      </h3>

      <ul className={`divide-y divide-ink/10 ${compact ? 'max-h-56 overflow-y-auto' : ''}`}>
        {items.map((item) => (
          <li key={`${item.bookId}-${item.title}`} className="flex items-center gap-4 px-6 py-4">
            <div className="shrink-0">
              <BookCover
                book={{
                  title: item.title,
                  author: item.author,
                  cover: {
                    src: item.coverSrc,
                    alt: item.coverAlt,
                    placeholder: item.coverSrc
                      ? undefined
                      : { title: item.title, author: item.author },
                  },
                }}
                size="sm"
              />
            </div>
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-serif text-base text-ink">{item.title}</p>
                <p className="text-xs text-ink-muted">{item.author}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-ink">
                  {formatPrice(item.price * item.quantity)}
                </p>
                <p className="text-xs text-ink-muted">× {item.quantity}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-ink/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">Subtotal</span>
          <span className="font-serif text-lg text-ink">{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-ink-muted">{methodLabel}</span>
          <span className="font-serif text-lg text-ink">{formatPrice(fee)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
          <span className="text-sm font-medium text-ink">Total</span>
          <span className="font-serif text-2xl text-ink">{formatPrice(total)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Nu se percepe plata online. Livrarea va fi confirmată după prelucrarea comenzii.
        </p>
      </div>
    </div>
  )
}
