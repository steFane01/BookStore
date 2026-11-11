import type { OrderDraft } from '../types'
import { orderStatusLabels } from '../services/authService'
import { formatPrice } from '../utils/format'

/** Shared order summary: products, totals, delivery details and status. */
export function OrderDetails({ order, showStatus = true }: { order: OrderDraft; showStatus?: boolean }) {
  const isEasybox = order.deliveryMethod === 'easybox'

  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      {/* Products + totals */}
      <div className="border border-ink/10 bg-paper-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
          <div>
            <p className="font-serif text-xl text-ink">{order.reference}</p>
            <p className="text-xs text-ink-muted">
              {new Date(order.createdAt).toLocaleString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {showStatus && (
            <span className="rounded-full border border-ink/15 px-3 py-1 text-xs uppercase tracking-wider text-ink-muted">
              {orderStatusLabels[order.status]}
            </span>
          )}
        </div>

        <ul className="divide-y divide-ink/10">
          {order.lines.map((line, index) => (
            <li key={`${line.bookId}-${index}`} className="flex items-start justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="truncate font-serif text-base text-ink">{line.title}</p>
                <p className="text-xs text-ink-muted">
                  {line.author}
                  {line.variantName ? ` · ${line.variantName}` : ''} · × {line.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-ink">
                {formatPrice(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-ink/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Subtotal</span>
            <span className="font-serif text-lg text-ink">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-ink-muted">
              {isEasybox ? 'Livrare EasyBox' : 'Livrare curier'}
            </span>
            <span className="font-serif text-lg text-ink">{formatPrice(order.shippingCost ?? 0)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
            <span className="text-sm font-medium text-ink">Total de plată</span>
            <span className="font-serif text-2xl text-ink">{formatPrice(order.total ?? order.subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="border border-ink/10 bg-paper-50">
        <h3 className="border-b border-ink/10 px-6 py-4 font-serif text-xl text-ink">
          {isEasybox ? 'Livrare EasyBox' : 'Livrare către'}
        </h3>
        <div className="px-6 py-5 text-sm leading-relaxed text-ink">
          <p className="font-medium">{order.shipping.fullName}</p>
          {isEasybox && order.easybox ? (
            <>
              <p className="mt-2 font-medium">{order.easybox.name}</p>
              <p>{order.easybox.address}</p>
            </>
          ) : (
            <>
              <p>
                {order.shipping.street} nr. {order.shipping.number}
                {order.shipping.block ? `, Bl. ${order.shipping.block}` : ''}
                {order.shipping.apartment ? `, Ap. ${order.shipping.apartment}` : ''}
              </p>
              <p>
                {order.shipping.locality}, {order.shipping.county}
                {order.shipping.postalCode ? `, ${order.shipping.postalCode}` : ''}
              </p>
            </>
          )}
          <p className="mt-3">{order.shipping.email}</p>
          <p>{order.shipping.phone}</p>
          {order.shipping.notes && <p className="mt-3 text-ink-muted">Observații: {order.shipping.notes}</p>}
        </div>
        {order.adminNote && (
          <div className="border-t border-ink/10 bg-brass/5 px-6 py-4 text-sm text-ink">
            <p className="text-xs uppercase tracking-wider text-ink-muted">Notă internă</p>
            <p className="mt-1">{order.adminNote}</p>
          </div>
        )}
      </div>
    </div>
  )
}
