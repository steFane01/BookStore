import { useEffect, useRef, type RefObject } from 'react'

/**
 * Adds `.is-visible` to a `[data-reveal]` element when it enters the viewport,
 * triggering the scroll-reveal transitions defined in index.css.
 *
 * Respects `prefers-reduced-motion`: the element is revealed immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
