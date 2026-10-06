import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { OrderSummary } from '../components/OrderSummary'
import { CheckoutForm } from '../components/CheckoutForm'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { IconArrowLeft } from '../components/icons'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()

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

  const handleSuccess = (orderId: string) => {
    clearCart()
    navigate(`/comanda/${orderId}`, { replace: true })
  }

  const handleError = (message: string) => {
    alert(message)
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
          eyebrow="Finalizare comandă"
          title="Detalii de livrare"
          description="Completează datele pentru livrare. Nu efectuăm plata online."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
          {/* Form */}
          <div>
            <CheckoutForm
              items={items}
              userId={user?.id}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24">
            <OrderSummary items={items} subtotal={subtotal} />
          </aside>
        </div>
      </AnimatedSection>
    </div>
  )
}
