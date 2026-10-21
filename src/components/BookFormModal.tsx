import { useRef, useState } from 'react'
import type { AdminBookInput, Book, ProductCategory, ProductVariant } from '../types'
import { FormField } from './FormField'
import { bookService } from '../services/bookService'
import { uploadImage, isImageFile } from '../services/uploadService'
import { IconClose } from './icons'

interface BookFormModalProps {
  /** When present the modal edits this book; otherwise it creates a new one. */
  book: Book | null
  /** The storefront categories, shown in the category dropdown. */
  categories: ProductCategory[]
  onClose: () => void
  onSaved: () => void
}

export function BookFormModal({ book, categories, onClose, onSaved }: BookFormModalProps) {
  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [price, setPrice] = useState(String(book?.price ?? ''))
  const [stock, setStock] = useState(String(book?.stock ?? ''))
  const [coverSrc, setCoverSrc] = useState(book?.cover?.src ?? '')
  const [category, setCategory] = useState(book?.category ?? '')
  const [categoryId, setCategoryId] = useState(book?.categoryId ?? '')
  const [productType, setProductType] = useState(book?.productType ?? 'physical')
  const [variants, setVariants] = useState<ProductVariant[]>(book?.variants ?? [])
  const [digitalFileUrl, setDigitalFileUrl] = useState(book?.digitalFileUrl ?? '')
  const [digitalAccess, setDigitalAccess] = useState(book?.digitalAccess ?? '')
  const [shippingDelivery, setShippingDelivery] = useState(
    book?.shippingInfo?.delivery ?? '',
  )
  const [shippingPayment, setShippingPayment] = useState(
    book?.shippingInfo?.payment ?? '',
  )
  const [shippingReturns, setShippingReturns] = useState(
    book?.shippingInfo?.returns ?? '',
  )
  const [shortDescription, setShortDescription] = useState(book?.shortDescription ?? '')
  const [description, setDescription] = useState(book?.description ?? '')
  const [excerpt, setExcerpt] = useState(book?.excerpt ?? '')
  const [featured, setFeatured] = useState(book?.featured ?? false)
  const [status, setStatus] = useState<Book['status']>(book?.status ?? 'draft')
  const [gallery, setGallery] = useState<string[]>(book?.gallery ?? [])
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleCoverUpload = async (file: File) => {
    if (!isImageFile(file)) {
      setError('Coperta trebuie să fie o imagine (JPEG sau PNG).')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const { url } = await uploadImage(file)
      setCoverSrc(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coperta nu a putut fi încărcată.')
    } finally {
      setUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleGalleryUpload = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    const valid = list.filter(isImageFile)
    if (valid.length === 0) {
      setError('Galeria acceptă doar imagini (JPEG sau PNG).')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const file of valid) {
        const { url } = await uploadImage(file)
        urls.push(url)
      }
      setGallery((prev) => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Imaginile nu au putut fi încărcate.')
    } finally {
      setUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const updateVariant = (i: number, patch: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v, j) => (j === i ? { ...v, ...patch } : v)))
  }

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', priceDelta: 0, stock: 0 },
    ])
  }

  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, j) => j !== i))
  }

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
      gallery,
      shortDescription: shortDescription.trim(),
      description: description.trim() || shortDescription.trim(),
      excerpt: excerpt.trim() || 'Fragmentul va apărea aici după publicare.',
      isbn: book?.isbn,
      pages: book?.pages,
      year: book?.year,
      language: book?.language,
      format: book?.format,
      category: category.trim() || undefined,
      categoryId: categoryId.trim() || undefined,
      productType,
      variants,
      digitalFileUrl: digitalFileUrl.trim() || undefined,
      digitalAccess: digitalAccess.trim() || undefined,
      shippingInfo: {
        ...(shippingDelivery.trim() ? { delivery: shippingDelivery.trim() } : {}),
        ...(shippingPayment.trim() ? { payment: shippingPayment.trim() } : {}),
        ...(shippingReturns.trim() ? { returns: shippingReturns.trim() } : {}),
      },
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
          <div className="sm:col-span-2">
            <FormField label="Copertă" htmlFor="bk-cover-file">
              <input
                ref={coverInputRef}
                id="bk-cover-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                className="field file:mr-3 file:rounded-none file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-paper-50"
              />
              <p className="mt-1 text-xs text-ink-muted">Alege un fișier JPEG/PNG din computer. Sau:</p>
            </FormField>
            <FormField label="sau URL copertă" htmlFor="bk-cover">
              <input id="bk-cover" className="field" value={coverSrc} onChange={(e) => setCoverSrc(e.target.value)} placeholder="https://… (opțional)" />
            </FormField>
            {coverSrc && (
              <img
                src={coverSrc}
                alt="Previzualizare copertă"
                className="mt-3 h-40 w-auto border border-ink/10 object-contain"
              />
            )}
          </div>
          <FormField label="Tip produs" htmlFor="bk-type">
            <select
              id="bk-type"
              className="field"
              value={productType}
              onChange={(e) => setProductType(e.target.value as 'physical' | 'digital')}
            >
              <option value="physical">Produs fizic (livrat)</option>
              <option value="digital">Produs digital (descărcare)</option>
            </select>
          </FormField>
          <FormField label="Categorie" htmlFor="bk-category">
            <select
              id="bk-category"
              className="field"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— alege categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Etichetă categorie (text liber)" htmlFor="bk-category-label">
            <input id="bk-category-label" className="field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex: Cărți, Accesorii (opțional)" />
          </FormField>

          {productType === 'digital' ? (
            <div className="sm:col-span-2 flex flex-col gap-4 border border-brass/40 bg-brass/5 p-4">
              <p className="text-sm font-medium text-ink">Detalii produs digital</p>
              <FormField label="URL / cale fișier sau link de acces" htmlFor="bk-dfile">
                <input id="bk-dfile" className="field" value={digitalFileUrl} onChange={(e) => setDigitalFileUrl(e.target.value)} placeholder="https://… sau /files/curs.pdf" />
              </FormField>
              <FormField label="Notă de acces (ce primește clientul)" htmlFor="bk-daccess">
                <textarea id="bk-daccess" rows={2} className="field resize-none" value={digitalAccess} onChange={(e) => setDigitalAccess(e.target.value)} placeholder="ex: Accesul se trimite prin email după confirmarea comenzii." />
              </FormField>
            </div>
          ) : (
            <div className="sm:col-span-2 flex flex-col gap-3 border border-ink/10 bg-paper-100/40 p-4">
              <p className="text-sm font-medium text-ink">Informații livrare / plată / returnare</p>
              <FormField label="Livrare" htmlFor="bk-ship-delivery">
                <input id="bk-ship-delivery" className="field" value={shippingDelivery} onChange={(e) => setShippingDelivery(e.target.value)} placeholder="ex: Curier SameDay, 24-48h" />
              </FormField>
              <FormField label="Plată" htmlFor="bk-ship-payment">
                <input id="bk-ship-payment" className="field" value={shippingPayment} onChange={(e) => setShippingPayment(e.target.value)} placeholder="ex: Ramburs sau card" />
              </FormField>
              <FormField label="Returnare" htmlFor="bk-ship-returns">
                <input id="bk-ship-returns" className="field" value={shippingReturns} onChange={(e) => setShippingReturns(e.target.value)} placeholder="ex: 14 zile, conform legii" />
              </FormField>
            </div>
          )}
          <div className="sm:col-span-2">
            <FormField label="Galerie (imagini din interior)" htmlFor="bk-gallery-file">
              <input
                ref={galleryInputRef}
                id="bk-gallery-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={uploading}
                onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
                className="field file:mr-3 file:rounded-none file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-paper-50"
              />
              <p className="mt-1 text-xs text-ink-muted">Poți selecta mai multe imagini JPEG/PNG deodată.</p>
            </FormField>
            {gallery.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {gallery.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative">
                    <img src={src} alt={`Galeria ${i + 1}`} className="h-24 w-20 border border-ink/10 object-cover" />
                    <button
                      type="button"
                      aria-label="Șterge imaginea"
                      onClick={() => setGallery((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-oxblood text-white shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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

          {/* Variante */}
          <div className="sm:col-span-2 flex flex-col gap-3 border border-ink/10 bg-paper-100/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Variante (opțional)</p>
              <button
                type="button"
                onClick={addVariant}
                className="btn btn-outline px-3 py-1.5 text-xs"
              >
                + Adaugă variantă
              </button>
            </div>
            {variants.length === 0 && (
              <p className="text-xs text-ink-muted">
                ex: gravură format A4, mărime S/M/L, ediție limitată. Fiecare variantă își
                poate avea prețul și stocul proprii.
              </p>
            )}
            {variants.map((v, i) => (
              <div key={v.id} className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto] sm:items-end">
                <FormField label={`Nume varianta ${i + 1}`} htmlFor={`bk-var-name-${v.id}`}>
                  <input
                    id={`bk-var-name-${v.id}`}
                    className="field"
                    value={v.name}
                    onChange={(e) => updateVariant(i, { name: e.target.value })}
                    placeholder="ex: Gravura A4"
                  />
                </FormField>
                <FormField label="Δ preț (RON)" htmlFor={`bk-var-price-${v.id}`}>
                  <input
                    id={`bk-var-price-${v.id}`}
                    type="number"
                    step="0.01"
                    className="field"
                    value={v.priceDelta ?? 0}
                    onChange={(e) => updateVariant(i, { priceDelta: Number(e.target.value) || 0 })}
                  />
                </FormField>
                <FormField label="Stoc" htmlFor={`bk-var-stock-${v.id}`}>
                  <input
                    id={`bk-var-stock-${v.id}`}
                    type="number"
                    min="0"
                    className="field"
                    value={v.stock ?? 0}
                    onChange={(e) => updateVariant(i, { stock: Number(e.target.value) || 0 })}
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  aria-label="Șterge varianta"
                  className="mb-1 flex h-9 w-9 items-center justify-center justify-self-end rounded-sm text-ink-muted transition-colors hover:bg-oxblood hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {(error || uploading) && (
            <p className={`text-sm sm:col-span-2 ${error ? 'text-oxblood' : 'text-ink-muted'}`} role={error ? 'alert' : undefined}>
              {uploading && !error ? 'Se încarcă imaginile…' : error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-ink/10 pt-4 sm:col-span-2">
            <button type="button" onClick={onClose} className="btn btn-outline px-5 py-2.5">
              Anulează
            </button>
            <button type="submit" disabled={saving || uploading} className="btn btn-primary px-6 py-2.5 disabled:opacity-60">
              {saving ? 'Se salvează…' : book ? 'Salvează modificările' : 'Adaugă cartea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

