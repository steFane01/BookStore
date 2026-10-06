import { useState } from 'react'
import { siteConfig } from '../config/site'
import { submitContact } from '../services/formsService'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { FormField } from '../components/FormField'
import { IconMail, IconPhone, IconCheck } from '../components/icons'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      // Emails the visitor's message TO the site's own mailbox (.env address).
      await submitContact({ name, email, message })
      setSubmitted(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut trimite. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  const { email: contactEmail, phone } = siteConfig.contact

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Contact"
          title="Hai să vorbim"
          description="O întrebare despre o carte, o comandă specială sau o propunere de colaborare — îți răspundem cu plăcere."
          align="center"
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
          {/* Info */}
          <div className="order-2 grid gap-4 lg:order-1">
            <InfoRow icon={<IconMail className="h-5 w-5" />} label="Email" value={contactEmail} />
            <InfoRow icon={<IconPhone className="h-5 w-5" />} label="Telefon" value={phone} />
          </div>

          {/* Form */}
          <form onSubmit={submit} className="order-1 flex flex-col gap-4 lg:order-2">
            <FormField label="Nume" htmlFor="ct-name" required>
              <input id="ct-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label="Email" htmlFor="ct-email" required>
              <input id="ct-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <FormField label="Mesaj" htmlFor="ct-message" required>
              <textarea id="ct-message" rows={5} className="field resize-none" value={message} onChange={(e) => setMessage(e.target.value)} />
            </FormField>

            {submitted && (
              <p className="flex items-center gap-2 text-sm text-oxblood" role="status">
                <IconCheck className="h-4 w-4" />
                Mulțumim! Mesajul tău a fost trimis.
              </p>
            )}

            {!submitted && error && (
              <p className="flex items-center gap-2 text-sm text-oxblood" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary px-6 py-3 disabled:opacity-60"
            >
              {busy ? 'Se trimite…' : 'Trimite mesajul'}
            </button>
          </form>
        </div>
      </AnimatedSection>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 border border-ink/10 bg-paper-50 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brass/40 text-brass-dark">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
        <p className="font-serif text-lg text-ink">{value}</p>
      </div>
    </div>
  )
}
