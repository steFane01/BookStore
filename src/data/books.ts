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
    categoryId: 'carti',
    productType: 'physical',
    variants: [],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata se face ramburs sau prin transfer bancar după confirmarea comenzii.',
      returns: 'Returnare gratuită în termen de 14 zile dacă volumul nu a fost deschis.',
    },
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
    categoryId: 'carti',
    productType: 'physical',
    variants: [],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata ramburs sau transfer bancar.',
      returns: 'Returnare gratuită în 14 zile.',
    },
    featured: false,
    status: 'active',
    tags: ['eseuri', 'contemporan'],
  },
  {
    id: 'curs-fotografie-vernal',
    title: 'Atelier digital: Fotografie de produs',
    author: 'RV STUDIO Academy',
    shortDescription:
      'Un ghid video pas cu pas despre cum fotografiezi obiecte și cărți pentru magazinul online, cu exerciții practice și setări gata de folosit.',
    description: `Un curs digital, livrat instant, despre tehnica de fotografiere a produselor pentru comerțul online: lumină, fundaluri, poziționare și post-procesare. Fiecare modul are un exemplu filmat și o listă de verificare pe care o poți folosi imediat.`,
    excerpt: `Lumina laterală, la 45 de grade, scoate textura. Lumina frontală, în schimb, omoară adâncimea. Primele cinci minute din atelier sunt despre exact această diferență.`,
    price: 79,
    stock: 999,
    currency: 'RON',
    cover: {
      src: null,
      alt: 'Coperta atelierului digital „Fotografie de produs”',
      placeholder: {
        title: 'Atelier digital',
        author: 'Fotografie de produs',
        theme: 'brass',
      },
    },
    gallery: [],
    format: 'Video, acces instant',
    category: 'Produse digitale',
    categoryId: 'produse-digitale',
    productType: 'digital',
    variants: [],
    digitalFileUrl: '/files/atelier-fotografie.pdf',
    digitalAccess: 'După efectuarea comenzii primești automat linkul de descărcare pe email, fără costuri de livrare.',
    featured: true,
    status: 'active',
    tags: ['digital', 'fotografie', 'atelier'],
  },
  {
    id: 'carte-semne-de-carte-satin',
    title: 'Set semne de carte din satin',
    author: 'RV STUDIO',
    shortDescription:
      'Un set de trei semne de carte din satin, cu imprimeu inspirat din coperțile noastre — accesoriul perfect pentru pasionații de lectură.',
    description: `Trei semne de carte din satin, cu imprimeu inspirat din colecția RV STUDIO. Disponibile în trei variante de culoare. Un cadou mic, dar care face orice lectură mai plăcută.`,
    excerpt: ``,
    price: 19,
    stock: 40,
    currency: 'RON',
    cover: {
      src: null,
      alt: 'Coperta setului de semne de carte din satin',
      placeholder: {
        title: 'Semne de carte',
        author: 'din satin',
        theme: 'oxblood',
      },
    },
    gallery: [],
    format: '3 buc., satin',
    category: 'Diverse & Accesorii',
    categoryId: 'diverse-accesorii',
    productType: 'physical',
    variants: [
      { id: 'satin-verde', name: 'Verde smarald', priceDelta: 0, stock: 12 },
      { id: 'satin-ocru', name: 'Ocru', priceDelta: 2, stock: 14 },
      { id: 'satin-burgundy', name: 'Burgundy', priceDelta: 3, stock: 14 },
    ],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata ramburs sau transfer bancar.',
      returns: 'Returnare gratuită în 14 zile dacă ambalajul este intact.',
    },
    featured: false,
    status: 'active',
    tags: ['accesorii', 'cadou'],
  },
  {
    id: 'orasul-din-librarie',
    title: 'Orașul din librărie',
    author: 'Andrei Munteanu',
    shortDescription:
      'Un roman despre un cartier care își adună poveștile într-o singură librărie, cu o librăreasă care refuză să închidă ușa.',
    description: `La colțul dintre strada Tăcerea și strada Cititorului se află o librărie care nu apare pe nicio hartă. Cei care o găsesc spun că librăreasa cunoaște fiecare carte pe de rost și că poate ghici titlul de care ai nevoie doar din felul în care porți pauza de la prânz. Romanul urmărește un an în viața acestui cartier, când primăria anunță că librăria trebuie să se mute.`,
    excerpt: 'Printre rafturi, mirosea a hârtie veche și a cafea care se răcea încet.',
    price: 89,
    stock: 20,
    currency: 'RON',
    cover: {
      src: 'https://picsum.photos/seed/orasul-librarie-cover/600/800',
      alt: 'Coperta cărții „Orașul din librărie” de Andrei Munteanu',
    },
    gallery: [
      'https://picsum.photos/seed/orasul-librarie-1/600/800',
      'https://picsum.photos/seed/orasul-librarie-2/600/800',
      'https://picsum.photos/seed/orasul-librarie-3/600/800',
      'https://picsum.photos/seed/orasul-librarie-4/600/800',
    ],
    isbn: '978-606-000-221-7',
    pages: 336,
    year: 2025,
    language: 'Română',
    format: 'Copertă dură, 14 × 21 cm',
    category: 'Ficțiune',
    categoryId: 'carti',
    productType: 'physical',
    variants: [],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata ramburs sau transfer bancar.',
      returns: 'Returnare gratuită în 14 zile, în ambalajul original.',
    },
    featured: true,
    status: 'active',
    tags: ['roman', 'librărie', 'contemporan'],
  },
  {
    id: 'jurnal-de-toamna',
    title: 'Jurnal de toamnă',
    author: 'Irina Stancu',
    shortDescription:
      'Eseuri despre lumina scăzută a toamnei, despre ceaiul de după-amiază și despre felul în care citim mai bine când ne este frig.',
    description: `O culegere de eseuri care urmărește trei luni de toamnă: octombrie, noiembrie, decembrie. Fiecare eseu pleacă de la o imagine simplă — o pleoapă de nor, o foaie galbenă pe un pervaz — și se îndreaptă spre o idee despre ritm, răbdare și lectură. O carte de citit cu paltonul pe umeri.`,
    excerpt: 'Toamna nu este un sfârșit; este doar felul în care anul își trage răsuflarea.',
    price: 64,
    stock: 15,
    currency: 'RON',
    cover: {
      src: 'https://picsum.photos/seed/jurnal-toamna-cover/600/800',
      alt: 'Coperta cărții „Jurnal de toamnă” de Irina Stancu',
    },
    gallery: [
      'https://picsum.photos/seed/jurnal-toamna-1/600/800',
      'https://picsum.photos/seed/jurnal-toamna-2/600/800',
      'https://picsum.photos/seed/jurnal-toamna-3/600/800',
      'https://picsum.photos/seed/jurnal-toamna-4/600/800',
    ],
    isbn: '978-606-000-222-4',
    pages: 192,
    year: 2024,
    language: 'Română',
    format: 'Broșat, 12 × 20 cm',
    category: 'Eseuri',
    categoryId: 'carti',
    productType: 'physical',
    variants: [],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata ramburs sau transfer bancar.',
      returns: 'Returnare gratuită în 14 zile.',
    },
    featured: true,
    status: 'active',
    tags: ['eseuri', 'toamnă', 'contemporan'],
  },
  {
    id: 'ghid-lectura-atenta',
    title: 'Ghidul de lectură atentă — Ediție digitală',
    author: 'Echipa RV STUDIO',
    shortDescription:
      'Un ghid digital PDF de 96 de pagini despre aprofundarea lecturii: note, marginalii și tehnici de recitire — livrat automat pe email.',
    description: `Colecția noastră de texte despre cum să citim nu doar mai mult, ci mai atent. Include tehnici de note, planuri de recitire, exerciții de marginalie și un index de resurse — totul într-un PDF curat, pregătit pentru print.`,
    excerpt: 'A citi atent înseamnă a te întoarce asupra unei pagini ca asupra unei camere în care ai locuit.',
    price: 45,
    stock: 0,
    currency: 'RON',
    cover: {
      src: 'https://picsum.photos/seed/ghid-lectura-cover/600/800',
      alt: 'Coperta ghidului digital „Lectură atentă”',
    },
    gallery: [
      'https://picsum.photos/seed/ghid-lectura-1/600/800',
      'https://picsum.photos/seed/ghid-lectura-2/600/800',
      'https://picsum.photos/seed/ghid-lectura-3/600/800',
    ],
    format: 'PDF, 96 pagini',
    category: 'Produse digitale',
    categoryId: 'produse-digitale',
    productType: 'digital',
    variants: [],
    digitalFileUrl: '/files/ghid-lectura-atenta.pdf',
    digitalAccess:
      'După confirmarea plății, fișierul PDF îți este trimis automat pe email. Îl poți descărca și direct din contul tău, secțiunea Comenzi.',
    featured: true,
    status: 'active',
    tags: ['digital', 'ghid', 'pdf'],
  },
  {
    id: 'atelier-editare-coperte',
    title: 'Atelier digital: Coperte de carte',
    author: 'RV STUDIO Academy',
    shortDescription:
      'Un ghid video pas cu pas despre cum construiești o copertă de carte echilibrată: tipografie, culoare și spațiu negativ — cu exerciții practice.',
    description: `Un curs digital, livrat instant, despre arta copertei: de la tipografie și grilă la paleta de culori și mesajul vizual. Fiecare modul are un exemplu filmat și o listă de verificare pe care o poți folosi imediat.`,
    excerpt: 'O copertă bună nu strigă; ea deschide ușa.',
    price: 99,
    stock: 999,
    currency: 'RON',
    cover: {
      src: 'https://picsum.photos/seed/atelier-cover-cover/600/800',
      alt: 'Coperta atelierului digital „Coperte de carte”',
    },
    gallery: [
      'https://picsum.photos/seed/atelier-cover-1/600/800',
      'https://picsum.photos/seed/atelier-cover-2/600/800',
      'https://picsum.photos/seed/atelier-cover-3/600/800',
    ],
    format: 'Video, acces instant',
    category: 'Produse digitale',
    categoryId: 'produse-digitale',
    productType: 'digital',
    variants: [],
    digitalFileUrl: '/files/atelier-editare-coperte.mp4',
    digitalAccess:
      'După efectuarea comenzii primești automat linkul de acces pe email, fără costuri de livrare.',
    featured: true,
    status: 'active',
    tags: ['digital', 'atelier', 'coperte'],
  },
  {
    id: 'sertar-de-biblioteca',
    title: 'Sertar bibliotecă din lemn',
    author: 'RV STUDIO',
    shortDescription:
      'Un sertar mic din lemn de stejar, gândit să adune semne de carte, note și mici comori de lectură lângă pat sau birou.',
    description: `Un obiect simplu, sculptat în atelierul nostru: sertar din stejar masiv cu sertăraș interior pentru semne și adnotări. Margini rotunjite, finisaj cu ceară naturală. Un loc anume pentru lucrurile care însoțesc lectura.`,
    excerpt: 'Fiecare carte citită lasă câte ceva în urma ei; acest sertar le ține pe toate laolaltă.',
    price: 149,
    stock: 8,
    currency: 'RON',
    cover: {
      src: 'https://picsum.photos/seed/sertar-biblioteca-cover/600/800',
      alt: 'Fotografia sertarului de bibliotecă din lemn',
    },
    gallery: [
      'https://picsum.photos/seed/sertar-biblioteca-1/600/800',
      'https://picsum.photos/seed/sertar-biblioteca-2/600/800',
      'https://picsum.photos/seed/sertar-biblioteca-3/600/800',
      'https://picsum.photos/seed/sertar-biblioteca-4/600/800',
    ],
    format: 'Stejar, 34 × 22 × 12 cm',
    category: 'Diverse & Accesorii',
    categoryId: 'diverse-accesorii',
    productType: 'physical',
    variants: [
      { id: 'v1', name: 'Stejar natural', priceDelta: 0, stock: 3 },
      { id: 'v2', name: 'Stejar nucit', priceDelta: 18, stock: 5 },
    ],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata ramburs sau transfer bancar.',
      returns: 'Returnare gratuită în 14 zile, în ambalajul original.',
    },
    featured: true,
    status: 'active',
    tags: ['accesorii', 'lemn', 'bibliotecă'],
  },
  {
    id: 'lampa-de-citit',
    title: 'Lampă de citit din hârtie',
    author: 'RV STUDIO',
    shortDescription:
      'O lampă caldă, pliabilă, din hârtie artizanală — lumina perfectă pentru paginile de seară, fără ecrane.',
    description: `O lampă de citit cu abajur din hârtie Canson și suport din lemn. Lumina este caldă și difuză, exact ce ai nevoie lângă fotoliu. Se pliază plat pentru depozitare și se deschide prin simpla rotire a suportului.`,
    excerpt: 'Unele lumini nu sunt făcute să lumineze camera, ci doar pagina.',
    price: 89,
    stock: 14,
    currency: 'RON',
    cover: {
      src: 'https://picsum.photos/seed/lampa-citit-cover/600/800',
      alt: 'Fotografia lămpii de citit din hârtie',
    },
    gallery: [
      'https://picsum.photos/seed/lampa-citit-1/600/800',
      'https://picsum.photos/seed/lampa-citit-2/600/800',
      'https://picsum.photos/seed/lampa-citit-3/600/800',
    ],
    format: 'Hârtie + lemn, Ø 26 cm',
    category: 'Diverse & Accesorii',
    categoryId: 'diverse-accesorii',
    productType: 'physical',
    variants: [],
    shippingInfo: {
      delivery: 'Livrare prin curier în 1–3 zile lucrătoare.',
      payment: 'Plata ramburs sau transfer bancar.',
      returns: 'Returnare gratuită în 14 zile, în ambalajul original.',
    },
    featured: true,
    status: 'active',
    tags: ['accesorii', 'lampă', 'lectură'],
  },
]

export const mockCategories: import('../types').ProductCategory[] = [
  { id: 'carti', name: 'Cărți', slug: 'carti', blurb: 'Romane, eseuri și volume pentru toate ritmurile de lectură.', sort: 1 },
  { id: 'produse-digitale', name: 'Produse Digitale', slug: 'produse-digitale', blurb: 'Ateliere și ghiduri livrate instant, fără costuri de transport.', sort: 2 },
  { id: 'diverse-accesorii', name: 'Diverse & Accesorii', slug: 'diverse-accesorii', blurb: 'Semne de carte, cadouri și mici obiecte care însoțesc lectura.', sort: 3 },
]

export function getMockBook(id: string): Book | undefined {
  return mockBooksExtended.find((b) => b.id === id)
}
