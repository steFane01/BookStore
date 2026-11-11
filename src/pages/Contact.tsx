import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { submitContact } from '../services/formsService'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { FormField } from '../components/FormField'
import { IconMail, IconPhone, IconCheck, IconMapPin } from '../components/icons'

export default function Contact() {
  const { settings } = useSettings()
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({})
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  usePageMeta(`Contact — ${settings.brandName}`, 'Scrie-ne: întrebări despre produse, comenzi sau colaborări.')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof fieldErrors = {}
    if (name.trim().length < 2) next.name = 'Scrie numele tău.'
    if (!emailRe.test(email.trim())) next.email = 'Adresa de email nu este validă.'
    if (message.trim().length < 10) next.message = 'Scrie un mesaj de cel puțin 10 caractere.'
    setFieldErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    setError(null)
    try {
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

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow={settings.contactEyebrow}
          title={settings.contactTitle}
          description={settings.contactDescription}
          align="center"
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
          {/* Info */}
          <div className="order-2 grid gap-4 lg:order-1">
            {settings.contactEmail && (
              <InfoRow icon={<IconMail className="h-5 w-5" />} label="Email" value={settings.contactEmail} />
            )}
            {settings.contactPhone && (
              <InfoRow icon={<IconPhone className="h-5 w-5" />} label="Telefon" value={settings.contactPhone} />
            )}
            {settings.legalAddress && (
              <InfoRow icon={<IconMapPin className="h-5 w-5" />} label="Adresă" value={settings.legalAddress} />
            )}
            <div className="border border-ink/10 bg-paper-50 p-5 text-sm leading-relaxed text-ink-muted">
              <p className="font-medium text-ink">Livrare</p>
              <p className="mt-1">{settings.deliveryInfo}</p>
              <p className="mt-3 font-medium text-ink">Plată</p>
              <p className="mt-1">{settings.paymentInfo}</p>
              <p className="mt-3 font-medium text-ink">Retur</p>
              <p className="mt-1">{settings.returnsInfo}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} noValidate className="order-1 flex flex-col gap-4 lg:order-2">
            <FormField label="Nume" htmlFor="ct-name" required error={fieldErrors.name}>
              <input id="ct-name" className={`field ${fieldErrors.name ? 'field-error' : ''}`} value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((f) => ({ ...f, name: undefined })) }} />
            </FormField>
            <FormField label="Email" htmlFor="ct-email" required error={fieldErrors.email}>
              <input id="ct-email" type="email" className={`field ${fieldErrors.email ? 'field-error' : ''}`} value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: undefined })) }} />
            </FormField>
            <FormField label="Mesaj" htmlFor="ct-message" required error={fieldErrors.message}>
              <textarea id="ct-message" rows={5} className={`field resize-none ${fieldErrors.message ? 'field-error' : ''}`} value={message} onChange={(e) => { setMessage(e.target.value); setFieldErrors((f) => ({ ...f, message: undefined })) }} />
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

            <button type="submit" disabled={busy} className="btn btn-primary px-6 py-3 disabled:opacity-60">
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
