import { siteConfig } from '../config/site'

interface BrandLogoProps {
  /** Light variant (text on dark background) for dark hero surfaces. */
  light?: boolean
  className?: string
}

/**
 * Brand mark — a refined, ornamental monogram for the store.
 *
 * There is no raster logo asset yet, so the "logo" is drawn in pure CSS/SVG
 * from the brand name: a serif initial inside a double frame, mirroring the
 * book-cover placeholder language used across the shop. Swap this component's
 * markup for a real `<img>` once a proper logo file is added.
 */
export function BrandLogo({ light = false, className = '' }: BrandLogoProps) {
  const accent = light ? '#C4A876' : '#642A2E'
  const base = light ? '#F5F0E6' : '#1C1A17'
  const frame = light ? 'rgba(245,240,230,0.35)' : 'rgba(28,26,23,0.28)'

  // First letters of the brand words (e.g. "Librăria — Cărți & Tipar" → "LC").
  const initials = siteConfig.brandNameLong
    .split(/[^A-Za-zÀ-ž0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      role="img"
      aria-label={`Logo ${siteConfig.brandName}`}
    >
      {/* Double ornamental frame */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: frame }}
      />
      <div
        className="absolute inset-[10%] rounded-full border"
        style={{ borderColor: frame }}
      />
      {/* Monogram */}
      <span
        className="relative font-serif font-semibold tracking-tight"
        style={{ color: base, fontSize: '1.1em' }}
      >
        {initials}
        <span
          className="absolute -right-[0.22em] -top-[0.05em] text-[0.42em]"
          style={{ color: accent }}
        >
          ·
        </span>
      </span>
    </div>
  )
}
