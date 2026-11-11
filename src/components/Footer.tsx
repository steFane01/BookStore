import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { IconFeather, IconMail, IconPhone } from './icons'

const exploreLinks = [
  { to: '/', label: 'Magazin' },
  { to: '/despre', label: 'Despre' },
  { to: '/contact', label: 'Contact' },
  { to: '/urmarire-comanda', label: 'Urmărește comanda' },
  { to: '/autentificare', label: 'Cont' },
]

const legalLinks = [
  { label: 'Termeni și condiții', href: '/termeni' },
  { label: 'Politica de confidențialitate', href: '/confidentialitate' },
  { label: 'Politica de cookies', href: '/cookies' },
]

/**
 * Refined literary footer: brand statement, navigation, contact and legal links.
 * Everything is driven by the owner-editable settings.
 */
export function Footer() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()
  const socials = [
    { label: 'Instagram', href: settings.instagram },
    { label: 'Facebook', href: settings.facebook },
  ].filter((social) => social.href)

  return (
    <footer className="border-t border-ink/10 bg-paper-200/40">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <IconFeather className="h-6 w-6 text-brass-dark" />
            <span className="font-serif text-2xl text-ink">{settings.brandName}</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-muted">{settings.description}</p>
          {settings.legalCompany && (
            <p className="text-xs leading-relaxed text-ink-muted">
              {settings.legalCompany}
              {settings.legalCui ? ` · CUI ${settings.legalCui}` : ''}
              {settings.legalRegCom ? ` · ${settings.legalRegCom}` : ''}
              {settings.legalAddress ? ` · ${settings.legalAddress}` : ''}
            </p>
          )}
        </div>

        {/* Explore */}
        <nav aria-label="Navigare subsol">
          <h3 className="eyebrow mb-4">Explorează</h3>
          <ul className="flex flex-col gap-2.5">
            {exploreLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="link-underline text-sm text-ink hover:text-oxblood">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal */}
        <nav aria-label="Informații legale">
          <h3 className="eyebrow mb-4">Informații</h3>
          <ul className="flex flex-col gap-2.5">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href} className="link-underline text-sm text-ink hover:text-oxblood">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="eyebrow mb-4">Contact</h3>
          <ul className="flex flex-col gap-3 text-sm text-ink-muted">
            {settings.contactEmail && (
              <li className="flex items-center gap-2.5">
                <IconMail className="h-4 w-4 text-brass-dark" />
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="link-underline text-ink hover:text-oxblood"
                >
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li className="flex items-center gap-2.5">
                <IconPhone className="h-4 w-4 text-brass-dark" />
                <a
                  href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}
                  className="link-underline text-ink hover:text-oxblood"
                >
                  {settings.contactPhone}
                </a>
              </li>
            )}
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline text-ink hover:text-oxblood"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-muted sm:flex-row">
          <p>
            © {year} {settings.brandName}. Toate drepturile rezervate.
          </p>
          <p className="flex items-center gap-1.5">
            {settings.footerNote}
            <IconFeather className="h-3.5 w-3.5 text-brass-dark" />
          </p>
        </div>
      </div>
    </footer>
  )
}
