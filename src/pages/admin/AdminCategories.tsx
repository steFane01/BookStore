import { useState } from 'react'
import type { Book, ProductCategory } from '../../types'
import { bookService } from '../../services/bookService'
import { useDialog } from '../../context/DialogContext'
import { FormField } from '../../components/FormField'

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
  const [sort, setSort] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const { confirm } = useDialog()

  const reset = () => {
    setEditingId(null)
    setName('')
    setBlurb('')
    setSort('0')
  }

  const startEdit = (category: ProductCategory) => {
    setEditingId(category.id)
    setName(category.name)
    setBlurb(category.blurb ?? '')
    setSort(String(category.sort ?? 0))
    setSaved(false)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const payload = { name: name.trim(), blurb: blurb.trim(), sort: Number(sort) || 0 }
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <p className="mb-4 text-sm text-ink-muted">
          Categoriile apar pe prima pagină și în filtrele din catalog.
        </p>
        <ul className="divide-y divide-ink/10 border border-ink/10">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-serif text-lg text-ink">{category.name}</p>
                <p className="text-xs text-ink-muted">
                  {category.blurb || '—'} · {countFor(category.id)} produse · ordine {category.sort ?? 0}
                </p>
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
        <FormField label="Nume" htmlFor="cat-name" required>
          <input id="cat-name" className="field" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="Descriere scurtă" htmlFor="cat-blurb">
          <input id="cat-blurb" className="field" value={blurb} onChange={(event) => setBlurb(event.target.value)} />
        </FormField>
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
