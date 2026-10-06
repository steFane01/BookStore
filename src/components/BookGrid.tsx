import type { Book } from '../types'
import { BookCard } from './BookCard'

interface BookGridProps {
  books: Book[]
  onAddToCart?: (book: Book) => void
  columns?: 2 | 3 | 4
}

/**
 * Responsive book grid. Adjusts columns per breakpoint automatically.
 */
export function BookGrid({ books, onAddToCart, columns = 4 }: BookGridProps) {
  const cols =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <div className={`grid gap-x-6 gap-y-12 ${cols}`}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
      ))}
    </div>
  )
}
