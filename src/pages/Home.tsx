import { useEffect, useState } from 'react'
import type { Book } from '../types'
import { bookService } from '../services/bookService'
import { BookIntro } from '../components/BookIntro'
import { BookHero } from '../components/BookHero'
import { SectionHeading } from '../components/SectionHeading'
import { AnimatedSection } from '../components/AnimatedSection'
import { BookGrid } from '../components/BookGrid'
import { NewsletterCta } from '../components/NewsletterCta'
import { IconFeather } from '../components/icons'

const INTRO_SESSION_KEY = 'libraria.intro-seen'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [featured, setFeatured] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await bookService.getBooks()
        if (!active) return
        setBooks(data)
        setFeatured(data.find((b) => b.featured) ?? data[0] ?? null)
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
      {showIntro && featured && (
        <BookIntro book={featured} onEnter={handleEnter} />
      )}

      {featured ? (
        <BookHero book={featured} />
      ) : (
        <p className="container-page py-32 text-center text-ink-muted">
          Momentan nu există cărți publicate.
        </p>
      )}

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

      {/* Featured book composition */}
      {featured && (
        <AnimatedSection className="border-y border-ink/10 bg-paper-200/50 py-20 md:py-28">
          <div className="container-page">
            <SectionHeading
              eyebrow="Ediția care ne definește"
              title={featured.title}
              description={featured.shortDescription}
            />
            <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-center">
              <blockquote className="font-serif text-2xl italic leading-relaxed text-ink sm:text-3xl">
                „Unele cărți cer o anumită tăcere înainte de a-ți îngădui primul
                cuvânt.“
              </blockquote>
              <div className="flex flex-col gap-4 text-ink-light">
                <p className="leading-relaxed">
                  Am tipărit această ediție pe hârtie fină, cu copertă dură și un
                  format gândit să stea bine în mână. Fiecare detaliu — de la
                  tipar la culoarea copertei — a fost ales cu răbdare.
                </p>
                <p className="leading-relaxed">
                  E romanul cu care ne place să ne prezentăm. Pentru că o librărie
                  bună se cunoaște după cărțile pe care are curajul să le pună în
                  față.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* More titles grid */}
      <AnimatedSection className="container-page py-20 md:py-28">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Catalog"
            title="Titluri din librărie"
            description="Lucrăm la noi apariții. Până atunci, acestea sunt cărțile pe care le poți avea acasă."
          />
          <IconFeather className="hidden h-10 w-10 text-brass/40 md:block" aria-hidden="true" />
        </div>
        <div className="mt-12">
          <BookGrid books={books} />
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
