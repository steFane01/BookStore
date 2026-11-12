import { useRef, useState } from 'react'
import type { Book, ProductCategory } from '../../types'
import { bookService } from '../../services/bookService'
import { useDialog } from '../../context/DialogContext'
import { FormField } from '../../components/FormField'
import { isImageFile, uploadImage } from '../../services/uploadService'

/** Category management — the owner can add/rename/reorder collections. */
export function AdminCategories({
  categories,
  books,
  onRefresh,
}: {
  categories: ProductCategory[]
  books: Book[]
  onRefresh: () => Promise<void>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [blurb, setBlurb] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sort, setSort] = useState('0')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { confirm } = useDialog()

  const reset = () => {
    setEditingId(null)
    setName('')
    setBlurb('')
    setDescription('')
    setImageUrl('')
    setSort('0')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const startEdit = (category: ProductCategory) => {
    setEditingId(category.id)
    setName(category.name)
    setBlurb(category.blurb ?? '')
    setDescription(category.description ?? '')
    setImageUrl(category.imageUrl ?? '')
    setSort(String(category.sort ?? 0))
    setSaved(false)
  }

  const uploadCategoryImage = async (file: File | undefined) => {
    if (!file) return
    if (!isImageFile(file)) {
      setError('Format neacceptat. Alege o imagine JPEG, PNG, WebP sau GIF.')
      return
    }
    setUploading(true)
    setError(null)
    setSaved(false)
    try {
      const { url } = await uploadImage(file)
      setImageUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Imaginea nu a putut fi încărcată.')
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const payload = {
        name: name.trim(),
        blurb: blurb.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        sort: Number(sort) || 0,
      }
      if (editingId) await bookService.updateCategory(editingId, payload)
      else await bookService.createCategory(payload)
      reset()
      setSaved(true)
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Categoria nu a putut fi salvată.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (category: ProductCategory) => {
    const ok = await confirm({
      title: 'Ștergi categoria?',
      message: `Categoria „${category.name}” va fi ștearsă. Produsele rămân în catalog, dar fără categorie.`,
      confirmLabel: 'Șterge categoria',
      tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await bookService.deleteCategory(category.id)
      if (editingId === category.id) reset()
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Categoria nu a putut fi ștearsă.')
    } finally {
      setBusy(false)
    }
  }

  const countFor = (categoryId: string) =>
    books.filter((book) => book.categoryId === categoryId).length

  const editingCategory = categories.find((category) => category.id === editingId)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <p className="mb-4 text-sm text-ink-muted">
          Categoriile apar pe prima pagină, iar fiecare are propria pagină cu titlu mare,
          descriere, imagine și produsele colecției.
        </p>
        <ul className="divide-y divide-ink/10 border border-ink/10">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="h-12 w-16 shrink-0 border border-ink/10 object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center border border-dashed border-ink/20 text-[10px] uppercase tracking-wider text-ink-muted">
                    fără foto
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-serif text-lg text-ink">{category.name}</p>
                  <p className="text-xs text-ink-muted">
                    {category.blurb || '—'} · {countFor(category.id)} produse · ordine {category.sort ?? 0}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {category.description ? 'pagină cu descriere' : 'pagină fără descriere'}
                    {category.imageUrl ? ', cu imagine' : ', fără imagine'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button type="button" onClick={() => startEdit(category)} className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                  Editează
                </button>
                <button type="button" onClick={() => void remove(category)} className="text-oxblood underline-offset-2 hover:underline">
                  Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submit} noValidate className="flex h-fit flex-col gap-4 border border-ink/10 bg-paper-50 p-5">
        <p className="font-serif text-xl text-ink">
          {editingId ? 'Editează categoria' : 'Adaugă o categorie'}
        </p>
        {editingCategory && (
          <a
            href={`/categorie/${encodeURIComponent(editingCategory.slug || editingCategory.id)}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs uppercase tracking-wider text-brass-dark underline-offset-4 hover:underline"
          >
            Vezi pagina categoriei →
          </a>
        )}
        <FormField label="Nume" htmlFor="cat-name" required>
          <input id="cat-name" className="field" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="Descriere scurtă (card pe prima pagină)" htmlFor="cat-blurb">
          <input
            id="cat-blurb"
            className="field"
            value={blurb}
            onChange={(event) => setBlurb(event.target.value)}
            placeholder="O frază afișată pe cardul categoriei"
          />
        </FormField>
        <FormField
          label="Descrierea paginii categoriei"
          htmlFor="cat-description"
          hint="Apare sub titlul mare, pe pagina colecției."
        >
          <textarea
            id="cat-description"
            rows={4}
            className="field resize-none"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Câteva rânduri despre ce găsește cititorul în această colecție."
          />
        </FormField>
        <FormField
          label="Imaginea paginii categoriei"
          htmlFor="cat-image-file"
          hint="JPEG, PNG, WebP sau GIF. Opțional — apare sub descriere."
        >
          <input
            ref={imageInputRef}
            id="cat-image-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => void uploadCategoryImage(event.target.files?.[0])}
            className="field file:mr-3 file:rounded-none file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-paper-50"
          />
        </FormField>
        {uploading && <p className="text-xs text-ink-muted">Se încarcă imaginea…</p>}
        {imageUrl && (
          <div className="flex items-start gap-3">
            <img
              src={imageUrl}
              alt="Previzualizare imagine categorie"
              className="h-24 w-full max-w-[16rem] border border-ink/10 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImageUrl('')
                setSaved(false)
              }}
              className="text-xs text-oxblood underline underline-offset-2"
            >
              Elimină
            </button>
          </div>
        )}
        <FormField label="Ordine afișare" htmlFor="cat-sort">
          <input id="cat-sort" type="number" className="field" value={sort} onChange={(event) => setSort(event.target.value)} />
        </FormField>

        {error && (
          <p className="text-sm text-oxblood" role="alert">
            {error}
          </p>
        )}
        {saved && <p className="text-sm text-oxblood">Categoria a fost salvată.</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn btn-primary px-5 py-2.5 disabled:opacity-60">
            {busy ? 'Se salvează…' : editingId ? 'Salvează' : 'Adaugă'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="text-sm text-ink-muted underline underline-offset-2">
              Anulează
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
