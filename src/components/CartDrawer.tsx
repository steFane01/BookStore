import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { BookCover } from './BookCover'
import { QuantitySelector } from './QuantitySelector'
import { useEscape, useLockBody } from '../hooks/useEscape'
import { formatPrice } from '../utils/format'
import { IconClose, IconTrash } from './icons'

/**
 * Refined side-panel cart drawer. Slides in from the right; on small screens
 * it occupies the full width.
 */
export function CartDrawer() {
  const {
    items,
    subtotal,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
  } = useCart()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)

  useEscape(closeCart, isOpen)
  useLockBody(isOpen && !leaving)

  const handleClose = () => {
    setLeaving(true)
    setTimeout(() => {
      closeCart()
      setLeaving(false)
    }, 280)
  }

  const goCheckout = () => {
    handleClose()
    setTimeout(() => navigate('/comanda'), 320)
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Coș de cumpărături"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[26rem] flex-col bg-paper-50 shadow-lift transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-serif text-2xl text-ink">Coșul tău</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Închide coșul"
            className="rounded-sm p-1.5 text-ink transition-colors hover:text-oxblood"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="flex flex-col gap-6">
                {items.map((item) => (
                  <li key={item.bookId} className="flex gap-4">
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

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-serif text-base leading-tight text-ink">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">{item.author}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.bookId)}
                          aria-label={`Elimină ${item.title} din coș`}
                          className="p-1 text-ink-muted transition-colors hover:text-oxblood"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <QuantitySelector
                          size="sm"
                          value={item.quantity}
                          onChange={(q) => setQuantity(item.bookId, q)}
                        />
                        <span className="text-sm font-medium tabular-nums text-ink">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-ink/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Subtotal</span>
                <span className="font-serif text-2xl text-ink">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Transportul și alte detalii vor fi stabilite la finalizarea comenzii.
              </p>
              <button
                type="button"
                onClick={goCheckout}
                className="btn btn-primary mt-5 w-full px-6 py-3.5"
              >
                Continuă către comandă
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function EmptyCart() {
  const { closeCart } = useCart()
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="font-serif text-2xl text-ink">Coșul tău este gol.</p>
      <p className="max-w-xs text-sm text-ink-muted">
        Încă nu ai ales nicio carte. Poate un început de lectură îți face semn.
      </p>
      <button
        type="button"
        onClick={() => {
          closeCart()
          navigate('/')
        }}
        className="btn btn-outline mt-2 px-6 py-3"
      >
        Descoperă cărțile
      </button>
    </div>
  )
}

