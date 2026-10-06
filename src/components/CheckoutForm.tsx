import { useState } from 'react'
import type { CartItem } from '../types'
import { FormField } from './FormField'
import { orderService } from '../services/orderService'

export interface CheckoutValues {
  fullName: string
  email: string
  phone: string
  county: string
  locality: string
  street: string
  number: string
  block: string
  staircase: string
  floor: string
  apartment: string
  postalCode: string
  notes: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

interface CheckoutFormProps {
  items: CartItem[]
  userId?: string
  onSuccess: (orderId: string) => void
  onError: (message: string) => void
}

const empty: CheckoutValues = {
  fullName: '',
  email: '',
  phone: '',
  county: '',
  locality: '',
  street: '',
  number: '',
  block: '',
  staircase: '',
  floor: '',
  apartment: '',
  postalCode: '',
  notes: '',
  acceptTerms: false,
  acceptPrivacy: false,
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CheckoutForm({ items, userId, onSuccess, onError }: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutValues>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutValues, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof CheckoutValues>(key: K, value: CheckoutValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }))
    }
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof CheckoutValues, string>> = {}
    if (values.fullName.trim().length < 3) e.fullName = 'Te rugăm să introduci numele complet.'
    if (!emailRe.test(values.email.trim())) e.email = 'Adresa de email nu este validă.'
    if (values.phone.trim().length < 8) e.phone = 'Introdu un număr de telefon valid.'
    if (!values.county.trim()) e.county = 'Județul este obligatoriu.'
    if (!values.locality.trim()) e.locality = 'Localitatea este obligatorie.'
    if (!values.street.trim()) e.street = 'Strada este obligatorie.'
    if (!values.number.trim()) e.number = 'Numărul este obligatoriu.'
    if (!values.acceptTerms) e.acceptTerms = 'Trebuie să accepți termenii și condițiile.'
    if (!values.acceptPrivacy) e.acceptPrivacy = 'Trebuie să accepți politica de confidențialitate.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const draft = await orderService.createOrder(
        items,
        {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          county: values.county,
          locality: values.locality,
          street: values.street,
          number: values.number,
          block: values.block || undefined,
          staircase: values.staircase || undefined,
          floor: values.floor || undefined,
          apartment: values.apartment || undefined,
          postalCode: values.postalCode || undefined,
          notes: values.notes || undefined,
        },
        userId,
      )
      onSuccess(draft.id)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'A apărut o eroare. Încearcă din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {/* Date personale */}
      <Section title="Date de contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nume și prenume" htmlFor="fullName" required error={errors.fullName}>
            <input
              id="fullName"
              className={`field ${errors.fullName ? 'field-error' : ''}`}
              value={values.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <input
              id="email"
              type="email"
              className={`field ${errors.email ? 'field-error' : ''}`}
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              autoComplete="email"
              placeholder="adresa@email.ro"
            />
          </FormField>
          <FormField label="Telefon" htmlFor="phone" required error={errors.phone}>
            <input
              id="phone"
              type="tel"
              className={`field ${errors.phone ? 'field-error' : ''}`}
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel"
              placeholder="07xx xxx xxx"
            />
          </FormField>
        </div>
      </Section>

      {/* Adresă de livrare */}
      <Section title="Adresa de livrare">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Județ" htmlFor="county" required error={errors.county}>
            <input
              id="county"
              className={`field ${errors.county ? 'field-error' : ''}`}
              value={values.county}
              onChange={(e) => set('county', e.target.value)}
            />
          </FormField>
          <FormField label="Localitate" htmlFor="locality" required error={errors.locality}>
            <input
              id="locality"
              className={`field ${errors.locality ? 'field-error' : ''}`}
              value={values.locality}
              onChange={(e) => set('locality', e.target.value)}
            />
          </FormField>
          <FormField label="Stradă" htmlFor="street" required error={errors.street}>
            <input
              id="street"
              className={`field ${errors.street ? 'field-error' : ''}`}
              value={values.street}
              onChange={(e) => set('street', e.target.value)}
            />
          </FormField>
          <FormField label="Număr" htmlFor="number" required error={errors.number}>
            <input
              id="number"
              className={`field ${errors.number ? 'field-error' : ''}`}
              value={values.number}
              onChange={(e) => set('number', e.target.value)}
            />
          </FormField>
          <FormField label="Bloc" htmlFor="block">
            <input
              id="block"
              className="field"
              value={values.block}
              onChange={(e) => set('block', e.target.value)}
            />
          </FormField>
          <FormField label="Scară" htmlFor="staircase">
            <input
              id="staircase"
              className="field"
              value={values.staircase}
              onChange={(e) => set('staircase', e.target.value)}
            />
          </FormField>
          <FormField label="Etaj" htmlFor="floor">
            <input
              id="floor"
              className="field"
              value={values.floor}
              onChange={(e) => set('floor', e.target.value)}
            />
          </FormField>
          <FormField label="Apartament" htmlFor="apartment">
            <input
              id="apartment"
              className="field"
              value={values.apartment}
              onChange={(e) => set('apartment', e.target.value)}
            />
          </FormField>
          <FormField label="Cod poștal" htmlFor="postalCode">
            <input
              id="postalCode"
              className="field"
              value={values.postalCode}
              onChange={(e) => set('postalCode', e.target.value)}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Observații pentru livrare" htmlFor="notes">
              <textarea
                id="notes"
                rows={3}
                className="field resize-none"
                value={values.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Section>

      {/* Payment notice */}
      <div className="border border-brass/40 bg-brass/5 px-6 py-5">
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold">Plata nu se efectuează online.</span>
          După trimiterea comenzii, datele vor fi procesate pentru organizarea
          livrării, iar detaliile de plată vor fi comunicate separat.
        </p>
      </div>

      {/* Acceptances */}
      <Section title="Consimțământ">
        <div className="flex flex-col gap-4">
          <Checkbox
            id="acceptTerms"
            checked={values.acceptTerms}
            onChange={(c) => set('acceptTerms', c)}
            error={errors.acceptTerms}
            label="Am citit și sunt de acord cu Termenii și condițiile."
          />
          <Checkbox
            id="acceptPrivacy"
            checked={values.acceptPrivacy}
            onChange={(c) => set('acceptPrivacy', c)}
            error={errors.acceptPrivacy}
            label="Sunt de acord cu Politica de confidențialitate."
          />
        </div>
      </Section>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full px-6 py-4 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
      >
        {submitting ? 'Se trimite comanda…' : 'Trimite comanda'}
      </button>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 font-serif text-2xl text-ink">{title}</legend>
      {children}
    </fieldset>
  )
}

function Checkbox({
  id,
  label,
  checked,
  onChange,
  error,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#642A2E]"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p className="mt-1 pl-7 text-xs text-oxblood" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


