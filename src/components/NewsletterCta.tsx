import { useState } from 'react'
import { IconCheck } from './icons'
import { subscribeNewsletter } from '../services/formsService'

/**
 * Editorial newsletter call-to-action block. "Mă abonez" sends a confirmation
 * email to the address typed in the field (from the site's `.env` mail account);
 * it falls back to a silent local success when the backend is offline.
 */
export function NewsletterCta() {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    try {
      await subscribeNewsletter(email)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut trimite. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container-page pb-20">
      <div className="border border-ink/10 bg-paper-200/50 px-8 py-14 text-center md:px-16 md:py-20">
        <span className="eyebrow">Rămâi aproape</span>
        <h2 className="serif-display mx-auto mt-4 max-w-xl text-4xl text-balance text-ink sm:text-5xl">
          Primește vești despre cărțile noi
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink-muted">
          O scrisoare scurtă, din când în când. Fără zgomot, doar titluri pe care
          le-am ales cu grijă.
        </p>

        {submitted ? (
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-oxblood">
            <IconCheck className="h-5 w-5" />
            <span>Mulțumim! Te așteptăm la prima scrisoare.</span>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Adresa ta de email
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adresa ta de email"
              className="field flex-1"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Se trimite…' : 'Mă abonez'}
            </button>
            {error && (
              <p className="text-center text-sm text-oxblood sm:col-span-2" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
