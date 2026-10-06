import { useState } from 'react'
import { siteConfig } from '../config/site'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { FormField } from '../components/FormField'
import { IconMail, IconPhone, IconMapPin, IconCheck } from '../components/icons'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    // Mock — no backend. Just simulate a short delay.
    window.setTimeout(() => {
      setBusy(false)
      setSubmitted(true)
      setName('')
      setEmail('')
      setMessage('')
    }, 600)
  }

  const { email: contactEmail, phone, address } = siteConfig.contact

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
            <InfoRow icon={<IconMapPin className="h-5 w-5" />} label="Adresă" value={address} />
            <InfoRow icon={<IconMail className="h-5 w-5" />} label="Email" value={contactEmail} />
            <InfoRow icon={<IconPhone className="h-5 w-5" />} label="Telefon" value={phone} />
            <div className="mt-6 flex h-56 items-center justify-center border border-ink/10 bg-paper-200/50 text-sm text-ink-muted">
              Hartă — {address}
            </div>
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
