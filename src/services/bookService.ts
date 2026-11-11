import type { AdminBookInput, Book, ProductCategory } from '../types'
import { api, HttpError } from './http'

/**
 * Catalog service — talks to `/api/books` only (no mock fallback).
 *
 * The public endpoints return active products; the admin ones require the
 * owner's session token and include drafts + the private digital file URL.
 */
export interface CategoryInput {
  name: string
  blurb?: string
  sort?: number
}

export const bookService = {
  /** Active catalog, optionally filtered by category id/slug. */
  async getBooks(category?: string): Promise<Book[]> {
    const query = category ? `?categorie=${encodeURIComponent(category)}` : ''
    return api<Book[]>(`/books${query}`)
  },

  /** The storefront categories (owner-managed). */
  async getCategories(): Promise<ProductCategory[]> {
    return api<ProductCategory[]>('/books/categories')
  },

  async getFeaturedBooks(): Promise<Book[]> {
    const all = await this.getBooks()
    return all.filter((book) => book.status === 'active')
  },

  async getBookById(id: string): Promise<Book | undefined> {
    try {
      return await api<Book>(`/books/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return undefined
      throw err
    }
  },

  /** Full catalog including drafts — used by the admin panel. */
  async getAllBooks(): Promise<Book[]> {
    return api<Book[]>('/books/all')
  },

  async createBook(input: AdminBookInput): Promise<Book> {
    return api<Book>('/books', { method: 'POST', body: input })
  },

  async updateBook(id: string, input: AdminBookInput): Promise<Book> {
    return api<Book>(`/books/${encodeURIComponent(id)}`, { method: 'PUT', body: input })
  },

  async deleteBook(id: string): Promise<void> {
    await api(`/books/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  async createCategory(input: CategoryInput): Promise<ProductCategory> {
    return api<ProductCategory>('/books/categories', { method: 'POST', body: input })
  },

  async updateCategory(id: string, input: CategoryInput): Promise<ProductCategory> {
    return api<ProductCategory>(`/books/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: input,
    })
  },

  async deleteCategory(id: string): Promise<void> {
    await api(`/books/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
