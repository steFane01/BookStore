import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscape, useLockBody } from '../hooks/useEscape'
import { IconClose } from './icons'

interface ModalProps {
  open: boolean
  title: string
  eyebrow?: string
  children?: ReactNode
  footer?: ReactNode
  onClose: () => void
  /** Tailwind max-width class for the panel. */
  maxWidth?: string
  /** Clicking the dark overlay closes the dialog (default true). */
  closeOnBackdrop?: boolean
}

/**
 * Shared, brand-styled modal dialog.
 *
 * Rendered through a portal on `document.body` so it always covers the whole
 * viewport, even when the trigger lives inside a section with a CSS transform
 * (the scroll-reveal animations create such containing blocks and would
 * otherwise clip a `position: fixed` overlay).
 */
export function Modal({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  maxWidth = 'max-w-lg',
  closeOnBackdrop = true,
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEscape(onClose, open)
  useLockBody(open)

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-ink/60 px-4 py-6 sm:items-center"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`animate-slide-up my-auto max-h-[calc(100vh-3rem)] w-full ${maxWidth} overflow-y-auto border border-ink/10 bg-paper-50 shadow-2xl outline-none`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-paper-50 px-6 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId} className="mt-1 font-serif text-2xl leading-tight text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="-mr-1 shrink-0 rounded-sm p-1 text-ink-muted transition-colors hover:text-ink"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {children && <div className="px-6 py-5 text-sm leading-relaxed text-ink-light">{children}</div>}

        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-ink/10 bg-paper-100/50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
