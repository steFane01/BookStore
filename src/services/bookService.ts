import { mockBooks, mockBooksExtended } from '../data/books'
import type { AdminBookInput, Book } from '../types'
import { api, backendAvailable, HttpError, NetworkError } from './http'

/**
 * Simulated network latency for the offline mock fallback.
 */
export const mockLatency = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * True when the backend is genuinely unreachable (network/DNS failure), which
 * is the only situation in which it is safe to serve in-memory mock data.
 */
function isOffline(err: unknown): boolean {
  return err instanceof NetworkError
}

/**
 * Book service.
 *
 * Talks to the real backend (`/api/books`) which reads/writes the `books`
 * table in Postgres, so results always reflect the database. Mock data is used
 * ONLY when the backend is genuinely unreachable (a network error) — real HTTP
 * errors (401/403/404/422/500) are surfaced as-is, never masked by mocks.
 */
export const bookService = {
  /** Public active catalog (shop/home). */
  async getBooks(): Promise<Book[]> {
    if (!backendAvailable()) {
      await mockLatency()
      return mockBooksExtended.filter((b) => b.status === 'active')
    }
    try {
      return await api<Book[]>('/books')
    } catch (err) {
      if (!isOffline(err)) throw err
      await mockLatency()
      return mockBooksExtended.filter((b) => b.status === 'active')
    }
  },

  async getFeaturedBooks(): Promise<Book[]> {
    const all = await this.getBooks()
    return all.filter((b) => b.status === 'active')
  },

  async getBookById(id: string): Promise<Book | undefined> {
    if (!backendAvailable()) {
      await mockLatency(280)
      return mockBooksExtended.find((b) => b.id === id)
    }
    try {
      return await api<Book>(`/books/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return undefined
      if (!isOffline(err)) throw err
      await mockLatency(280)
      return mockBooksExtended.find((b) => b.id === id)
    }
  },

  /** Full catalog including drafts — used by the admin panel. */
  async getAllBooks(): Promise<Book[]> {
    if (!backendAvailable()) {
      await mockLatency()
      return [...mockBooksExtended]
    }
    try {
      return await api<Book[]>('/books/all')
    } catch (err) {
      if (!isOffline(err)) throw err
      await mockLatency()
      return [...mockBooksExtended]
    }
  },

  /** Admin — create a new book, persisted to the `books` table. */
  async createBook(input: AdminBookInput): Promise<Book> {
    try {
      return await api<Book>('/books', { method: 'POST', body: input })
    } catch (err) {
      if (!isOffline(err)) throw err
      // Offline fallback: reflect the change in-memory for this session only.
      await mockLatency(500)
      const book: Book = {
        ...input,
        id: `book-${Date.now()}`,
        currency: 'RON',
        cover: {
          src: input.coverSrc,
          alt: `Coperta cărții „${input.title}”`,
          placeholder: input.coverSrc
            ? undefined
            : { title: input.title, author: input.author },
        },
        gallery: input.gallery ?? [],
      }
      mockBooksExtended.unshift(book)
      return book
    }
  },

  async updateBook(id: string, input: AdminBookInput): Promise<Book> {
    try {
      return await api<Book>(`/books/${encodeURIComponent(id)}`, { method: 'PUT', body: input })
    } catch (err) {
      if (!isOffline(err)) throw err
      // Offline fallback.
      const idx = mockBooksExtended.findIndex((b) => b.id === id)
      if (idx === -1) throw new Error('Cartea nu a fost găsită.')
      const updated: Book = {
        ...mockBooksExtended[idx],
        ...input,
        id,
        cover: {
          src: input.coverSrc,
          alt: `Coperta cărții „${input.title}”`,
          placeholder: input.coverSrc
            ? undefined
            : { title: input.title, author: input.author },
        },
      }
      mockBooksExtended[idx] = updated
      return updated
    }
  },

  async deleteBook(id: string): Promise<void> {
    try {
      await api(`/books/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (err) {
      if (!isOffline(err)) throw err
      // Offline fallback.
      const idx = mockBooksExtended.findIndex((b) => b.id === id)
      if (idx !== -1) mockBooksExtended.splice(idx, 1)
    }
  },
}

/** Reference to the base catalog (used in a couple of places). */
export { mockBooks }
