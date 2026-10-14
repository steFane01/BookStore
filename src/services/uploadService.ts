import { getToken, NetworkError } from './http'

/**
 * Upload service — lets the admin add book covers and interior (gallery) photos
 * by browsing a local JPEG/PNG file instead of pasting a URL.
 *
 *   uploadImage(file): Promise<{ url: string }>
 *
 * The backend (`POST /api/upload`, admin-only) stores the image under the
 * `uploads/` directory and returns a public `/uploads/<file>` URL that is then
 * saved on the `books` row (`cover_src`, `gallery`).
 */

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** True when the file can be uploaded (JPEG/PNG as the buyer requested). */
export function isImageFile(file: File): boolean {
  return ACCEPTED.includes(file.type)
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('image', file)
  const token = getToken()

  let res: Response
  try {
    res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
  } catch (err) {
    throw new NetworkError(err)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data && typeof data.error === 'string' ? data.error : `Upload eșuat (${res.status}).`
    // Reuse the HttpClient's token-drop behaviour so an expired admin session
    // is cleared just like any other authed call.
    if (res.status === 401 && token) {
      try {
        window.localStorage.removeItem('libraria.session-token')
      } catch {
        /* ignore */
      }
    }
    throw new Error(message)
  }
  return { url: data.url }
}
