import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Book, ProductVariant } from '../types'
import { bookService } from '../services/bookService'
import { BookCover } from '../components/BookCover'
import { QuantitySelector } from '../components/QuantitySelector'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'
import { IconArrowRight, IconCheck } from '../components/icons'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setQuantity(1)
    setAdded(false)
    setSelectedVariantId(null)
    ;(async () => {
      const data = id ? await bookService.getBookById(id) : undefined
      if (!active) return
      setBook(data ?? null)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container-page flex min-h-screen flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-serif text-4xl text-ink">Produsul nu a fost găsit.</h1>
        <p className="max-w-md text-ink-muted">
          Poate a fost retras din catalog, sau adresa este greșită.
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary px-6 py-3">
          Înapoi la magazin
        </button>
      </div>
    )
  }

  const selectedVariant: ProductVariant | undefined = book.variants?.find(
    (v) => v.id === selectedVariantId,
  )
  const effectivePrice = (selectedVariant?.priceDelta ?? 0) + book.price
  const effectiveStock = selectedVariant
    ? selectedVariant.stock ?? book.stock
    : book.stock
  const inStock = effectiveStock > 0
  const isDigital = book.productType === 'digital'
  const needsVariant =
    !!book.variants && book.variants.length > 0 && !selectedVariant

  const handleAdd = () => {
    if (needsVariant) return
    addItem(book, {
      quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      price: effectivePrice,
      productType: book.productType,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }


  return (
    <div className="pt-20 md:pt-24">
      {/* Two-column opening */}
      <section className="container-page grid gap-12 py-12 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="flex justify-center lg:justify-end">
          <AnimatedSection className="w-full max-w-sm">
            <BookCover book={book} dimensional size="lg" className="aspect-[2/3] w-full" />
          </AnimatedSection>
        </div>

        <AnimatedSection className="flex flex-col items-start" delay={120}>
          {/* Category badge */}
          <span className="mb-4 inline-flex items-center rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-xs uppercase tracking-widest text-oxblood">
            {book.category ?? (isDigital ? 'Produs digital' : 'Produs')}
          </span>
          <h1 className="serif-display text-4xl text-balance text-ink sm:text-5xl md:text-6xl">
            {book.title}
          </h1>
          <p className="mt-2 font-serif text-2xl italic text-brass-dark">{book.author}</p>
          <p className="mt-6 max-w-xl leading-relaxed text-ink-light">{book.shortDescription}</p>

          <div className="mt-8 flex items-center gap-6">
            <span className="font-serif text-4xl text-ink">
              {formatPrice(effectivePrice)}
            </span>
            <span
              className={`flex items-center gap-1.5 text-sm ${
                inStock ? 'text-oxblood' : 'text-ink-muted'
              }`}
            >
              <IconCheck className="h-4 w-4" />
              {inStock
                ? isDigital
                  ? 'Livrare instant'
                  : 'În stoc'
                : 'Stoc epuizat'}
            </span>
          </div>

          {/* Variant selector */}
          {book.variants && book.variants.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-sm uppercase tracking-wider text-ink-muted">
                Alege varianta
              </p>
              <div className="flex flex-wrap gap-2">
                {book.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={(v.stock ?? book.stock) <= 0}
                    className={`rounded-sm border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selectedVariantId === v.id
                        ? 'border-oxblood bg-oxblood text-paper-100'
                        : 'border-ink/20 text-ink hover:border-oxblood hover:text-oxblood'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
              {needsVariant && (
                <p className="mt-3 text-xs text-ink-muted">
                  Selectează o variantă înainte de a adăuga în coș.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock || needsVariant}
              className="btn btn-primary px-7 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {added
                ? 'Adăugat ✓'
                : isDigital
                  ? 'Cumpără digital'
                  : 'Adaugă în coș'}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock || needsVariant}
              className="btn btn-outline px-6 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cumpără acum
              <IconArrowRight className="h-4 w-4" />
            </button>
          </div>

          {added && (
            <p className="mt-3 text-sm text-oxblood" role="status">
              Produsul a fost adăugat în coș.
            </p>
          )}
        </AnimatedSection>
      </section>


      {/* Despre produs */}
      <AnimatedSection className="border-y border-ink/10 bg-paper-200/50 py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={isDigital ? 'Despre produs' : 'Despre carte'}
            title="Povestea din spatele paginilor"
          />
          <div className="mt-8 max-w-3xl">
            <p className="max-w-2xl whitespace-pre-line leading-relaxed text-ink-light">
              {book.description}
            </p>
          </div>

          {/* Digital access note */}
          {isDigital && book.digitalAccess && (
            <div className="mt-8 max-w-3xl rounded-sm border border-brass/40 bg-brass/10 p-6">
              <p className="text-sm font-medium text-ink">Acces la produs</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-light">
                {book.digitalAccess}
              </p>
            </div>
          )}

          {/* Physical shipping / returns info */}
          {!isDigital && book.shippingInfo && (
            <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
              {book.shippingInfo.delivery && (
                <InfoCard title="Livrare" text={book.shippingInfo.delivery} />
              )}
              {book.shippingInfo.payment && (
                <InfoCard title="Plată" text={book.shippingInfo.payment} />
              )}
              {book.shippingInfo.returns && (
                <InfoCard title="Returnare" text={book.shippingInfo.returns} />
              )}
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Fragment din carte — printed page look (books only) */}
      {!isDigital && book.excerpt && (
        <AnimatedSection className="container-page py-20">
          <SectionHeading eyebrow="Fragment din carte" title="Un început de lectură" />
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="border border-ink/15 bg-paper-50 p-8 shadow-soft md:p-12">
              <div className="mb-8 flex items-center justify-between border-b border-ink/10 pb-4 text-xs uppercase tracking-widest text-ink-muted">
                <span>Din {book.title}</span>
                <span>un fragment citibil</span>
              </div>
              <div className="drop-cap break-words whitespace-pre-line font-serif text-lg leading-[1.9] text-ink-light md:text-xl">
                {book.excerpt}
              </div>
              <div className="mt-10 flex items-center justify-center gap-4 text-brass" aria-hidden="true">
                <span className="h-px w-8 bg-current" />
                <span className="h-px w-8 bg-current" />
                <span className="h-px w-8 bg-current" />
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Detalii */}
      <AnimatedSection className="border-t border-ink/10 bg-paper-200/50 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Detalii" title="Date despre ediție" />
          <dl className="mt-8 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-2">
            {book.author && <DetailRow label="Autor" value={book.author} />}
            {book.isbn && <DetailRow label="ISBN" value={book.isbn} />}
            {book.pages && <DetailRow label="Număr de pagini" value={String(book.pages)} />}
            {book.year && <DetailRow label="An apariție" value={String(book.year)} />}
            {book.language && <DetailRow label="Limbă" value={book.language} />}
            {book.format && <DetailRow label="Format" value={book.format} />}
            {isDigital && book.digitalFileUrl && (
              <DetailRow label="Livrare" value="Descărcare instant după comandă" />
            )}
          </dl>
        </div>
      </AnimatedSection>

      {book.gallery && book.gallery.length > 0 && (
        <AnimatedSection className="container-page py-20">
          <SectionHeading eyebrow="Galerie foto" title="Imagini" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {book.gallery.map((src, i) => (
              <a
                key={`${src}-${i}`}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden border border-ink/10"
              >
                <img
                  src={src}
                  alt={`${book.title} — imagine ${i + 1}`}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* Continue exploring */}
      <div className="container-page py-16 text-center">
        <button onClick={() => navigate('/')} className="btn btn-outline px-7 py-3">
          <IconArrowRight className="h-4 w-4 rotate-180" />
          Înapoi la magazin
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 py-4">
      <dt className="text-sm uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="text-right font-serif text-lg text-ink">{value}</dd>
    </div>
  )
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-ink/10 bg-paper-50 p-5">
      <p className="text-sm font-medium uppercase tracking-wider text-ink-muted">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-light">{text}</p>
    </div>
  )
}

