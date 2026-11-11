import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { OrderDraft } from '../types'
import { orderService } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { FormField } from '../components/FormField'
import { OrderDetails } from '../components/OrderDetails'
import { IconCheck } from '../components/icons'

export default function OrderSuccess() {
  const { id: reference } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { settings } = useSettings()

  const initial = (location.state as { order?: OrderDraft } | null)?.order ?? null
  const [order, setOrder] = useState<OrderDraft | null>(initial)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(!initial)

  usePageMeta('Comandă înregistrată')

  // On reload the router state is gone. A signed-in customer can read the order
  // directly; guests confirm the email used at checkout.
  useEffect(() => {
    let active = true
    if (initial || !reference || !isAuthenticated) {
      setChecking(false)
      return
    }
    ;(async () => {
      try {
        const data = await orderService.getOrderById(reference)
        if (active) setOrder(data)
      } catch {
        // Not their order (or a guest) — fall through to the email form.
      } finally {
        if (active) setChecking(false)
      }
    })()
    return () => {
      active = false
    }
  }, [initial, reference, isAuthenticated])

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!reference) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Introdu o adresă de email validă.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      setOrder(await orderService.lookup(reference, email))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comanda nu a putut fi găsită.')
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="pt-20 md:pt-24">
        <AnimatedSection className="container-page max-w-md py-16">
          <SectionHeading
            eyebrow="Comanda ta"
            title="Confirmă emailul pentru a vedea comanda"
            description={
              reference
                ? `Comanda ${reference} a fost găsită. Introdu emailul folosit la comandă.`
                : 'Introdu numărul comenzii și emailul folosit la comandă.'
            }
            align="center"
          />
          <form onSubmit={lookup} noValidate className="mt-8 flex flex-col gap-4">
            <FormField label="Email" htmlFor="os-email" required>
              <input
                id="os-email"
                type="email"
                className="field"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </FormField>
            {error && (
              <p className="text-sm text-oxblood" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary px-6 py-3 disabled:opacity-60">
              {busy ? 'Se caută…' : 'Vezi comanda'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="text-sm text-ink-muted underline underline-offset-2">
              Înapoi la magazin
            </button>
          </form>
        </AnimatedSection>
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
            {order.deliveryMethod === 'courier'
              ? 'Nu se plătește nimic online. Detaliile au fost trimise echipei noastre, iar tu vei fi contactat(ă) pentru confirmarea livrării.'
              : `Coletul merge la ${
                  order.deliveryMethod === 'fanbox' ? 'lockerul FANbox' : 'EasyBox-ul'
                } ales. Plata se face cu cardul la locker, la ridicare${
                  order.deliveryMethod === 'easybox' ? ' (poți alege și ramburs la locker)' : ''
                }. ${settings.checkoutSummaryNote}`}
          </p>
        </div>

        <div className="mt-10">
          <OrderDetails order={order} />
        </div>

        {/* What happens next */}
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-lg border border-brass/30 bg-paper-50">
          <div className="border-b border-brass/20 bg-brass/5 px-6 py-4">
            <h3 className="font-serif text-xl text-ink">Ce se întâmplă mai departe?</h3>
          </div>
          <ol className="divide-y divide-ink/10">
            <li className="flex gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 font-serif text-brass-dark">1</span>
              <div>
                <p className="font-medium text-ink">Am primit comanda ta</p>
                <p className="text-sm text-ink-muted">Ai primit și un email de confirmare cu detaliile comenzii.</p>
              </div>
            </li>
            <li className="flex gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 font-serif text-brass-dark">2</span>
              <div>
                <p className="font-medium text-ink">Pregătim produsele</p>
                <p className="text-sm text-ink-muted">Te contactăm telefonic sau pe email pentru confirmare.</p>
              </div>
            </li>
            <li className="flex gap-4 px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 font-serif text-brass-dark">3</span>
              <div>
                <p className="font-medium text-ink">Livrăm</p>
                <p className="text-sm text-ink-muted">
                  {order.deliveryMethod === 'easybox'
                    ? 'Expediem către EasyBox-ul ales, prin curier.'
                    : order.deliveryMethod === 'fanbox'
                      ? 'Expediem către lockerul FANbox ales, prin curier.'
                      : 'Expediem prin curier la adresa indicată.'}
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3 text-center">
          <button onClick={() => navigate('/')} className="btn btn-primary px-7 py-3">
            Continuă explorarea
          </button>
          <button onClick={() => navigate('/urmarire-comanda')} className="btn btn-outline px-7 py-3">
            Urmărește comanda
          </button>
        </div>
      </AnimatedSection>
    </div>
  )
}
