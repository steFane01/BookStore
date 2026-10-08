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
            Comanda ta a fost înregistrată cu succes. Nu se plătește nimic online —
            detaliile de livrare au fost transmise echipei noastre, iar tu vei fi
            contactat(ă) pentru a stabili livrarea.
          </p>
        </div>

        {/* Suggestive "what happens next" panel — reassures the user this is real. */}
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-lg border border-brass/30 bg-paper-50">
          <div className="border-b border-brass/20 bg-brass/5 px-6 py-4">
            <h3 className="font-serif text-xl text-ink">Ce se întâmplă mai departe?</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Iată pașii pe care îi facem noi, în spate, pentru a-ți livra cărțile.
            </p>
          </div>
          <ol className="divide-y divide-ink/10">
            <li className="flex gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 font-serif text-brass-dark">
                1
              </span>
              <div>
                <p className="font-medium text-ink">Am primit comanda ta</p>
                <p className="text-sm text-ink-muted">
                  Datele tale de livrare au ajuns la echipa noastră, exact așa cum le-ai
                  completat. Comanda are numărul de înregistrare{' '}
                  <span className="font-semibold text-brass-dark">{order.reference}</span>.
                </p>
              </div>
            </li>
            <li className="flex gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 font-serif text-brass-dark">
                2
              </span>
              <div>
                <p className="font-medium text-ink">Pregătim livrarea cu partenerul nostru de curierat</p>
                <p className="text-sm text-ink-muted">
                  Lucrăm direct cu o firmă de curierat. Le transmitem exact adresa și
                  datele de contact pe care le-ai furnizat, ca să ajungem la tine fără
                  complicații.
                </p>
              </div>
            </li>
            <li className="flex gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 font-serif text-brass-dark">
                3
              </span>
              <div>
                <p className="font-medium text-ink">Te contactăm pentru livrare</p>
                <p className="text-sm text-ink-muted">
                  Vei fi sunat(ă) sau contactat(ă) pe email pentru a stabili data și
                  detaliile livrării. Echipa noastră îți va confirma totul personal, înainte
                  ca pachetul să plece.
                </p>
              </div>
            </li>
          </ol>
          <div className="border-t border-ink/10 px-6 py-4">
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-ink">Vrei să urmărești comanda?</span>{' '}
              Intră în{' '}
              <button onClick={() => navigate('/cont')} className="text-brass-dark underline underline-offset-2 hover:text-ink">
                contul tău
              </button>{' '}
              la secțiunea „Comenzile mele” — o vei găsi acolo cu numărul de înregistrare.
            </p>
          </div>
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
