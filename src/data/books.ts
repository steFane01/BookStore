import type { Book } from '../types'

/**
 * Centralized mock book catalog.
 *
 * This is the single source of truth for book data until a backend is wired up.
 * Replace, add or remove entries here — the UI adapts automatically.
 *
 * All customer-facing text is intentionally realistic Romanian.
 */

export const mockBooks: Book[] = [
  {
    id: 'cartea-de-pagini-luminoase',
    title: 'Cartea paginilor luminoase',
    author: 'Andrei Munteanu',
    shortDescription:
      'Un roman despre lumină, hârtie și despre oamenii care apucă să găsească frumosul exact atunci când se gândeau să renunțe.',
    description: `Scris pe o perioadă de șapte ani, „Cartea paginilor luminoase” este un roman despre timpul pe care îl petrecem în compania cărților și despre felul în care unele povești reușesc să ne schimbe ritmul vieții.

La periferia unui oraș care încă își caută propriul centru, un restaurator de cărți vechi primește un pachet fără trimis. Înăuntru se află un manuscris neterminat, presărat cu însemnări, și o sugestie pe jumătate ștearsă: „continuă-l tu”. Romanul urmărește încercarea lui de a decripta acest apel, călătorind între atelierul său cu miros de clei și lianți, bibliotecile uitate și viețile cititorilor care au lăsat câte o urmă între pagini.

Este o carte silențioasă, atentă la mici detalii — la fel ca meseria pe care o descrie. O poveste despre răbdare, despre felul în care ne construim amintirile din bucăți de text, și despre curajul de a lăsa o lucrare neterminată în mâinile altcuiva.`,
    excerpt: `Atelierul mirosea a clei cald și a carton vechi. Deasupra mesei, lampa arunca o lumină galbenă, aproape lichidă, pe coperta desfăcută a unui volum pe jumătate restaurat.

Tudor așeză manuscrisul lângă foarfece, fără cutezanța de a-l deschide imediat. Unele cărți cer o anumită tăcere înainte de a-ți îngădui primul cuvânt. Privirea i se opri pe prima filă, unde cineva scrisese cu cerneală brună, într-un caligrafie ușor tremurată:

„Dacă citești asta, înseamnă că povestea nu s-a terminat cât am crezut eu.”

Restul paginii era gol. Golul acela părea un soi de răbdare — răbdarea cuvintelor care așteptau să fie reînviate printr-o altă mână.`,
    price: 89,
    stock: 24,
    currency: 'RON',
    cover: {
      src: null,
      alt: 'Coperta cărții „Cartea paginilor luminoase” de Andrei Munteanu',
      placeholder: {
        title: 'Cartea paginilor luminoase',
        author: 'Andrei Munteanu',
        theme: 'oxblood',
      },
    },
    gallery: [],
    isbn: '978-606-000-123-4',
    pages: 312,
    year: 2024,
    language: 'Română',
    format: 'Copertă dură, 13 × 20 cm',
    category: 'Ficțiune',
    featured: true,
    status: 'active',
    tags: ['roman', 'contemporan', 'cărți', 'restaurare'],
  },
]

/**
 * A second (non-featured) example so the store never looks empty and to
 * demonstrate how multiple books render in a grid.
 */
export const mockBooksExtended: Book[] = [
  ...mockBooks,
  {
    id: 'calendarul-semnelor-bune',
    title: 'Calendarul semnelor bune',
    author: 'Irina Stancu',
    shortDescription:
      'Esauri dedicate micilor ritualuri care ne țin aproape de lumea reală, departe de ecrane și de graba fără chip.',
    description: `O colecție de eseuri despre gesturi mici, repetate, care ne ancorează în prezent: udatul florilor dimineața, gătitul în zilele de duminică, cititul cu voce tare pentru cineva drag.

Irina Stancu scrie cu o claritate caldă despre ce înseamnă să construiești o viață pe ritmuri lente, fără să te ferești de munca de zi cu zi. „Calendarul semnelor bune” este o invitație la observație — și o apărare tandră a lucrurilor care se fac încet, dar bine.`,
    excerpt: `Ritualurile nu sunt repetitii goale. Sunt răspunsuri mici pe care le dăm zilelor, pentru ca zilele să nu ne răspundă ele întâi, cu graba lor.

Să gătești pentru cineva e un fel de a-i spune: ai timp. Și timpul, ca și pâinea, crește mai bine când îl împarți.`,
    price: 64,
    stock: 18,
    currency: 'RON',
    cover: {
      src: null,
      alt: 'Coperta cărții „Calendarul semnelor bune” de Irina Stancu',
      placeholder: {
        title: 'Calendarul semnelor bune',
        author: 'Irina Stancu',
        theme: 'brass',
      },
    },
    gallery: [],
    isbn: '978-606-000-130-9',
    pages: 178,
    year: 2023,
    language: 'Română',
    format: 'Broșat, 12 × 19 cm',
    category: 'Eseuri',
    featured: false,
    status: 'active',
    tags: ['eseuri', 'contemporan'],
  },
]

export function getMockBook(id: string): Book | undefined {
  return mockBooksExtended.find((b) => b.id === id)
}
