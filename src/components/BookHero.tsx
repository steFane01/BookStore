import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'
import { IconArrowRight } from './icons'

interface BookHeroProps {
  book: Book
}

/**
 * Editorial hero for the featured release.
 * Includes a physical, gently tilt-responsive book cover on desktop.
 */
export function BookHero({ book }: BookHeroProps) {
  const { addItem } = useCart()
  const tiltRef = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent) => {
    const el = tiltRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`
  }

  const resetTilt = () => {
    const el = tiltRef.current
    if (el) el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)'
  }

  return (
    <section className="texture-paper border-b border-ink/10 bg-paper-100">
      <div className="container-page grid items-center gap-10 pt-28 pb-16 md:pt-36 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
        {/* Copy */}
        <div className="order-2 flex flex-col items-start lg:order-1">
          <span className="eyebrow mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
            Lansare editorială
          </span>

          <h1 className="serif-display text-5xl text-balance text-ink sm:text-6xl md:text-7xl">
            {book.title}
          </h1>
          <p className="mt-3 font-serif text-2xl italic text-brass-dark">{book.author}</p>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-light sm:text-lg">
            {book.shortDescription}
          </p>

          <div className="mt-8 flex items-center gap-6">
            <span className="font-serif text-4xl text-ink">
              {formatPrice(book.price)}
            </span>
            <span className="rounded-full border border-brass/40 px-3 py-1 text-xs uppercase tracking-widest text-brass-dark">
              Disponibilă
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => addItem(book)}
              className="btn btn-primary px-7 py-3.5"
            >
              Cumpără acum
            </button>
            <Link
              to={`/carte/${book.id}`}
              className="btn btn-outline px-7 py-3.5"
            >
              Descoperă cartea
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-ink-muted">
            {book.pages} pagini · {book.format}
          </p>
        </div>

        {/* Cover object */}
        <div className="order-1 flex justify-center lg:order-2">
          <div
            ref={tiltRef}
            onMouseMove={handleMove}
            onMouseLeave={resetTilt}
            style={{ transform: 'perspective(900px) rotateY(0deg) rotateX(0deg)' }}
            className="transition-transform duration-300 ease-out will-change-transform"
          >
            <BookCover
              book={book}
              dimensional
              size="lg"
              className="aspect-[2/3] w-56 sm:w-64 md:w-72 lg:w-80"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
