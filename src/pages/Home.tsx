import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Book, ProductCategory } from '../types'
import { bookService } from '../services/bookService'
import { useSettings } from '../context/SettingsContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { BookIntro } from '../components/BookIntro'
import { HomeBanner } from '../components/HomeBanner'
import { CoversStrip } from '../components/CoversStrip'
import { SectionHeading } from '../components/SectionHeading'
import { AnimatedSection } from '../components/AnimatedSection'
import { BookGrid } from '../components/BookGrid'
import { NewsletterCta } from '../components/NewsletterCta'
import { IconFeather } from '../components/icons'

const INTRO_SESSION_KEY = 'libraria.intro-seen'

type SortKey = 'featured' | 'title' | 'price-asc' | 'price-desc'

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'Recomandate',
  title: 'Titlu A–Z',
  'price-asc': 'Preț crescător',
  'price-desc': 'Preț descrescător',
}

export default function Home() {
  const { settings } = useSettings()
  usePageMeta(`${settings.brandName} — ${settings.tagline}`, settings.description)

  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('categorie') ?? undefined
  const query = searchParams.get('q') ?? ''
  const sort = (searchParams.get('sort') as SortKey) || 'featured'
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => setSearchInput(query), [query])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, cats] = await Promise.all([
        bookService.getBooks(categoryParam),
        bookService.getCategories(),
      ])
      setBooks(data)
      setCategories(cats)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Catalogul nu a putut fi încărcat. Încearcă din nou.',
      )
    } finally {
      setLoading(false)
    }
  }, [categoryParam])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    let seen = false
    try {
      seen = !!window.sessionStorage.getItem(INTRO_SESSION_KEY)
    } catch {
      // ignore
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShowIntro(!seen && !reduced)
  }, [])

  const handleEnter = () => {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, '1')
    } catch {
      // ignore
    }
    setShowIntro(false)
    window.scrollTo(0, 0)
  }

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const activeCategory = categories.find(
    (category) => category.id === categoryParam || category.slug === categoryParam,
  )

  const visibleBooks = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = term
      ? books.filter((book) =>
          `${book.title} ${book.author} ${book.category ?? ''} ${book.shortDescription}`
            .toLowerCase()
            .includes(term),
        )
      : books
    const sorted = [...list]
    switch (sort) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'ro'))
        break
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured))
    }
    return sorted
  }, [books, query, sort])

  if (loading) return <Loader />

  return (
    <>
      {showIntro && <BookIntro onEnter={handleEnter} />}

      <HomeBanner categories={categories} />

      <CoversStrip
        books={books}
        eyebrow={settings.homeCoversEyebrow}
        title={settings.homeCoversTitle}
      />

      {/* Philosophy statement */}
      <AnimatedSection className="container-page py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow={settings.homePhilosophyEyebrow}
            title={settings.homePhilosophyTitle}
            align="center"
          />
          <p className="mt-8 font-serif text-xl leading-relaxed text-ink-light">
            {settings.description}
          </p>
        </div>
      </AnimatedSection>

      {/* Catalog */}
      <AnimatedSection className="container-page pb-20 md:pb-28">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow={settings.homeCatalogEyebrow}
            title={activeCategory ? activeCategory.name : settings.homeCatalogTitle}
            description={
              activeCategory ? activeCategory.blurb : settings.homeCatalogDescription
            }
          />
          <IconFeather className="hidden h-10 w-10 text-brass/40 md:block" aria-hidden="true" />
        </div>

        {/* Search + sort */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-md items-center gap-2">
            <label htmlFor="catalog-search" className="sr-only">
              Caută în catalog
            </label>
            <input
              id="catalog-search"
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
                setParam('q', event.target.value)
              }}
              placeholder="Caută un titlu sau un autor…"
              className="field flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-sm text-ink-muted">
              Sortează
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(event) => setParam('sort', event.target.value)}
              className="field max-w-[14rem]"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {query && (
          <p className="mt-4 text-sm text-ink-muted">
            {visibleBooks.length} rezultat{visibleBooks.length === 1 ? '' : 'e'} pentru „{query}”
          </p>
        )}

        <div className="mt-10">
          {error ? (
            <div className="mx-auto max-w-lg border border-oxblood/30 bg-oxblood/5 px-6 py-8 text-center">
              <p className="font-serif text-xl text-ink">Catalogul nu este disponibil momentan.</p>
              <p className="mt-2 text-sm text-ink-muted">{error}</p>
              <button onClick={() => void loadData()} className="btn btn-primary mt-5 px-6 py-2.5">
                Reîncearcă
              </button>
            </div>
          ) : visibleBooks.length > 0 ? (
            <BookGrid books={visibleBooks} />
          ) : (
            <p className="text-center text-ink-muted">
              {query
                ? 'Nu am găsit produse care să corespundă căutării.'
                : 'Momentan nu există produse publicate în această colecție.'}
            </p>
          )}
        </div>
      </AnimatedSection>

      <NewsletterCta />
    </>
  )
}

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brass border-t-transparent" />
        <span className="text-sm uppercase tracking-[0.2em] text-ink-muted">
          Se deschide librăria…
        </span>
      </div>
    </div>
  )
}
