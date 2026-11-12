/**
 * Local memory for the newsletter popup.
 *
 * The popup shows up once for a first-time visitor (after a short delay) and
 * immediately after someone creates an account. „Nu acum” hides it for two
 * weeks; subscribing hides it for good. Storage failures (private browsing)
 * degrade gracefully: the popup simply doesn't auto-open.
 */

/** Fired right after a successful registration so the popup opens immediately. */
export const NEWSLETTER_PROMPT_EVENT = 'libraria:newsletter-prompt'

const STATE_KEY = 'libraria.newsletter-popup'
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000

interface PopupState {
  dismissedAt?: number
  subscribedAt?: number
}

function read(): PopupState {
  try {
    const raw = window.localStorage.getItem(STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as PopupState) : {}
  } catch {
    return {}
  }
}

function write(state: PopupState): void {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // Ignore: the popup just won't remember the choice.
  }
}

/** Ask the mounted popup to open now (called after a new account is created). */
export function requestNewsletterPrompt(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(NEWSLETTER_PROMPT_EVENT))
}

export function isNewsletterSubscribed(): boolean {
  return Boolean(read().subscribedAt)
}

/** True when a first-time visitor should see the popup after the delay. */
export function shouldShowNewsletterPrompt(now = Date.now()): boolean {
  const state = read()
  if (state.subscribedAt) return false
  if (state.dismissedAt && now - state.dismissedAt < DISMISS_TTL_MS) return false
  return true
}

/** „Nu acum”: remember the dismissal for a while. */
export function dismissNewsletterPrompt(now = Date.now()): void {
  write({ ...read(), dismissedAt: now })
}

/** Successful subscription: never show the popup again on this device. */
export function markNewsletterSubscribed(now = Date.now()): void {
  write({ subscribedAt: now })
}
