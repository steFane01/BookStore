/**
 * Default storefront settings.
 *
 * These values are used before the backend answers `/api/settings` and act as
 * fallbacks for any field the owner has not filled in yet. Everything here can
 * be changed from Admin → Setări — no rebuild required.
 */
export interface SiteSettings {
  // Identitate
  brandName: string
  brandNameLong: string
  tagline: string
  description: string
  heroImage: string
  heroAlt: string
  logoImage: string
  // Contact și social
  contactEmail: string
  contactPhone: string
  instagram: string
  facebook: string
  // Newsletter
  newsletter: string
  newsletterEyebrow: string
  newsletterTitle: string
  newsletterCta: string
  newsletterSuccess: string
  // Date firmă și informații pentru clienți
  legalCompany: string
  legalCui: string
  legalRegCom: string
  legalAddress: string
  legalEmail: string
  deliveryInfo: string
  paymentInfo: string
  returnsInfo: string
  aboutText: string
  // Pagina principală
  homeHeroEyebrow: string
  homeHeroCta: string
  homePhilosophyEyebrow: string
  homePhilosophyTitle: string
  homeCoversEyebrow: string
  homeCoversTitle: string
  homeCatalogEyebrow: string
  homeCatalogTitle: string
  homeCatalogDescription: string
  // Pagina produs
  bookAboutEyebrow: string
  bookAboutEyebrowDigital: string
  bookAboutTitle: string
  bookDetailsEyebrow: string
  bookDetailsTitle: string
  bookExcerptEyebrow: string
  bookExcerptTitle: string
  bookGalleryEyebrow: string
  bookGalleryTitle: string
  // Pagina Despre
  aboutEyebrow: string
  aboutTitle: string
  aboutStoryEyebrow: string
  aboutStoryTitle: string
  aboutValuesEyebrow: string
  aboutValuesTitle: string
  aboutWhatEyebrow: string
  aboutWhatTitle: string
  aboutValue1Title: string
  aboutValue1Text: string
  aboutValue2Title: string
  aboutValue2Text: string
  aboutValue3Title: string
  aboutValue3Text: string
  aboutShopTitle: string
  aboutShopText: string
  aboutPublishingTitle: string
  aboutPublishingText: string
  aboutCtaText: string
  aboutCtaLabel: string
  // Pagina Contact
  contactEyebrow: string
  contactTitle: string
  contactDescription: string
  // Checkout, livrare și lockere
  checkoutEyebrow: string
  checkoutTitlePhysical: string
  checkoutTitleDigital: string
  checkoutDescriptionPhysical: string
  checkoutDescriptionDigital: string
  checkoutPaymentNotice: string
  checkoutSummaryNote: string
  easyboxNoticeTitle: string
  easyboxNoticeText: string
  fanboxNoticeTitle: string
  fanboxNoticeText: string
  pickupNoticeConfirm: string
  shippingFeeCourier: string
  shippingFeeEasybox: string
  shippingFeeFanbox: string
  // Subsol
  footerNote: string
}

export const defaultSettings: SiteSettings = {
  // Identitate
  brandName: 'RV STUDIO',
  brandNameLong: 'RV STUDIO — Cărți & Tipar',
  tagline: 'O librărie independentă și o mică editură.',
  description:
    'Cărți atent alese, tipografie frumoasă și gustul lucrurilor făcute cu răbdare. O librărie pentru cei care citesc încet, cu creionul în mână.',
  heroImage: '/welcomepage.jpeg',
  heroAlt: 'Colecțiile RV STUDIO — cărți, produse digitale și accesorii',
  logoImage: '/logo_books.jpeg',
  // Contact și social
  contactEmail: 'contact@rvstudio.ro',
  contactPhone: '',
  instagram: '',
  facebook: '',
  // Newsletter
  newsletter:
    'O scrisoare scurtă, din când în când. Fără zgomot, doar titluri pe care le-am ales cu grijă.',
  newsletterEyebrow: 'Rămâi aproape',
  newsletterTitle: 'Primește vești despre cărțile noi',
  newsletterCta: 'Mă abonez',
  newsletterSuccess: 'Mulțumim! Te așteptăm la prima scrisoare.',
  // Date firmă și informații pentru clienți
  legalCompany: '',
  legalCui: '',
  legalRegCom: '',
  legalAddress: '',
  legalEmail: 'contact@rvstudio.ro',
  deliveryInfo: 'Livrare prin curier sau la EasyBox / FANbox, în 2–5 zile lucrătoare.',
  paymentInfo:
    'Plata se face la livrare (ramburs), prin transfer după confirmarea comenzii sau cu cardul la locker.',
  returnsInfo: 'Ai dreptul de a returna produsele în 14 zile calendaristice, conform legii.',
  aboutText: '',
  // Pagina principală
  homeHeroEyebrow: 'Colecția',
  homeHeroCta: 'Explorează',
  homePhilosophyEyebrow: 'Despre noi',
  homePhilosophyTitle: 'O librărie pentru cei care citesc încet',
  homeCoversEyebrow: 'Cărți',
  homeCoversTitle: 'Catalog',
  homeCatalogEyebrow: 'Catalog',
  homeCatalogTitle: 'Titluri din librărie',
  homeCatalogDescription:
    'Lucrăm la noi apariții. Până atunci, acestea sunt produsele pe care le poți avea acasă.',
  // Pagina produs
  bookAboutEyebrow: 'Despre carte',
  bookAboutEyebrowDigital: 'Despre produs',
  bookAboutTitle: 'Povestea din spatele paginilor',
  bookDetailsEyebrow: 'Detalii',
  bookDetailsTitle: 'Date despre ediție',
  bookExcerptEyebrow: 'Fragment din carte',
  bookExcerptTitle: 'Un început de lectură',
  bookGalleryEyebrow: 'Galerie foto',
  bookGalleryTitle: 'Imagini',
  // Pagina Despre
  aboutEyebrow: 'Despre noi',
  aboutTitle: 'O librărie pentru cei care citesc încet',
  aboutStoryEyebrow: 'Povestea noastră',
  aboutStoryTitle: 'Am deschis o librărie mică, cu gust mare',
  aboutValuesEyebrow: 'Ce ne ghidează',
  aboutValuesTitle: 'Principiile noastre',
  aboutWhatEyebrow: 'Ce facem',
  aboutWhatTitle: 'Librărie & editura',
  aboutValue1Title: 'Răbdarea',
  aboutValue1Text:
    'Nu publicăm grăbit. Fiecare carte trece prin mâini atente, de la text până la grosimea hârtiei.',
  aboutValue2Title: 'Gustul',
  aboutValue2Text:
    'Preferăm puține titluri, bune, în locul unei vitrine pline de lucruri gălăgioase.',
  aboutValue3Title: 'Comunitatea',
  aboutValue3Text:
    'Credem în cititorii noștri: în recomandări făcute om către om, în lecturi care rămân.',
  aboutShopTitle: 'Librărie',
  aboutShopText:
    'Un stoc atent selectat de ficțiune, eseuri și cărți care merită spațiu în biblioteca ta. Căutăm titluri care ies din val și le punem în față.',
  aboutPublishingTitle: 'Editura',
  aboutPublishingText:
    'Publicăm puține cărți, dar cu grijă: traduceri atente, design editorial atent și o prezență de hârtie care să stea bine pe raftul tău.',
  aboutCtaText: 'Ai o întrebare despre o carte sau o comandă?',
  aboutCtaLabel: 'Contactează-ne',
  // Pagina Contact
  contactEyebrow: 'Contact',
  contactTitle: 'Hai să vorbim',
  contactDescription:
    'O întrebare despre un produs, o comandă sau o propunere de colaborare — îți răspundem cu plăcere.',
  // Checkout, livrare și lockere
  checkoutEyebrow: 'Finalizare comandă',
  checkoutTitlePhysical: 'Detalii de livrare',
  checkoutTitleDigital: 'Detalii de contact',
  checkoutDescriptionPhysical: 'Completează datele pentru livrare. Plata se face la livrare sau la locker.',
  checkoutDescriptionDigital:
    'Produsele digitale se livrează instant, fără costuri de transport.',
  checkoutPaymentNotice:
    'Pentru curier: plata se face la livrare (ramburs) sau prin transfer, după confirmarea comenzii. Pentru EasyBox sau FANbox: coletul se plătește cu cardul direct la locker, la ridicare — poți alege și ramburs la locker.',
  checkoutSummaryNote: 'Plata se face la livrare: ramburs, transfer sau card la locker.',
  easyboxNoticeTitle: 'Livrare la EasyBox',
  easyboxNoticeText: `Comanda va fi trimisă către lockerul EasyBox ales de tine.\n\n1. Scrie mai jos numele exact al lockerului EasyBox și adresa lui completă (exact cum apar în aplicația SameDay).\n2. Coletul este livrat direct la acel locker, pe numele și telefonul indicate.\n3. Plata se face cu cardul la locker, la ridicarea coletului. Poți alege și plata ramburs la locker.\n\nDupă plasarea comenzii primești pe email confirmarea și detaliile de livrare.`,
  fanboxNoticeTitle: 'Livrare la FANbox',
  fanboxNoticeText: `Comanda va fi trimisă către lockerul FANbox ales de tine.\n\n1. Scrie mai jos numele exact al lockerului FANbox și adresa lui completă.\n2. Coletul este livrat direct la acel locker, pe numele și telefonul indicate.\n3. Plata se face exclusiv cu cardul la locker. Poți achita doar transportul sau valoarea întreagă a coletului (ramburs).\n\nPrimești pe email confirmarea comenzii, cu toate detaliile.`,
  pickupNoticeConfirm: 'Am înțeles',
  shippingFeeCourier: '19',
  shippingFeeEasybox: '12',
  shippingFeeFanbox: '12',
  // Subsol
  footerNote: 'Realizat cu răbdare, ca o carte bună.',
}

/** Backwards-compatible alias used by a few static references. */
export const siteConfig = defaultSettings

export type SiteConfig = SiteSettings
