import { Link } from 'react-router-dom'
import type { ProductCategory } from '../types'
import { IconArrowRight } from './icons'

interface CategoryShowcaseProps {
  categories: ProductCategory[]
}

/**
 * Home category showcase — replaces the old dark-brown lateral scroll banner.
 *
 * Renders the three canonical RV STUDIO storefront categories (Cărți, Produse
 * Digitale, Diverse & Accesorii) as a light, editorial grid on top of the
 * shared category artwork. Each card links to the catalog filtered by that
 * category (`/?categorie=<id>`).
 */
export function HomeBanner({ categories }: CategoryShowcaseProps) {
  return (
    <section className="border-b border-ink/10 bg-paper-100 pb-14 pt-24 md:pb-20 md:pt-32">
      <div className="container-page">
        {/* Shared category artwork */}
        <img
          src="/welcomepage.jpeg"
          alt="Colecțiile RV STUDIO — cărți, produse digitale și accesorii"
          className="mb-12 h-56 w-full rounded-sm object-cover md:h-72"
        />

        <div className="grid gap-5 sm:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/?categorie=${encodeURIComponent(cat.slug ?? cat.id)}`}
              className="group flex flex-col justify-between rounded-sm border border-ink/10 bg-paper-50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-oxblood/40 hover:shadow-lift"
            >
              <div>
                <p className="eyebrow">Colecția</p>
                <h2 className="serif-display mt-2 text-3xl text-ink">{cat.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {cat.blurb}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-oxblood transition-colors group-hover:text-oxblood-dark">
                Explorează
                <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

