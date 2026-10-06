import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { OrderDraft } from '../types'
import { orderService } from '../services/orderService'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { formatPrice } from '../utils/format'
import { IconCheck } from '../components/icons'

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDraft | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const data = id ? await orderService.getOrderById(id) : undefined
      if (!active) return
      setOrder(data ?? null)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-serif text-4xl text-ink">Comanda nu a fost găsită.</h1>
        <button onClick={() => navigate('/')} className="btn btn-primary px-6 py-3">
          Înapoi la librărie
        </button>
      </div>
    )
  }

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-oxblood/40 bg-oxblood/10">
            <IconCheck className="h-8 w-8 text-oxblood" />
          </div>
          <SectionHeading
            eyebrow="Comandă înregistrată"
            title="Mulțumim pentru comandă!"
            description={`Comanda ta a fost înregistrată cu numărul ${order.reference}.`}
            align="center"
          />
          <p className="mx-auto mt-6 max-w-lg text-ink-muted">
            Nu se percepe plata online. Vom procesa detaliile de livrare și vom
            reveni cu confirmarea la adresa de email pe care ai furnizat-o.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-[1fr_20rem] md:items-start">
          {/* Order details */}
          <div className="border border-ink/10 bg-paper-50">
            <h3 className="border-b border-ink/10 px-6 py-4 font-serif text-xl text-ink">
              Detaliile comenzii
            </h3>
            <ul className="divide-y divide-ink/10">
              {order.lines.map((item) => (
                <li
                  key={`${item.bookId}-${item.title}`}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base text-ink">{item.title}</p>
                    <p className="text-xs text-ink-muted">
                      {item.author} · × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Total de plată</span>
                <span className="font-serif text-2xl text-ink">{formatPrice(order.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="border border-ink/10 bg-paper-50">
            <h3 className="border-b border-ink/10 px-6 py-4 font-serif text-xl text-ink">
              Livrare către
            </h3>
            <div className="px-6 py-5 text-sm leading-relaxed text-ink">
              <p className="font-medium text-ink">{order.shipping.fullName}</p>
              <p>{order.shipping.street} nr. {order.shipping.number}
                {order.shipping.block ? `, Bl. ${order.shipping.block}` : ''}
                {order.shipping.apartment ? `, Ap. ${order.shipping.apartment}` : ''}
              </p>
              <p>
                {order.shipping.locality}, {order.shipping.county}
              </p>
              <p className="mt-3">{order.shipping.email}</p>
              <p>{order.shipping.phone}</p>
            </div>
            <div className="border-t border-ink/10 px-6 py-4">
              <p className="text-xs leading-relaxed text-ink-muted">
                Vei fi contactat/ă în curând pentru confirmarea livrării și
                detaliile de plată.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button onClick={() => navigate('/')} className="btn btn-primary px-7 py-3">
            Continue explorarea
          </button>
        </div>
      </AnimatedSection>
    </div>
  )
}
