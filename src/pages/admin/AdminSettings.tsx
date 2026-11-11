import { useEffect, useRef, useState } from 'react'
import type { SiteSettings } from '../../config/site'
import { useSettings } from '../../context/SettingsContext'
import { settingsService } from '../../services/settingsService'
import { isImageFile, uploadImage } from '../../services/uploadService'
import { api } from '../../services/http'
import { FormField } from '../../components/FormField'

type ImageKey = 'heroImage' | 'logoImage'

/**
 * Owner-editable storefront settings: brand, imagery, contact and legal data.
 * Everything saved here is used by the live site immediately (no rebuild).
 */
export function AdminSettings() {
  const { settings, loaded, refresh } = useSettings()
  const [form, setForm] = useState<SiteSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<ImageKey | null>(null)

  const [testEmail, setTestEmail] = useState('')
  const [testBusy, setTestBusy] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const heroRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (loaded) setForm(settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const set = (key: keyof SiteSettings, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const upload = async (file: File | undefined, key: ImageKey) => {
    if (!file) return
    if (!isImageFile(file)) {
      setError('Format neacceptat. Alege o imagine JPEG, PNG, WebP sau GIF.')
      return
    }
    setUploading(key)
    setError(null)
    try {
      const { url } = await uploadImage(file)
      set(key, url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Imaginea nu a putut fi încărcată.')
    } finally {
      setUploading(null)
      if (heroRef.current) heroRef.current.value = ''
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await settingsService.save(form)
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setările nu au putut fi salvate.')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    setTestBusy(true)
    setTestResult(null)
    try {
      await api('/mail/test', { method: 'POST', body: { to: testEmail } })
      setTestResult('Emailul de test a fost trimis.')
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : 'Emailul de test nu a putut fi trimis.')
    } finally {
      setTestBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-8 text-sm text-ink-muted">
        Tot ce salvezi aici apare imediat pe site: nume, texte, imagini, date de contact și
        informațiile legale.
      </p>

      {/* Identity */}
      <Group title="Identitate">
        <FormField label="Nume brand" htmlFor="set-brand">
          <input id="set-brand" className="field" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} />
        </FormField>
        <FormField label="Nume lung" htmlFor="set-brand-long">
          <input id="set-brand-long" className="field" value={form.brandNameLong} onChange={(e) => set('brandNameLong', e.target.value)} />
        </FormField>
        <FormField label="Slogan" htmlFor="set-tagline">
          <input id="set-tagline" className="field" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </FormField>
        <TextArea label="Descriere (folosită în subsol și pe pagina principală)" id="set-description" value={form.description} onChange={(v) => set('description', v)} rows={3} />
      </Group>

      {/* Images */}
      <Group title="Imagini">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormField label="Imagine principală (hero)" htmlFor="set-hero-file">
              <input
                ref={heroRef}
                id="set-hero-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading === 'heroImage'}
                onChange={(e) => void upload(e.target.files?.[0], 'heroImage')}
                className="field file:mr-3 file:rounded-none file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-paper-50"
              />
            </FormField>
            {form.heroImage && (
              <img src={form.heroImage} alt="Previzualizare hero" className="mt-3 h-32 w-full border border-ink/10 object-cover" />
            )}
          </div>
          <div>
            <FormField label="Logo" htmlFor="set-logo-file">
              <input
                ref={logoRef}
                id="set-logo-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading === 'logoImage'}
                onChange={(e) => void upload(e.target.files?.[0], 'logoImage')}
                className="field file:mr-3 file:rounded-none file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-paper-50"
              />
            </FormField>
            {form.logoImage && (
              <img src={form.logoImage} alt="Previzualizare logo" className="mt-3 h-20 w-20 border border-ink/10 object-contain" />
            )}
          </div>
        </div>
        <FormField label="Text alternativ imagine principală" htmlFor="set-hero-alt">
          <input id="set-hero-alt" className="field" value={form.heroAlt} onChange={(e) => set('heroAlt', e.target.value)} />
        </FormField>
      </Group>

      {/* Contact */}
      <Group title="Contact și social">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email public" htmlFor="set-email">
            <input id="set-email" type="email" className="field" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </FormField>
          <FormField label="Telefon public" htmlFor="set-phone">
            <input id="set-phone" className="field" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </FormField>
          <FormField label="Instagram (URL)" htmlFor="set-instagram">
            <input id="set-instagram" className="field" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/…" />
          </FormField>
          <FormField label="Facebook (URL)" htmlFor="set-facebook">
            <input id="set-facebook" className="field" value={form.facebook} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/…" />
          </FormField>
        </div>
      </Group>

      {/* Legal */}
      <Group title="Date firmă (pagini legale)">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Denumire firmă" htmlFor="set-company">
            <input id="set-company" className="field" value={form.legalCompany} onChange={(e) => set('legalCompany', e.target.value)} />
          </FormField>
          <FormField label="CUI" htmlFor="set-cui">
            <input id="set-cui" className="field" value={form.legalCui} onChange={(e) => set('legalCui', e.target.value)} />
          </FormField>
          <FormField label="Nr. Registrul Comerțului" htmlFor="set-regcom">
            <input id="set-regcom" className="field" value={form.legalRegCom} onChange={(e) => set('legalRegCom', e.target.value)} />
          </FormField>
          <FormField label="Email legal" htmlFor="set-legal-email">
            <input id="set-legal-email" type="email" className="field" value={form.legalEmail} onChange={(e) => set('legalEmail', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Adresă sediu" htmlFor="set-legal-address">
          <input id="set-legal-address" className="field" value={form.legalAddress} onChange={(e) => set('legalAddress', e.target.value)} />
        </FormField>
      </Group>

      {/* Copy */}
      <Group title="Informații pentru clienți">
        <TextArea label="Livrare" id="set-delivery" value={form.deliveryInfo} onChange={(v) => set('deliveryInfo', v)} rows={2} />
        <TextArea label="Plată" id="set-payment" value={form.paymentInfo} onChange={(v) => set('paymentInfo', v)} rows={2} />
        <TextArea label="Retur" id="set-returns" value={form.returnsInfo} onChange={(v) => set('returnsInfo', v)} rows={2} />
        <TextArea label="Povestea noastră (paragrafe separate prin linie goală)" id="set-about" value={form.aboutText} onChange={(v) => set('aboutText', v)} rows={5} />
      </Group>

      {error && (
        <p className="mb-4 text-sm text-oxblood" role="alert">
          {error}
        </p>
      )}
      {saved && <p className="mb-4 text-sm text-oxblood">Setările au fost salvate.</p>}

      <button type="button" onClick={() => void save()} disabled={saving} className="btn btn-primary px-7 py-3 disabled:opacity-60">
        {saving ? 'Se salvează…' : 'Salvează setările'}
      </button>

      {/* SMTP test */}
      <div className="mt-12 border border-ink/10 bg-paper-50 p-5">
        <p className="font-serif text-xl text-ink">Testează emailul</p>
        <p className="mt-1 text-sm text-ink-muted">
          Trimite un email de test pentru a verifica setările SMTP din server.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            className="field flex-1"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
            placeholder="adresa@exemplu.ro"
            aria-label="Adresa pentru emailul de test"
          />
          <button
            type="button"
            onClick={() => void sendTest()}
            disabled={testBusy || !testEmail}
            className="btn btn-outline px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {testBusy ? 'Se trimite…' : 'Trimite test'}
          </button>
        </div>
        {testResult && <p className="mt-3 text-sm text-ink-muted">{testResult}</p>}
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 border border-ink/10 bg-paper-50 p-5">
      <h2 className="mb-4 font-serif text-2xl text-ink">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function TextArea({
  label,
  id,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className="field resize-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  )
}
