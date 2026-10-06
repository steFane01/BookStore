import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { IconFeather, IconMail, IconMapPin, IconPhone } from './icons'

const exploreLinks = [
  { to: '/', label: 'Magazin' },
  { to: '/despre', label: 'Despre' },
  { to: '/contact', label: 'Contact' },
  { to: '/autentificare', label: 'Cont' },
]

const legalLinks = [
  { label: 'Termeni și condiții', href: '/termeni' },
  { label: 'Politica de confidențialitate', href: '/confidentialitate' },
  { label: 'Politica de cookies', href: '/cookies' },
]

/**
 * Refined literary footer: brand statement, a few links and contact details.
 * Deliberately compact and unhurried.
 */
export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper-200/40">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <IconFeather className="h-6 w-6 text-brass-dark" />
            <span className="font-serif text-2xl text-ink">{siteConfig.brandName}</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
            {siteConfig.tagline} Cărți atent alese, tipografie frumoasă și ritmul
            lent al lucrurilor făcute cu răbdare.
          </p>
        </div>

        {/* Explore */}
        <nav aria-label="Navigare subsol">
          <h3 className="eyebrow mb-4">Explorează</h3>
          <ul className="flex flex-col gap-2.5">
            {exploreLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link-underline text-sm text-ink hover:text-oxblood">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal */}
        <nav aria-label="Informații legale">
          <h3 className="eyebrow mb-4">Informații</h3>
          <ul className="flex flex-col gap-2.5">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.href} className="link-underline text-sm text-ink hover:text-oxblood">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="eyebrow mb-4">Contact</h3>
          <ul className="flex flex-col gap-3 text-sm text-ink-muted">
            <li className="flex items-center gap-2.5">
              <IconMail className="h-4 w-4 text-brass-dark" />
              <a href={`mailto:${siteConfig.contact.email}`} className="link-underline text-ink hover:text-oxblood">
                {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <IconPhone className="h-4 w-4 text-brass-dark" />
              <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="link-underline text-ink hover:text-oxblood">
                {siteConfig.contact.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-dark" />
              <span>{siteConfig.contact.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-muted sm:flex-row">
          <p>
            © {siteConfig.currentYear} {siteConfig.brandName}. Toate drepturile rezervate.
          </p>
          <p className="flex items-center gap-1.5">
            Realizat cu răbdare, ca o carte bună.
            <IconFeather className="h-3.5 w-3.5 text-brass-dark" />
          </p>
        </div>
      </div>
    </footer>
  )
}
