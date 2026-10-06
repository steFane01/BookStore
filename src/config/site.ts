/**
 * Central site / brand configuration.
 *
 * Everything you would normally want to replace (brand name, tagline,
 * contact details, social links) lives here in one obvious place.
 */
export const siteConfig = {
  brandName: 'Librăria',
  brandNameLong: 'Librăria — Cărți & Tipar',
  tagline: 'O librărie independentă și o mică editură.',
  description:
    'Cărți atent alese, tipografie frumoasă și gustul lucrurilor făcute cu răbdare. O librărie pentru cei care citesc încet, cu creionul în mână.',

  contact: {
    email: 'bună@libraria.ro',
    phone: '+40 21 555 0123',
  },

  social: {
    instagram: '#',
    facebook: '#',
    newsletter: '#',
  },

  /** Year used in the footer. */
  currentYear: new Date().getFullYear(),

  links: {
    // Internal routes
    magazin: '/',
    despre: '/despre',
    contact: '/contact',
    cont: '/cont',
    admin: '/admin',
  },
} as const

export type SiteConfig = typeof siteConfig
