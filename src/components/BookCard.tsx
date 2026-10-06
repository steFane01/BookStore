import { Link } from 'react-router-dom'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { formatPrice } from '../utils/format'
import { IconArrowRight } from './icons'

interface BookCardProps {
  book: Book
  /** Optional handler — when present the card adds to cart instead of linking. */
  onAddToCart?: (book: Book) => void
}

/**
 * Reusable book card used across grids.
 * The cover is the visual focus; hover reveals a refined "Adaugă în coș" action.
 */
export function BookCard({ book, onAddToCart }: BookCardProps) {
  return (
    <article className="group relative flex flex-col">
      {/* Cover */}
      <Link
        to={`/carte/${book.id}`}
        aria-label={`Vezi detalii: ${book.title}`}
        className="relative block transition-transform duration-500 ease-out group-hover:-translate-y-1.5"
      >
        <BookCover
          book={book}
          size="lg"
          className="aspect-[2/3] w-full rounded-[3px]"
        />
        {/* soft hover depth */}
        <div className="pointer-events-none absolute inset-0 rounded-[3px] opacity-0 shadow-lift transition-opacity duration-500 group-hover:opacity-100" />
      </Link>

      {/* Text */}
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="font-serif text-lg leading-tight">
          <Link
            to={`/carte/${book.id}`}
            className="link-underline text-ink transition-colors hover:text-oxblood"
          >
            {book.title}
          </Link>
        </h3>
        <p className="text-sm text-ink-muted">{book.author}</p>
        <div className="mt-2 flex items-end justify-between">
          <span className="font-medium tabular-nums text-ink">
            {formatPrice(book.price)}
          </span>
          <button
            type="button"
            onClick={() => onAddToCart?.(book)}
            className="flex items-center gap-1 text-sm text-oxblood opacity-0 transition-all duration-300 group-hover:opacity-100 hover:text-oxblood-dark focus-visible:opacity-100"
            aria-label={`Adaugă „${book.title}” în coș`}
          >
            Adaugă
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
