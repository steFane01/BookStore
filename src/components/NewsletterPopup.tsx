import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useEscape, useLockBody } from '../hooks/useEscape'
import { subscribeNewsletter } from '../services/formsService'
import { IconCheck, IconClose, IconMail } from './icons'
import {
  NEWSLETTER_PROMPT_EVENT,
  dismissNewsletterPrompt,
  isNewsletterSubscribed,
  markNewsletterSubscribed,
  shouldShowNewsletterPrompt,
} from '../utils/newsletterPrompt'

const FIRST_VISIT_DELAY_MS = 4500
const OPEN_AFTER_REGISTER_MS = 500
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HIDDEN_PREFIXES = ['/admin', '/autentificare', '/resetare-parola', '/comanda']

const BENEFITS = [
  'Titluri noi și oferte înainte să apară în librărie',
  'O scrisoare scurtă, din când în când',
  'Fără spam; te poți dezabona oricând',
]

/**
 * Brand-styled newsletter invitation.
 *
 * Appears once for a new visitor (after a short delay) and immediately after a
 * new account is created; never over the admin/auth screens, never for admins
 * and never again once the visitor subscribed on this device.
 */
export function NewsletterPopup() {
  const { user, isAdmin } = useAuth()
  const { settings } = useSettings()
  const { pathname } = useLocation()

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const routeHidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const routeHiddenRef = useRef(routeHidden)
  const isAdminRef = useRef(isAdmin)

  useEffect(() => {
    routeHiddenRef.current = routeHidden
  }, [routeHidden])

  useEffect(() => {
    isAdminRef.current = isAdmin
  }, [isAdmin])

  const close = useCallback(() => {
    setOpen(false)
    setDone(false)
    setError(null)
    setBusy(false)
    if (!isNewsletterSubscribed()) dismissNewsletterPrompt()
  }, [])

  // First-time visitors: open once, after a short delay, on public pages.
  useEffect(() => {
    if (isAdmin || routeHidden || !shouldShowNewsletterPrompt()) return
    const timer = window.setTimeout(() => {
      // Re-check: the visitor may have dismissed/subscribed in the meantime.
      if (shouldShowNewsletterPrompt()) setOpen(true)
    }, FIRST_VISIT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isAdmin, routeHidden])

  // Sign-in (or a brand-new account): open once the redirect settles.
  useEffect(() => {
    let timer: number | undefined
    const onPrompt = () => {
      if (isAdminRef.current || isNewsletterSubscribed()) return
      timer = window.setTimeout(() => {
        if (!routeHiddenRef.current) setOpen(true)
      }, OPEN_AFTER_REGISTER_MS)
    }
    window.addEventListener(NEWSLETTER_PROMPT_EVENT, onPrompt)
    return () => {
      window.removeEventListener(NEWSLETTER_PROMPT_EVENT, onPrompt)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  // Never keep the dialog over the admin/auth screens.
  useEffect(() => {
    if (routeHidden && open) setOpen(false)
  }, [routeHidden, open])

  // Prefill the address of a signed-in customer.
  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email)
  }, [user?.email])

  // Move focus into the dialog; Escape + body lock come from the shared hooks.
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 150)
    return () => window.clearTimeout(timer)
  }, [open])

  useEscape(close, open)
  useLockBody(open)

  // Close on its own shortly after the thank-you state.
  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => setOpen(false), 3200)
    return () => window.clearTimeout(timer)
  }, [done])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError('Adresa de email nu este validă.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await subscribeNewsletter(value)
      markNewsletterSubscribed()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut trimite. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-title"
        className="animate-pop-in relative w-full max-w-lg overflow-hidden border border-brass/40 bg-paper-50 shadow-2xl"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-oxblood via-brass to-oxblood" />
        <button
          type="button"
          onClick={close}
          aria-label="Închide"
          className="absolute right-3 top-4 rounded-sm p-1 text-ink-muted transition-colors hover:text-ink"
        >
          <IconClose className="h-5 w-5" />
        </button>

        <div className="texture-paper px-6 pb-8 pt-9 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brass/40 bg-paper-100 text-oxblood">
            <IconMail className="h-5 w-5" />
          </span>
          <p className="eyebrow mt-5">{settings.newsletterEyebrow}</p>
          <h2
            id="newsletter-popup-title"
            className="serif-display mx-auto mt-2 max-w-sm text-3xl text-ink sm:text-4xl"
          >
            {settings.newsletterTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
            {settings.newsletter}
          </p>

          {done ? (
            <div
              className="mx-auto mt-7 flex max-w-sm flex-col items-center gap-2 text-oxblood"
              role="status"
            >
              <IconCheck className="h-8 w-8" />
              <p className="font-serif text-xl leading-snug text-ink">{settings.newsletterSuccess}</p>
            </div>
          ) : (
            <>
              <form onSubmit={onSubmit} noValidate className="mx-auto mt-6 max-w-sm">
                <label htmlFor="newsletter-popup-email" className="sr-only">
                  Adresa ta de email
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={inputRef}
                    id="newsletter-popup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="adresa@email.ro"
                    className="field flex-1 text-center sm:text-left"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Se trimite…' : settings.newsletterCta}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-xs text-oxblood" role="alert">
                    {error}
                  </p>
                )}
              </form>

              <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-xs text-ink-muted">
                {BENEFITS.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-dark" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </>

          )}

          {!done && (
            <button
              type="button"
              onClick={close}
              className="mt-5 text-xs uppercase tracking-wider text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Nu acum, mulțumesc
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
