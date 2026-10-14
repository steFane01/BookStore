import { useEffect, useState } from 'react'
import type { Book } from '../types'
import { bookService } from '../services/bookService'
import { BookIntro } from '../components/BookIntro'
import { HomeBanner } from '../components/HomeBanner'
import { CoversStrip } from '../components/CoversStrip'
import { SectionHeading } from '../components/SectionHeading'
import { AnimatedSection } from '../components/AnimatedSection'
import { BookGrid } from '../components/BookGrid'
import { NewsletterCta } from '../components/NewsletterCta'
import { IconFeather } from '../components/icons'

const INTRO_SESSION_KEY = 'libraria.intro-seen'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await bookService.getBooks()
        if (!active) return
        setBooks(data)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let seen = false
    try {
      seen = !!window.sessionStorage.getItem(INTRO_SESSION_KEY)
    } catch {
      // ignore
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Respect reduced motion: skip the cinematic intro entirely.
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

  if (loading) return <Loader />

  return (
    <>
      {showIntro && <BookIntro onEnter={handleEnter} />}

      {/* Brand banner — horizontally scrollable */}
      <HomeBanner />

      {/* Lateral cover strip — only covers, no details */}
      <CoversStrip books={books} />

      {/* Philosophy statement */}
      <AnimatedSection className="container-page py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Despre noi"
            title="O librărie pentru cei care citesc încet"
            align="center"
          />
          <p className="mt-8 font-serif text-xl leading-relaxed text-ink-light">
            Ale noastre sunt cărțile care cer timp, care lasă loc de sublinieri și
            pagini îndoite. Credem că o carte bună e un obiect de artă: pe
            dinăuntru, cât și pe din afară.
          </p>
        </div>
      </AnimatedSection>

      {/* Catalog grid */}
      <AnimatedSection className="container-page pb-20 md:pb-28">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Catalog"
            title="Titluri din librărie"
            description="Lucrăm la noi apariții. Până atunci, acestea sunt cărțile pe care le poți avea acasă."
          />
          <IconFeather className="hidden h-10 w-10 text-brass/40 md:block" aria-hidden="true" />
        </div>
        <div className="mt-12">
          {books.length > 0 ? (
            <BookGrid books={books} />
          ) : (
            <p className="text-center text-ink-muted">Momentan nu există cărți publicate.</p>
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

