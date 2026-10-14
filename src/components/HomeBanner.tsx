import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { IconArrowLeft, IconArrowRight } from './icons'

interface BannerSlide {
  eyebrow: string
  title: string
  description: string
  cta?: { label: string; to: string }
}

const slides: BannerSlide[] = [
  {
    eyebrow: 'Bine ați venit',
    title: 'O librărie pentru cei care citesc încet',
    description:
      'Cărți atent alese, tipografie frumoasă și gustul lucrurilor făcute cu răbdare — cu creionul în mână.',
    cta: { label: 'Explorează catalogul', to: '/' },
  },
  {
    eyebrow: 'Livrare rapidă',
    title: 'Acasă sau în EasyBox SameDay',
    description:
      'Alege curierul la ușă sau un punct de ridicare EasyBox din orașul tău — direct în coșul de cumpărături.',
    cta: { label: 'Cum comand', to: '/' },
  },
  {
    eyebrow: 'Editura noastră',
    title: 'Cărți tipărite cu răbdare',
    description:
      'Hârtie fină, copertă dură și un format gândit să stea bine în mână. Fiecare detaliu contează.',
    cta: { label: 'Despre noi', to: '/despre' },
  },
]

/**
 * Home banner — a horizontally scrollable editorial strip.
 *
 * Slides sit on a flex row inside an overflow container, so the user can swipe
 * (touch), drag, or use the arrow buttons to browse from left to right. No
 * auto-rotation: the scroll is always controlled by the visitor.
 */
export function HomeBanner() {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-[#241f19] text-paper-100">
      <div className="container-page pt-28 pb-10 md:pt-36">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.7rem] uppercase tracking-[0.4em] text-brass-light/90">
            {siteConfig.brandName} — Cărți & Tipar
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Derulează bannerul la stânga"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper-100/30 text-paper-100 transition-colors hover:border-brass hover:text-brass-light"
            >
              <IconArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Derulează bannerul la dreapta"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper-100/30 text-paper-100 transition-colors hover:border-brass hover:text-brass-light"
            >
              <IconArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable slide track */}
      <div
        ref={trackRef}
        className="scroll-smooth snap-x snap-mandatory overflow-x-auto scrollbar-none"
        role="region"
        aria-label="Banner promoțional"
      >
        <div className="container-page flex gap-6 pb-14 md:gap-10">
          {slides.map((slide) => (
            <article
              key={slide.eyebrow}
              className="snap-start rounded-sm border border-paper-100/15 bg-paper-100/5 p-8 backdrop-blur-sm md:w-[68%] md:shrink-0 lg:w-[56%] lg:p-10"
            >
              <span className="eyebrow flex items-center gap-3 text-brass-light">
                <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
                {slide.eyebrow}
              </span>
              <h2 className="serif-display mt-5 max-w-2xl text-balance text-3xl text-paper-100 sm:text-4xl md:text-5xl">
                {slide.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-paper-200/85">
                {slide.description}
              </p>
              {slide.cta && (
                <Link
                  to={slide.cta.to}
                  className="btn mt-7 inline-flex items-center gap-2 rounded-sm border border-brass/60 px-6 py-3 text-sm uppercase tracking-[0.18em] text-brass-light transition-colors hover:bg-brass/10"
                >
                  {slide.cta.label}
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
