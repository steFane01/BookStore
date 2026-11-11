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

      {/* Home page copy */}
      <Group title="Pagina principală">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă deasupra colecțiilor" htmlFor="set-home-hero-eyebrow">
            <input id="set-home-hero-eyebrow" className="field" value={form.homeHeroEyebrow} onChange={(e) => set('homeHeroEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Text buton colecții" htmlFor="set-home-hero-cta">
            <input id="set-home-hero-cta" className="field" value={form.homeHeroCta} onChange={(e) => set('homeHeroCta', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă secțiune „Despre noi”" htmlFor="set-home-philosophy-eyebrow">
            <input id="set-home-philosophy-eyebrow" className="field" value={form.homePhilosophyEyebrow} onChange={(e) => set('homePhilosophyEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu secțiune „Despre noi”" htmlFor="set-home-philosophy-title">
            <input id="set-home-philosophy-title" className="field" value={form.homePhilosophyTitle} onChange={(e) => set('homePhilosophyTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă banda de coperți" htmlFor="set-home-covers-eyebrow">
            <input id="set-home-covers-eyebrow" className="field" value={form.homeCoversEyebrow} onChange={(e) => set('homeCoversEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu banda de coperți" htmlFor="set-home-covers-title">
            <input id="set-home-covers-title" className="field" value={form.homeCoversTitle} onChange={(e) => set('homeCoversTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă catalog" htmlFor="set-home-catalog-eyebrow">
            <input id="set-home-catalog-eyebrow" className="field" value={form.homeCatalogEyebrow} onChange={(e) => set('homeCatalogEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu catalog" htmlFor="set-home-catalog-title">
            <input id="set-home-catalog-title" className="field" value={form.homeCatalogTitle} onChange={(e) => set('homeCatalogTitle', e.target.value)} />
          </FormField>
        </div>
        <TextArea label="Descriere catalog" id="set-home-catalog-description" value={form.homeCatalogDescription} onChange={(v) => set('homeCatalogDescription', v)} rows={3} />
      </Group>

      {/* Newsletter */}
      <Group title="Blocul de newsletter">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă" htmlFor="set-newsletter-eyebrow">
            <input id="set-newsletter-eyebrow" className="field" value={form.newsletterEyebrow} onChange={(e) => set('newsletterEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu" htmlFor="set-newsletter-title">
            <input id="set-newsletter-title" className="field" value={form.newsletterTitle} onChange={(e) => set('newsletterTitle', e.target.value)} />
          </FormField>
        </div>
        <TextArea label="Text" id="set-newsletter-text" value={form.newsletter} onChange={(v) => set('newsletter', v)} rows={3} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Text buton abonare" htmlFor="set-newsletter-cta">
            <input id="set-newsletter-cta" className="field" value={form.newsletterCta} onChange={(e) => set('newsletterCta', e.target.value)} />
          </FormField>
          <FormField label="Mesaj după abonare" htmlFor="set-newsletter-success">
            <input id="set-newsletter-success" className="field" value={form.newsletterSuccess} onChange={(e) => set('newsletterSuccess', e.target.value)} />
          </FormField>
        </div>
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

      {/* Product page copy */}
      <Group title="Pagina produs">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă „Despre carte”" htmlFor="set-book-about-eyebrow">
            <input id="set-book-about-eyebrow" className="field" value={form.bookAboutEyebrow} onChange={(e) => set('bookAboutEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Etichetă „Despre produs” (digital)" htmlFor="set-book-about-eyebrow-digital">
            <input id="set-book-about-eyebrow-digital" className="field" value={form.bookAboutEyebrowDigital} onChange={(e) => set('bookAboutEyebrowDigital', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Titlu secțiune descriere" htmlFor="set-book-about-title">
          <input id="set-book-about-title" className="field" value={form.bookAboutTitle} onChange={(e) => set('bookAboutTitle', e.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă „Detalii”" htmlFor="set-book-details-eyebrow">
            <input id="set-book-details-eyebrow" className="field" value={form.bookDetailsEyebrow} onChange={(e) => set('bookDetailsEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu „Detalii”" htmlFor="set-book-details-title">
            <input id="set-book-details-title" className="field" value={form.bookDetailsTitle} onChange={(e) => set('bookDetailsTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă fragment din carte" htmlFor="set-book-excerpt-eyebrow">
            <input id="set-book-excerpt-eyebrow" className="field" value={form.bookExcerptEyebrow} onChange={(e) => set('bookExcerptEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu fragment din carte" htmlFor="set-book-excerpt-title">
            <input id="set-book-excerpt-title" className="field" value={form.bookExcerptTitle} onChange={(e) => set('bookExcerptTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă galerie foto" htmlFor="set-book-gallery-eyebrow">
            <input id="set-book-gallery-eyebrow" className="field" value={form.bookGalleryEyebrow} onChange={(e) => set('bookGalleryEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu galerie foto" htmlFor="set-book-gallery-title">
            <input id="set-book-gallery-title" className="field" value={form.bookGalleryTitle} onChange={(e) => set('bookGalleryTitle', e.target.value)} />
          </FormField>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">
          Detaliile fiecărui produs (titlu, descriere, preț, livrare) se editează din fila
          „Produse”. Aici schimbi doar textele generale ale paginii.
        </p>
      </Group>

      {/* About page copy */}
      <Group title="Pagina Despre">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă introducere" htmlFor="set-about-eyebrow">
            <input id="set-about-eyebrow" className="field" value={form.aboutEyebrow} onChange={(e) => set('aboutEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu introducere" htmlFor="set-about-title">
            <input id="set-about-title" className="field" value={form.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă poveste" htmlFor="set-about-story-eyebrow">
            <input id="set-about-story-eyebrow" className="field" value={form.aboutStoryEyebrow} onChange={(e) => set('aboutStoryEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu poveste" htmlFor="set-about-story-title">
            <input id="set-about-story-title" className="field" value={form.aboutStoryTitle} onChange={(e) => set('aboutStoryTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă principii" htmlFor="set-about-values-eyebrow">
            <input id="set-about-values-eyebrow" className="field" value={form.aboutValuesEyebrow} onChange={(e) => set('aboutValuesEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu principii" htmlFor="set-about-values-title">
            <input id="set-about-values-title" className="field" value={form.aboutValuesTitle} onChange={(e) => set('aboutValuesTitle', e.target.value)} />
          </FormField>
        </div>
        {([1, 2, 3] as const).map((index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <FormField label={`Titlu principiu ${index}`} htmlFor={`set-about-value-${index}-title`}>
              <input
                id={`set-about-value-${index}-title`}
                className="field"
                value={form[`aboutValue${index}Title`]}
                onChange={(e) => set(`aboutValue${index}Title`, e.target.value)}
              />
            </FormField>
            <FormField label={`Text principiu ${index}`} htmlFor={`set-about-value-${index}-text`}>
              <input
                id={`set-about-value-${index}-text`}
                className="field"
                value={form[`aboutValue${index}Text`]}
                onChange={(e) => set(`aboutValue${index}Text`, e.target.value)}
              />
            </FormField>
          </div>
        ))}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă „Ce facem”" htmlFor="set-about-what-eyebrow">
            <input id="set-about-what-eyebrow" className="field" value={form.aboutWhatEyebrow} onChange={(e) => set('aboutWhatEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu „Ce facem”" htmlFor="set-about-what-title">
            <input id="set-about-what-title" className="field" value={form.aboutWhatTitle} onChange={(e) => set('aboutWhatTitle', e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Titlu card librărie" htmlFor="set-about-shop-title">
            <input id="set-about-shop-title" className="field" value={form.aboutShopTitle} onChange={(e) => set('aboutShopTitle', e.target.value)} />
          </FormField>
          <FormField label="Titlu card editură" htmlFor="set-about-publishing-title">
            <input id="set-about-publishing-title" className="field" value={form.aboutPublishingTitle} onChange={(e) => set('aboutPublishingTitle', e.target.value)} />
          </FormField>
        </div>
        <TextArea label="Text card librărie" id="set-about-shop-text" value={form.aboutShopText} onChange={(v) => set('aboutShopText', v)} rows={3} />
        <TextArea label="Text card editură" id="set-about-publishing-text" value={form.aboutPublishingText} onChange={(v) => set('aboutPublishingText', v)} rows={3} />
        <TextArea label="Povestea noastră (paragrafe separate prin linie goală)" id="set-about" value={form.aboutText} onChange={(v) => set('aboutText', v)} rows={5} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Text final (întrebare)" htmlFor="set-about-cta-text">
            <input id="set-about-cta-text" className="field" value={form.aboutCtaText} onChange={(e) => set('aboutCtaText', e.target.value)} />
          </FormField>
          <FormField label="Text buton final" htmlFor="set-about-cta-label">
            <input id="set-about-cta-label" className="field" value={form.aboutCtaLabel} onChange={(e) => set('aboutCtaLabel', e.target.value)} />
          </FormField>
        </div>
      </Group>

      {/* Contact page copy */}
      <Group title="Pagina Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă" htmlFor="set-contact-eyebrow">
            <input id="set-contact-eyebrow" className="field" value={form.contactEyebrow} onChange={(e) => set('contactEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu" htmlFor="set-contact-title">
            <input id="set-contact-title" className="field" value={form.contactTitle} onChange={(e) => set('contactTitle', e.target.value)} />
          </FormField>
        </div>
        <TextArea label="Descriere" id="set-contact-description" value={form.contactDescription} onChange={(v) => set('contactDescription', v)} rows={3} />
      </Group>

      {/* Checkout & delivery copy */}
      <Group title="Checkout, livrare și lockere">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Etichetă checkout" htmlFor="set-checkout-eyebrow">
            <input id="set-checkout-eyebrow" className="field" value={form.checkoutEyebrow} onChange={(e) => set('checkoutEyebrow', e.target.value)} />
          </FormField>
          <FormField label="Titlu checkout (produse fizice)" htmlFor="set-checkout-title-physical">
            <input id="set-checkout-title-physical" className="field" value={form.checkoutTitlePhysical} onChange={(e) => set('checkoutTitlePhysical', e.target.value)} />
          </FormField>
          <FormField label="Titlu checkout (digital)" htmlFor="set-checkout-title-digital">
            <input id="set-checkout-title-digital" className="field" value={form.checkoutTitleDigital} onChange={(e) => set('checkoutTitleDigital', e.target.value)} />
          </FormField>
        </div>
        <TextArea label="Descriere checkout (produse fizice)" id="set-checkout-description-physical" value={form.checkoutDescriptionPhysical} onChange={(v) => set('checkoutDescriptionPhysical', v)} rows={2} />
        <TextArea label="Descriere checkout (digital)" id="set-checkout-description-digital" value={form.checkoutDescriptionDigital} onChange={(v) => set('checkoutDescriptionDigital', v)} rows={2} />
        <TextArea label="Notă plată în formular" id="set-checkout-payment-notice" value={form.checkoutPaymentNotice} onChange={(v) => set('checkoutPaymentNotice', v)} rows={4} />
        <TextArea label="Notă plată în sumarul comenzii" id="set-checkout-summary-note" value={form.checkoutSummaryNote} onChange={(v) => set('checkoutSummaryNote', v)} rows={2} />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Taxă curier (RON)" htmlFor="set-fee-courier">
            <input id="set-fee-courier" type="number" min="0" step="0.01" className="field" value={form.shippingFeeCourier} onChange={(e) => set('shippingFeeCourier', e.target.value)} />
          </FormField>
          <FormField label="Taxă EasyBox (RON)" htmlFor="set-fee-easybox">
            <input id="set-fee-easybox" type="number" min="0" step="0.01" className="field" value={form.shippingFeeEasybox} onChange={(e) => set('shippingFeeEasybox', e.target.value)} />
          </FormField>
          <FormField label="Taxă FANbox (RON)" htmlFor="set-fee-fanbox">
            <input id="set-fee-fanbox" type="number" min="0" step="0.01" className="field" value={form.shippingFeeFanbox} onChange={(e) => set('shippingFeeFanbox', e.target.value)} />
          </FormField>
        </div>

        <FormField label="Titlu popup EasyBox" htmlFor="set-easybox-notice-title">
          <input id="set-easybox-notice-title" className="field" value={form.easyboxNoticeTitle} onChange={(e) => set('easyboxNoticeTitle', e.target.value)} />
        </FormField>
        <TextArea label="Text popup EasyBox" id="set-easybox-notice-text" value={form.easyboxNoticeText} onChange={(v) => set('easyboxNoticeText', v)} rows={8} />
        <FormField label="Titlu popup FANbox" htmlFor="set-fanbox-notice-title">
          <input id="set-fanbox-notice-title" className="field" value={form.fanboxNoticeTitle} onChange={(e) => set('fanboxNoticeTitle', e.target.value)} />
        </FormField>
        <TextArea label="Text popup FANbox" id="set-fanbox-notice-text" value={form.fanboxNoticeText} onChange={(v) => set('fanboxNoticeText', v)} rows={8} />
        <FormField label="Text buton închidere popup" htmlFor="set-pickup-notice-confirm">
          <input id="set-pickup-notice-confirm" className="field" value={form.pickupNoticeConfirm} onChange={(e) => set('pickupNoticeConfirm', e.target.value)} />
        </FormField>
        <p className="text-xs leading-relaxed text-ink-muted">
          Taxele se aplică imediat în checkout și sunt recalculate pe server la plasarea
          comenzii. Textele popup-urilor apar când clientul alege EasyBox sau FANbox.
        </p>
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
        <FormField label="Text subsol" htmlFor="set-footer-note">
          <input id="set-footer-note" className="field" value={form.footerNote} onChange={(e) => set('footerNote', e.target.value)} />
        </FormField>
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
