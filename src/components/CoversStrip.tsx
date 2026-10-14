import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { IconArrowLeft, IconArrowRight } from './icons'

interface CoversStripProps {
  books: Book[]
  title?: string
  eyebrow?: string
}

/**
 * A lateral (horizontal) scroll strip of book covers only — no titles, authors
 * or prices. Each cover links to its detail page. Swipe, drag or use the arrow
 * buttons to browse from left to right.
 */
export function CoversStrip({ books, title = 'Catalog', eyebrow = 'Cărți' }: CoversStripProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  if (books.length === 0) return null

  return (
    <section className="container-page py-16 md:py-20">
      <div className="flex items-end justify-between gap-6">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="serif-display mt-2 text-4xl text-ink sm:text-5xl">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Derulează coperțile la stânga"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-oxblood hover:text-oxblood"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Derulează coperțile la dreapta"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-oxblood hover:text-oxblood"
          >
            <IconArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable cover track */}
      <div
        ref={trackRef}
        className="scrollbar-none mt-10 flex snap-x gap-5 overflow-x-auto pb-4 md:gap-7"
        role="region"
        aria-label="Coperțile cărților"
      >
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/carte/${book.id}`}
            aria-label={`Vezi detalii: ${book.title}`}
            className="group snap-start shrink-0"
          >
            <BookCover
              book={book}
              size="lg"
              className="aspect-[2/3] w-36 rounded-[3px] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 sm:w-44 md:w-52"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
