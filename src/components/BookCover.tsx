import type { Book } from '../types'

interface BookCoverProps {
  book: Pick<Book, 'title' | 'author' | 'cover'>
  className?: string
  /** Renders the cover as a subtle 3D object with a spine (used on detail/hero). */
  dimensional?: boolean
  /** Renders at a reduced size suitable for cards/thumbnails. */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-[64px] h-[96px] text-[9px]',
  md: 'w-[120px] h-[180px] text-[12px]',
  lg: 'w-auto h-auto',
}

/**
 * Book cover renderer.
 *
 * If a real cover image exists it is used; otherwise an intentional editorial
 * placeholder is drawn from the book's own title/author and a chosen theme,
 * so the store never shows ugly grey boxes.
 */
export function BookCover({ book, className = '', dimensional = false, size = 'md' }: BookCoverProps) {
  const { cover } = book

  if (cover.src) {
    return (
      <div
        className={`relative overflow-hidden ${sizeClasses[size]} ${className} ${
          dimensional ? 'shadow-cover' : 'shadow-soft'
        }`}
      >
        <img
          src={cover.src}
          alt={cover.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {dimensional && <SpineOverlay />}
      </div>
    )
  }

  return (
    <BookCoverPlaceholder
      book={book}
      className={className}
      dimensional={dimensional}
      size={size}
    />
  )
}

function BookCoverPlaceholder({
  book,
  className = '',
  dimensional = false,
  size = 'md',
}: BookCoverProps) {
  const theme = book.cover.placeholder?.theme ?? 'ink'
  const palette: Record<string, { bg: string; text: string; rule: string; acct: string }> = {
    oxblood: {
      bg: 'linear-gradient(150deg, #7C3A3F 0%, #642A2E 55%, #4E2023 100%)',
      text: '#F5F0E6',
      rule: 'rgba(245,240,230,0.35)',
      acct: '#C4A876',
    },
    brass: {
      bg: 'linear-gradient(150deg, #D4C4A8 0%, #A88755 100%)',
      text: '#1C1A17',
      rule: 'rgba(28,26,23,0.35)',
      acct: '#4E2023',
    },
    ink: {
      bg: 'linear-gradient(150deg, #3A362F 0%, #1C1A17 100%)',
      text: '#EDE4D5',
      rule: 'rgba(237,228,213,0.35)',
      acct: '#A88755',
    },
    paper: {
      bg: 'linear-gradient(150deg, #FBF8F2 0%, #E2D6C1 100%)',
      text: '#1C1A17',
      rule: 'rgba(28,26,23,0.3)',
      acct: '#642A2E',
    },
  }
  const p = palette[theme] ?? palette.ink

  return (
    <div
      className={`relative overflow-hidden ${sizeClasses[size]} ${className} ${
        dimensional ? 'shadow-cover' : 'shadow-soft'
      }`}
      style={{ background: p.bg, color: p.text }}
      role="img"
      aria-label={book.cover.alt}
    >
      {/* Decorative frame */}
      <div
        className="pointer-events-none absolute inset-[6%] border"
        style={{ borderColor: p.rule }}
      />
      {/* Vertical rule running down the left spine area */}
      <div
        className="pointer-events-none absolute left-[14%] top-0 h-full w-px"
        style={{ backgroundColor: p.rule }}
      />
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[16%] text-center">
        <span
          className="mb-[10%] block h-px w-[40%]"
          style={{
            background: `linear-gradient(to right, transparent, ${p.rule}, transparent)`,
          }}
        />
        <span
          className="block leading-snug font-serif font-semibold tracking-wide"
          style={{ color: p.text }}
        >
          {book.title}
        </span>
        <span
          className="mt-[10%] block text-[0.7em] uppercase tracking-[0.18em]"
          style={{ color: p.acct }}
        >
          {book.author}
        </span>
        <span
          className="mt-[12%] block h-px w-[40%]"
          style={{
            background: `linear-gradient(to right, transparent, ${p.rule}, transparent)`,
          }}
        />
      </div>

      {dimensional && (
        <>
          {/* Spine gradient */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[10%] bg-black/25" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[8%] bg-black/20" />
          <SpineOverlay />
        </>
      )}
    </div>
  )
}

/** Thin highlight along the fold between cover and spine for the 3D look. */
function SpineOverlay() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-[8%] w-px bg-white/20" />
  )
}
