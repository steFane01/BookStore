import { useCallback, useEffect, useRef, useState } from 'react'
import { siteConfig } from '../config/site'
import { BookCover } from './BookCover'
import type { Book } from '../types'

interface BookIntroProps {
  book: Book
  onEnter: () => void
}

const SESSION_KEY = 'libraria.intro-seen'

/**
 * Full-screen cinematic introduction.
 *
 * The viewport behaves like the cover of an elegant physical book. Clicking
 * the CTA triggers a brief "opening a book" transition, then the store appears.
 * The intro only plays once per session (sessionStorage).
 */
export function BookIntro({ book, onEnter }: BookIntroProps) {
  const [phase, setPhase] = useState<'cover' | 'opening' | 'hidden'>('cover')
  const [textPhase, setTextPhase] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setTextPhase(true), 350)
    timerRef.current = t
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const enter = useCallback(() => {
    if (phase !== 'cover') return
    setPhase('opening')
    try {
      window.sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // ignore
    }
    const duration = reducedMotion ? 50 : 1100
    timerRef.current = window.setTimeout(() => {
      setPhase('hidden')
      onEnter()
    }, duration)
  }, [phase, onEnter, reducedMotion])

  if (phase === 'hidden') return null

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${
        phase === 'opening' ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={{
        transform: phase === 'opening' ? 'scale(1.15)' : 'scale(1)',
        opacity: phase === 'opening' ? 0 : 1,
      }}
    >
      {/* Background wash — darkened paper */}
      <div className="absolute inset-0 bg-[#241f19]" />

      {/* Book cover surface */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        style={{
          transform: phase === 'opening' ? 'perspective(1200px) rotateY(-65deg)' : 'perspective(1200px) rotateY(0deg)',
          transformOrigin: 'left center',
          opacity: phase === 'opening' ? 0 : 1,
          transition: reducedMotion ? 'none' : 'transform 1.1s cubic-bezier(0.77,0,0.18,1), opacity 0.9s ease',
        }}
      >
        {/* Ornamental lines */}
        <div className="mb-6 h-px w-40 bg-brass/40" aria-hidden="true" />
        <span className="text-[0.7rem] uppercase tracking-[0.5em] text-brass-light/80">
          {siteConfig.brandName}
        </span>

        {/* Book cover-ish block */}
        <div
          className={`mt-8 transition-all duration-1000 ease-out ${textPhase ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          <BookCover
            book={book}
            dimensional
            size="lg"
            className="aspect-[2/3] w-48 sm:w-56 md:w-64"
          />
        </div>

        {/* Tagline */}
        <p
          className={`mt-10 max-w-sm text-center font-serif text-lg italic leading-relaxed text-paper-200/90 transition-all duration-1000 ${textPhase ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '550ms' }}
        >
          {siteConfig.tagline}
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={enter}
          className={`mt-10 rounded-sm border border-paper-100/50 px-8 py-3 text-sm uppercase tracking-[0.2em] text-paper-100 transition-all duration-500 hover:border-brass hover:bg-paper-100/5 hover:text-brass-light focus-visible:outline-brass ${textPhase ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '800ms' }}
        >
          Intră în librărie
        </button>

        {/* Opening page-lines decoration */}
        <div className="mt-12 flex gap-6 text-brass/30" aria-hidden="true">
          <span className="h-px w-10 bg-current" />
          <span className="h-px w-10 bg-current" />
          <span className="h-px w-10 bg-current" />
        </div>
      </div>
    </div>
  )
}
