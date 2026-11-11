import { api } from './http'

/** Public form submissions (contact + newsletter). */

/** Send the contact form message to the site owner. */
export async function submitContact(input: {
  name: string
  email: string
  message: string
}): Promise<void> {
  await api('/forms/contact', { method: 'POST', body: input, authed: false })
}

/** Subscribe a visitor to the newsletter (stored + confirmation email). */
export async function subscribeNewsletter(email: string): Promise<void> {
  await api('/forms/newsletter', { method: 'POST', body: { email }, authed: false })
}
