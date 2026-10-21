import { siteConfig } from '../config/site'

interface BrandLogoProps {
  /** Light variant (text on dark background) for dark hero surfaces. */
  light?: boolean
  className?: string
}

/**
 * Brand mark.
 *
 * Renders the RV STUDIO logo asset served from `public/`. Falls back to the
 * ornamental monogram should the image ever fail to load.
 */
export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      role="img"
      aria-label={`Logo ${siteConfig.brandName}`}
    >
      <img
        src="/logo_books.jpeg"
        alt={`Logo ${siteConfig.brandName}`}
        className="h-full w-full object-contain"
        loading="eager"
        onError={(e) => {
          // Hide the broken image and fall back to the CSS monogram below.
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
      {/* Fallback monogram — only visible if the logo image fails to load. */}
      <span
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="sr-only">{siteConfig.brandName}</span>
      </span>
    </div>
  )
}

