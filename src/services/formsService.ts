import { api, NetworkError } from './http'

/**
 * Public form submissions (contact + newsletter).
 *
 * Contact: emails the visitor's message TO the site owner's mailbox (configured
 * in `.env`). Newsletter: emails a confirmation TO the address the visitor typed.
 *
 * On a network failure both fall back to the previous local-only behaviour
 * (success without sending) so the UI still works when the stack is down.
 */

/** Send the contact form message to the site owner. */
export async function submitContact(input: {
  name: string
  email: string
  message: string
}): Promise<void> {
  try {
    await api('/forms/contact', { method: 'POST', body: input, authed: false })
  } catch (err) {
    if (err instanceof NetworkError) return // offline: keep UI responsive
    throw err
  }
}

/** Subscribe a visitor to the newsletter (emails a confirmation to their inbox). */
export async function subscribeNewsletter(email: string): Promise<void> {
  try {
    await api('/forms/newsletter', { method: 'POST', body: { email }, authed: false })
  } catch (err) {
    if (err instanceof NetworkError) return // offline: keep UI responsive
    throw err
  }
}
