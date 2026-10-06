import { useReveal } from '../hooks/useReveal'
import type { ReactNode } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
  /** Apply a soft reveal (translate only) instead of the default stronger one. */
  variant?: 'default' | 'soft'
  /** Delay in ms before the reveal transition begins (for stagger). */
  delay?: number
}

/**
 * Wraps content and reveals it (transform + opacity) when scrolled into view.
 * Respects reduced motion via `useReveal`.
 */
export function AnimatedSection({
  children,
  className = '',
  as = 'div',
  variant = 'default',
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useReveal<HTMLDivElement>()
  const Tag = as as 'div'
  return (
    <Tag
      ref={ref}
      className={`${variant === 'soft' ? 'reveal-soft' : 'reveal'} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
