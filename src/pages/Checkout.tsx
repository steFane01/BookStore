import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DeliveryMethod, OrderDraft } from '../types'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { OrderSummary } from '../components/OrderSummary'
import { CheckoutForm } from '../components/CheckoutForm'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { IconArrowLeft } from '../components/icons'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const { settings } = useSettings()
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier')
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-serif text-4xl text-ink">Coșul tău este gol.</h1>
        <p className="max-w-md text-ink-muted">
          Adaugă niște cărți înainte să treci la comandă.
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary px-6 py-3">
          Înapoi la librărie
        </button>
      </div>
    )
  }

  const isDigitalOnly = items.every((i) => i.productType === 'digital')

  const handleSuccess = (order: OrderDraft) => {
    clearCart()
    navigate(`/comanda/${order.reference}`, { replace: true, state: { order } })
  }

  const handleError = (message: string) => {
    setSubmitError(message)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm uppercase tracking-wider text-ink-muted transition-colors hover:text-brass-dark"
        >
          <IconArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
        <SectionHeading
          eyebrow={settings.checkoutEyebrow}
          title={isDigitalOnly ? settings.checkoutTitleDigital : settings.checkoutTitlePhysical}
          description={
            isDigitalOnly
              ? settings.checkoutDescriptionDigital
              : settings.checkoutDescriptionPhysical
          }
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
          {/* Form */}
          <div>
            {submitError && (
              <div
                className="mb-6 rounded border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood"
                role="alert"
              >
                <p className="font-medium">Comanda nu a putut fi trimisă.</p>
                <p className="mt-1 text-oxblood/80">{submitError}</p>
              </div>
            )}
            <CheckoutForm
              items={items}
              userId={user?.id}
              deliveryMethod={deliveryMethod}
              onDeliveryMethodChange={setDeliveryMethod}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24">
            <OrderSummary items={items} subtotal={subtotal} deliveryMethod={deliveryMethod} />
          </aside>
        </div>
      </AnimatedSection>
    </div>
  )
}
