/**
 * Default storefront settings.
 *
 * These values are used before the backend answers `/api/settings` and act as
 * fallbacks for any field the owner has not filled in yet. Everything here can
 * be changed from Admin → Setări — no rebuild required.
 */
export interface SiteSettings {
  brandName: string
  brandNameLong: string
  tagline: string
  description: string
  heroImage: string
  heroAlt: string
  logoImage: string
  contactEmail: string
  contactPhone: string
  instagram: string
  facebook: string
  newsletter: string
  legalCompany: string
  legalCui: string
  legalRegCom: string
  legalAddress: string
  legalEmail: string
  deliveryInfo: string
  paymentInfo: string
  returnsInfo: string
  aboutText: string
}

export const defaultSettings: SiteSettings = {
  brandName: 'RV STUDIO',
  brandNameLong: 'RV STUDIO — Cărți & Tipar',
  tagline: 'O librărie independentă și o mică editură.',
  description:
    'Cărți atent alese, tipografie frumoasă și gustul lucrurilor făcute cu răbdare. O librărie pentru cei care citesc încet, cu creionul în mână.',
  heroImage: '/welcomepage.jpeg',
  heroAlt: 'Colecțiile RV STUDIO — cărți, produse digitale și accesorii',
  logoImage: '/logo_books.jpeg',
  contactEmail: 'contact@rvstudio.ro',
  contactPhone: '',
  instagram: '',
  facebook: '',
  newsletter: '',
  legalCompany: '',
  legalCui: '',
  legalRegCom: '',
  legalAddress: '',
  legalEmail: 'contact@rvstudio.ro',
  deliveryInfo: 'Livrare prin curier sau la EasyBox, în 2–5 zile lucrătoare.',
  paymentInfo: 'Plata se face la livrare (ramburs) sau prin transfer, după confirmarea comenzii.',
  returnsInfo: 'Ai dreptul de a returna produsele în 14 zile calendaristice, conform legii.',
  aboutText: '',
}

/** Backwards-compatible alias used by a few static references. */
export const siteConfig = defaultSettings

export type SiteConfig = SiteSettings
