import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Book, ProductCategory } from '../types'
import { bookService } from '../services/bookService'
import { useSettings } from '../context/SettingsContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { AnimatedSection } from '../components/AnimatedSection'
import { BookGrid } from '../components/BookGrid'
import { IconArrowLeft, IconFeather } from '../components/icons'

/**
 * Category landing page (`/categorie/<slug>`).
 *
 * Big serif title in the foreground, the owner-written description underneath,
 * the optional owner-uploaded image, then the products of that collection.
 * Every link back goes to the homepage.
 */
export default function CategoryPage() {
  const { slug = '' } = useParams()
  const { settings } = useSettings()

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const [categoryList, bookList] = await Promise.all([
        bookService.getCategories(),
        bookService.getBooks(slug),
      ])
      setCategories(categoryList)
      setBooks(bookList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Colecția nu a putut fi încărcată.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const category = useMemo(
    () => categories.find((item) => item.slug === slug || item.id === slug),
    [categories, slug],
  )
  const otherCategories = useMemo(
    () => categories.filter((item) => item.id !== category?.id),
    [categories, category],
  )

  const description = category?.description?.trim() || category?.blurb?.trim() || ''

  usePageMeta(
    category ? `${category.name} — ${settings.brandName}` : `Colecție — ${settings.brandName}`,
    description || undefined,
  )

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          <span className="text-sm uppercase tracking-[0.2em] text-ink-muted">Se deschide colecția…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-20 md:pt-24">
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
          <p className="eyebrow">Colecție</p>
          <h1 className="serif-display text-4xl text-ink">Colecția nu este disponibilă momentan.</h1>
          <p className="max-w-md text-sm text-ink-muted">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => void load()} className="btn btn-primary px-6 py-3">
              Reîncearcă
            </button>
            <Link to="/" className="btn btn-outline px-6 py-3">
              Înapoi la pagina principală
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="pt-20 md:pt-24">
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
          <p className="eyebrow">Colecție</p>
          <h1 className="serif-display text-4xl text-ink">Colecția nu a fost găsită.</h1>
          <p className="max-w-md text-sm text-ink-muted">
            Poate a fost redenumită. Întoarce-te la pagina principală și alege o altă colecție.
          </p>
          <Link to="/" className="btn btn-primary px-6 py-3">
            Înapoi la pagina principală
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page py-10 md:py-14">
        <Link
          to="/"
          className="btn btn-outline px-5 py-2.5 text-sm"
        >
          <IconArrowLeft className="h-4 w-4" />
          Înapoi la pagina principală
        </Link>

        <header className="mt-10 border-b border-ink/10 pb-10 md:mt-14 md:pb-12">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="eyebrow">Colecție</p>
              <h1 className="serif-display mt-3 text-balance text-5xl text-ink sm:text-6xl md:text-7xl">
                {category.name}
              </h1>
            </div>
            <IconFeather className="hidden h-10 w-10 shrink-0 text-brass/40 md:block" aria-hidden="true" />
          </div>

          {description && (
            <p className="mt-6 max-w-3xl whitespace-pre-line font-serif text-xl leading-relaxed text-ink-light">
              {description}
            </p>
          )}

          {category.imageUrl && (
            <img
              src={category.imageUrl}
              alt={`Colecția ${category.name}`}
              className="mt-10 h-56 w-full rounded-sm border border-ink/10 object-cover md:h-80"
            />
          )}
        </header>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">
            {books.length} {books.length === 1 ? 'produs' : 'produse'}
          </p>
          {books.length > 0 && (
            <p className="text-sm text-ink-muted">Livrare din stoc, împachetat cu grijă.</p>
          )}
        </div>

        <div className="mt-8">
          {books.length > 0 ? (
            <BookGrid books={books} />
          ) : (
            <div className="border border-ink/10 bg-paper-200/40 px-8 py-14 text-center">
              <p className="font-serif text-2xl text-ink">
                Momentan nu există produse în această colecție.
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Revenim în curând cu titluri noi. Între timp, poți descoperi celelalte colecții.
              </p>
              <Link to="/" className="btn btn-outline mt-6 px-6 py-2.5 text-sm">
                Vezi toate produsele
              </Link>
            </div>
          )}
        </div>

        {otherCategories.length > 0 && (
          <nav className="mt-16 border-t border-ink/10 pt-8">
            <p className="eyebrow">Alte colecții</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {otherCategories.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/categorie/${encodeURIComponent(item.slug || item.id)}`}
                    className="inline-flex border border-ink/15 px-4 py-2 text-sm text-ink transition-colors hover:border-oxblood hover:text-oxblood"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-12">
          <Link
            to="/"
            className="link-underline inline-flex items-center gap-2 text-sm uppercase tracking-wider text-ink-muted transition-colors hover:text-oxblood"
          >
            <IconArrowLeft className="h-4 w-4" />
            Înapoi la pagina principală
          </Link>
        </div>
      </AnimatedSection>
    </div>
  )
}
