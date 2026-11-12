import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Book } from '../types'
import { bookService } from '../services/bookService'
import { formatPrice } from '../utils/format'
import { findSearchMatch } from '../utils/search'
import { IconArrowRight, IconClose, IconSearch } from './icons'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 200
const MAX_VISIBLE_RESULTS = 7

interface LiveSearchProps {
  /** `header` floats the results panel under the input; `drawer` renders it inline. */
  variant?: 'header' | 'drawer'
  /** Called after a result/submit navigation (used to close the mobile menu). */
  onNavigate?: () => void
}

/**
 * Live product search: results appear in a styled dropdown while the visitor
 * types, with keyboard navigation, highlighted matches and a link to the full
 * results page. Data comes from `/api/books?q=…` (accent-insensitive).
 */
export function LiveSearch({ variant = 'header', onNavigate }: LiveSearchProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const listId = useId()
  const inputId = `${listId}-input`

  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const requestRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = term.trim()
  const visible = results.slice(0, MAX_VISIBLE_RESULTS)
  const panelOpen = open && trimmed.length >= MIN_QUERY_LENGTH

  // Debounced live query; stale responses are ignored via the request counter.
  useEffect(() => {
    const query = term.trim()
    if (query.length < MIN_QUERY_LENGTH) {
      requestRef.current += 1
      setResults([])
      setLoading(false)
      setActiveIndex(-1)
      return
    }

    setLoading(true)
    setOpen(true)
    const timer = window.setTimeout(async () => {
      const id = ++requestRef.current
      try {
        const list = await bookService.searchBooks(query)
        if (id !== requestRef.current) return
        setResults(list)
        setActiveIndex(-1)
      } catch {
        if (id !== requestRef.current) return
        setResults([])
      } finally {
        if (id === requestRef.current) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [term])

  // Close the panel after any route change (e.g. picking a result elsewhere).
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const goToAllResults = () => {
    if (!trimmed) return
    navigate(`/?q=${encodeURIComponent(trimmed)}`)
    close()
    onNavigate?.()
  }

  const openBook = (book: Book) => {
    navigate(`/carte/${book.id}`)
    setTerm('')
    setResults([])
    close()
    inputRef.current?.blur()
    onNavigate?.()
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const selected = visible[activeIndex]
    if (selected) openBook(selected)
    else goToAllResults()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!panelOpen) {
        if (trimmed.length >= MIN_QUERY_LENGTH) setOpen(true)
        return
      }
      if (visible.length === 0) return
      setActiveIndex((current) => (current + 1) % visible.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!panelOpen || visible.length === 0) return
      setActiveIndex((current) => (current <= 0 ? visible.length - 1 : current - 1))
    } else if (event.key === 'Escape') {
      close()
    }
  }

  const clear = () => {
    setTerm('')
    setResults([])
    setActiveIndex(-1)
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={variant === 'header' ? 'relative w-full max-w-[18rem] xl:max-w-[21rem]' : 'relative w-full'}
    >
      <form onSubmit={onSubmit} role="search" className="relative">
        <label htmlFor={inputId} className="sr-only">
          Caută în magazin
        </label>
        <IconSearch
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => {
            if (trimmed.length >= MIN_QUERY_LENGTH && results.length > 0) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null
            if (!next || !containerRef.current?.contains(next)) setOpen(false)
          }}
          placeholder="Caută un titlu, un autor sau un produs…"
          className="w-full border border-ink/15 bg-transparent py-2 pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted focus:border-brass focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:none"
          role="combobox"
          aria-expanded={panelOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            panelOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
        />
        {loading && (
          <span
            className="absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border border-brass border-t-transparent"
            aria-hidden="true"
          />
        )}
        {term && !loading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Șterge căutarea"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-ink-muted transition-colors hover:text-ink"
          >
            <IconClose className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {panelOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label="Rezultate căutare"
          className={
            variant === 'header'
              ? 'animate-pop-in absolute right-0 top-[calc(100%+0.6rem)] z-[60] w-[27rem] max-w-[calc(100vw-2rem)] overflow-hidden border border-ink/10 bg-paper-50 shadow-2xl'
              : 'mt-3 overflow-hidden border border-ink/10 bg-paper-50 shadow-soft'
          }
        >
          <div className="h-1 w-full bg-gradient-to-r from-oxblood via-brass to-oxblood" />

          {loading ? (
            <div className="space-y-3 px-4 py-4" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <span className="h-14 w-10 animate-pulse bg-paper-200" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-3/4 animate-pulse bg-paper-200" />
                    <span className="block h-2.5 w-1/2 animate-pulse bg-paper-200" />
                  </span>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <IconSearch className="mx-auto h-6 w-6 text-brass" aria-hidden="true" />
              <p className="mt-3 font-serif text-lg text-ink">
                Niciun rezultat pentru „{trimmed}”
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Încearcă un titlu, un autor sau un cuvânt din descriere.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  {results.length} {results.length === 1 ? 'rezultat' : 'rezultate'}
                </p>
                <p className="hidden text-[11px] text-ink-muted sm:block">
                  ↑↓ navighează · Enter deschide
                </p>
              </div>

              <ul
                className={`scrollbar-none overflow-y-auto py-1 ${
                  variant === 'drawer' ? 'max-h-64' : 'max-h-[22rem]'
                }`}
              >
                {visible.map((book, index) => (
                  <li key={book.id} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openBook(book)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        activeIndex === index ? 'bg-paper-200/80' : 'hover:bg-paper-200/50'
                      }`}
                    >
                      <ResultThumb book={book} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[15px] leading-snug text-ink">
                          <Highlight text={book.title} query={trimmed} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">
                          <Highlight text={book.author} query={trimmed} />
                        </span>
                        {book.category && (
                          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-brass-dark">
                            {book.category}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-ink">
                        {formatPrice(book.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={goToAllResults}
                className="flex w-full items-center justify-between gap-3 border-t border-ink/10 bg-paper-100/60 px-4 py-3 text-left text-xs uppercase tracking-wider text-oxblood transition-colors hover:bg-paper-200/60"
              >
                <span>Vezi toate rezultatele pentru „{trimmed}”</span>
                <IconArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </>

          )}
        </div>
      )}
    </div>
  )
}

/** Wrap the matched part of a string in a brass <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const match = findSearchMatch(text, query)
  if (!match) return <>{text}</>
  const end = match.start + match.length
  return (
    <>
      {text.slice(0, match.start)}
      <mark className="bg-brass/30 text-inherit">{text.slice(match.start, end)}</mark>
      {text.slice(end)}
    </>
  )
}

/** Tiny cover (or an editorial initial when the product has no photo). */
function ResultThumb({ book }: { book: Book }) {
  if (book.cover.src) {
    return (
      <img
        src={book.cover.src}
        alt=""
        loading="lazy"
        className="h-14 w-10 shrink-0 border border-ink/10 object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-14 w-10 shrink-0 items-center justify-center border border-ink/10 bg-ink font-serif text-[11px] uppercase tracking-wider text-paper-200"
    >
      {book.title.slice(0, 2)}
    </span>
  )
}
