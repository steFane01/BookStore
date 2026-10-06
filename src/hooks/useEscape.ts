import { useEffect } from 'react'

/**
 * Invokes `callback` when the Escape key is pressed.
 * Used by drawers, dialogs and modals for accessible dismissal.
 */
export function useEscape(callback: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') callback()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [callback, active])
}

/**
 * Locks body scroll while `locked` is true (used for drawers/modals).
 */
export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}
