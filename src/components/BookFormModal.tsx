import { useState } from 'react'
import type { AdminBookInput, Book } from '../types'
import { FormField } from './FormField'
import { bookService } from '../services/bookService'
import { IconClose } from './icons'

interface BookFormModalProps {
  /** When present the modal edits this book; otherwise it creates a new one. */
  book: Book | null
  onClose: () => void
  onSaved: () => void
}

export function BookFormModal({ book, onClose, onSaved }: BookFormModalProps) {
  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [price, setPrice] = useState(String(book?.price ?? ''))
  const [stock, setStock] = useState(String(book?.stock ?? ''))
  const [coverSrc, setCoverSrc] = useState(book?.cover.src ?? '')
  const [category, setCategory] = useState(book?.category ?? '')
  const [shortDescription, setShortDescription] = useState(book?.shortDescription ?? '')
  const [description, setDescription] = useState(book?.description ?? '')
  const [excerpt, setExcerpt] = useState(book?.excerpt ?? '')
  const [featured, setFeatured] = useState(book?.featured ?? false)
  const [status, setStatus] = useState<Book['status']>(book?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) {
      setError('Titlul și autorul sunt obligatorii.')
      return
    }
    const input: AdminBookInput = {
      title: title.trim(),
      author: author.trim(),
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      coverSrc: coverSrc.trim() || null,
      gallery: book?.gallery ?? [],
      shortDescription: shortDescription.trim(),
      description: description.trim() || shortDescription.trim(),
      excerpt: excerpt.trim() || 'Fragmentul va apărea aici după publicare.',
      isbn: book?.isbn,
      pages: book?.pages,
      year: book?.year,
      language: book?.language,
      format: book?.format,
      category: category.trim() || undefined,
      featured,
      status,
    }
    setSaving(true)
    setError(null)
    try {
      if (book) {
        await bookService.updateBook(book.id, input)
      } else {
        await bookService.createBook(input)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-16 md:pt-24">
      <div className="w-full max-w-2xl border border-ink/10 bg-paper-50 shadow-lg">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-serif text-2xl text-ink">
            {book ? 'Editează cartea' : 'Adaugă o carte nouă'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted transition-colors hover:text-ink"
            aria-label="Închide"
          >
            <IconClose className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
          <FormField label="Titlu" htmlFor="bk-title" required>
            <input id="bk-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Autor" htmlFor="bk-author" required>
            <input id="bk-author" className="field" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </FormField>
          <FormField label="Preț (RON)" htmlFor="bk-price">
            <input id="bk-price" type="number" min="0" step="0.01" className="field" value={price} onChange={(e) => setPrice(e.target.value)} />
          </FormField>
          <FormField label="Stoc" htmlFor="bk-stock">
            <input id="bk-stock" type="number" min="0" className="field" value={stock} onChange={(e) => setStock(e.target.value)} />
          </FormField>
          <FormField label="URL copertă" htmlFor="bk-cover">
            <input id="bk-cover" className="field" value={coverSrc} onChange={(e) => setCoverSrc(e.target.value)} placeholder="https://… (opțional)" />
          </FormField>
          <FormField label="Categorie" htmlFor="bk-category">
            <input id="bk-category" className="field" value={category} onChange={(e) => setCategory(e.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Descriere scurtă" htmlFor="bk-short">
              <textarea id="bk-short" rows={2} className="field resize-none" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Descriere" htmlFor="bk-desc">
              <textarea id="bk-desc" rows={3} className="field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Fragment (excerpt)" htmlFor="bk-excerpt">
              <textarea id="bk-excerpt" rows={3} className="field resize-none" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            </FormField>
          </div>

          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#642A2E]" />
              Prezentată pe prima pagină
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={status === 'active'}
                onChange={(e) => setStatus(e.target.checked ? 'active' : 'draft')}
                className="h-4 w-4 accent-[#642A2E]"
              />
              Publicată
            </label>
          </div>

          {error && (
            <p className="text-sm text-oxblood sm:col-span-2" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-ink/10 pt-4 sm:col-span-2">
            <button type="button" onClick={onClose} className="btn btn-outline px-5 py-2.5">
              Anulează
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary px-6 py-2.5 disabled:opacity-60">
              {saving ? 'Se salvează…' : book ? 'Salvează modificările' : 'Adaugă cartea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

