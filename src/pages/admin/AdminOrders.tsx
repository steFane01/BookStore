import { useMemo, useState } from 'react'
import type { OrderDraft, OrderStatus } from '../../types'
import { orderService } from '../../services/orderService'
import { orderStatusLabels } from '../../services/authService'
import { formatPrice } from '../../utils/format'
import { OrderDetails } from '../../components/OrderDetails'
import { IconChevronDown } from '../../components/icons'

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

/**
 * Order management: the owner sees the full delivery details and moves the order
 * through its statuses. The customer is emailed automatically on each change.
 */
export function AdminOrders({
  orders,
  onRefresh,
}: {
  orders: OrderDraft[]
  onRefresh: () => Promise<void>
}) {
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: orders.length }
    for (const status of STATUSES) base[status] = orders.filter((o) => o.status === status).length
    return base
  }, [orders])

  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter)

  const changeStatus = async (order: OrderDraft, status: OrderStatus) => {
    setBusy(order.id)
    setError(null)
    try {
      await orderService.updateStatus(order.id, status, notes[order.id])
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Statusul nu a putut fi actualizat.')
    } finally {
      setBusy(null)
    }
  }

  const saveNote = async (order: OrderDraft) => {
    setBusy(order.id)
    setError(null)
    try {
      await orderService.updateStatus(order.id, order.status, notes[order.id] ?? '')
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nota nu a putut fi salvată.')
    } finally {
      setBusy(null)
    }
  }

  if (orders.length === 0) {
    return <p className="text-sm text-ink-muted">Nu există comenzi înregistrate.</p>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', ...STATUSES] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              filter === key
                ? 'bg-ink text-paper-50'
                : 'border border-ink/15 text-ink-muted hover:text-ink'
            }`}
          >
            {key === 'all' ? 'Toate' : orderStatusLabels[key]} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood" role="alert">
          {error}
        </div>
      )}

      <ul className="divide-y divide-ink/10 border border-ink/10">
        {visible.map((order) => {
          const open = expanded === order.id
          return (
            <li key={order.id} className="px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-lg text-ink">{order.reference}</p>
                  <p className="text-xs text-ink-muted">
                    {new Date(order.createdAt).toLocaleString('ro-RO')} · {order.shipping.fullName} ·{' '}
                    {order.shipping.phone}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {order.deliveryMethod === 'easybox'
                      ? `EasyBox — ${order.easybox?.name ?? '—'}`
                      : `Curier — ${order.shipping.locality}, ${order.shipping.county}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-serif text-xl text-ink">
                    {formatPrice(order.total ?? order.subtotal)}
                  </span>
                  <select
                    aria-label={`Status pentru ${order.reference}`}
                    value={order.status}
                    disabled={busy === order.id}
                    onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)}
                    className="field max-w-[11rem] py-1.5 text-sm"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {orderStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : order.id)}
                    className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
                    aria-expanded={open}
                  >
                    Detalii
                    <IconChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {open && (
                <div className="mt-5 border-t border-ink/10 pt-5">
                  <OrderDetails order={order} />
                  <div className="mt-5">
                    <label htmlFor={`note-${order.id}`} className="text-xs uppercase tracking-wider text-ink-muted">
                      Notă internă (nu apare la client)
                    </label>
                    <textarea
                      id={`note-${order.id}`}
                      rows={2}
                      className="field mt-2 resize-none"
                      value={notes[order.id] ?? order.adminNote ?? ''}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [order.id]: event.target.value }))
                      }
                      placeholder="ex: expediat AWB 1234 / sunat clientul"
                    />
                    <button
                      type="button"
                      onClick={() => void saveNote(order)}
                      disabled={busy === order.id}
                      className="btn btn-outline mt-3 px-4 py-2 text-sm disabled:opacity-50"
                    >
                      Salvează nota
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
