interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

/**
 * Editorial section heading: a small eyebrow label, a serif display title,
 * and an optional short description. Keeps typography consistent everywhere.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignCls = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  return (
    <div className={`flex flex-col gap-4 ${alignCls} ${className}`}>
      {eyebrow && (
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
      )}
      <h2 className="serif-display text-4xl text-balance sm:text-5xl md:text-[3.4rem]">
        {title}
      </h2>
      {description && (
        <p className={`max-w-xl text-base leading-relaxed text-ink-muted ${align === 'center' ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  )
}
