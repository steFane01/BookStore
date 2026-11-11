import { useState } from 'react'
import type { OrderDraft } from '../types'
import { orderService } from '../services/orderService'
import { usePageMeta } from '../hooks/usePageMeta'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { FormField } from '../components/FormField'
import { OrderDetails } from '../components/OrderDetails'

/** Public order tracking (reference + checkout email). */
export default function OrderTracking() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  usePageMeta('Urmărește comanda')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setOrder(await orderService.lookup(reference, email))
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : 'Comanda nu a putut fi găsită.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page max-w-3xl py-16">
        <SectionHeading
          eyebrow="Comenzi"
          title="Urmărește comanda"
          description="Introdu numărul comenzii și emailul folosit la comandă pentru a vedea statusul și detaliile."
          align="center"
        />

        <form onSubmit={submit} className="mx-auto mt-10 flex max-w-lg flex-col gap-4">
          <FormField label="Număr comandă" htmlFor="tr-reference" required>
            <input
              id="tr-reference"
              className="field"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="LB-2026-ABC123"
            />
          </FormField>
          <FormField label="Email" htmlFor="tr-email" required>
            <input
              id="tr-email"
              type="email"
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          {error && (
            <p className="text-sm text-oxblood" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn btn-primary px-6 py-3 disabled:opacity-60">
            {busy ? 'Se caută…' : 'Caută comanda'}
          </button>
        </form>

        {order && (
          <div className="mt-12">
            <OrderDetails order={order} />
          </div>
        )}
      </AnimatedSection>
    </div>
  )
}
