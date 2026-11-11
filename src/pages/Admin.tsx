import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Book, OrderDraft, ProductCategory } from '../types'
import { useAuth } from '../context/AuthContext'
import { useDialog } from '../context/DialogContext'
import { bookService } from '../services/bookService'
import { orderService } from '../services/orderService'
import { HttpError } from '../services/http'
import { formatPrice } from '../utils/format'
import { usePageMeta } from '../hooks/usePageMeta'
import { BookFormModal } from '../components/BookFormModal'
import { IconBook, IconCart, IconPlus, IconTrash, IconEdit, IconCheck } from '../components/icons'
import { AdminOrders } from './admin/AdminOrders'
import { AdminCategories } from './admin/AdminCategories'
import { AdminSettings } from './admin/AdminSettings'
import { AdminNewsletter } from './admin/AdminNewsletter'

type Tab = 'dashboard' | 'catalog' | 'categories' | 'orders' | 'newsletter' | 'settings'

export default function Admin() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, logout } = useAuth()

  const [tab, setTab] = useState<Tab>('dashboard')
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [orders, setOrders] = useState<OrderDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  usePageMeta('Administrare')

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/autentificare', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  const loadAll = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return
    setLoadError(null)
    try {
      const [bookList, categoryList, orderList] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getCategories(),
        orderService.getOrders(),
      ])
      setBooks(bookList)
      setCategories(categoryList)
      setOrders(orderList)
    } catch (err) {
      // An expired/invalid session shows up as a 401 — clear it and re-login
      // instead of leaving the page stuck on the loading spinner forever.
      if (err instanceof HttpError && err.status === 401) {
        logout()
        navigate('/autentificare', { replace: true })
        return
      }
      setLoadError(err instanceof Error ? err.message : 'Nu am putut încărca datele.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const stats = useMemo(() => {
    const activeBooks = books.filter((book) => book.status === 'active').length
    const totalStock = books.reduce((sum, book) => sum + book.stock, 0)
    const pendingOrders = orders.filter((order) => order.status === 'pending').length
    const revenue = orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + (order.total ?? order.subtotal), 0)
    const lowStock = books.filter((book) => book.status === 'active' && book.stock <= 3).length
    return { totalBooks: books.length, activeBooks, totalStock, pendingOrders, revenue, lowStock }
  }, [books, orders])

  if (!isAuthenticated || !isAdmin) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Prezentare generală' },
    { key: 'catalog', label: 'Produse' },
    { key: 'categories', label: 'Categorii' },
    { key: 'orders', label: 'Comenzi' },
    { key: 'newsletter', label: 'Abonați' },
    { key: 'settings', label: 'Setări' },
  ]

  return (
    <div className="pt-20 md:pt-24">
      <div className="container-page py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Administrare</p>
            <h1 className="serif-display text-4xl text-ink">Panou de administrare</h1>
          </div>
          {loading && (
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          )}
        </div>

        {loadError && (
          <div className="mb-6 rounded border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood" role="alert">
            <p className="font-medium">A apărut o problemă la încărcarea datelor.</p>
            <p className="mt-1 text-oxblood/80">{loadError}</p>
            <button onClick={() => void loadAll()} className="mt-3 underline underline-offset-2">
              Reîncearcă
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-4">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                tab === item.key ? 'bg-ink text-paper-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === 'dashboard' && <DashboardTab stats={stats} books={books} categories={categories} />}
          {tab === 'catalog' && <CatalogTab books={books} categories={categories} onRefresh={loadAll} />}
          {tab === 'categories' && (
            <AdminCategories categories={categories} books={books} onRefresh={loadAll} />
          )}
          {tab === 'orders' && <AdminOrders orders={orders} onRefresh={loadAll} />}
          {tab === 'newsletter' && <AdminNewsletter />}
          {tab === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  )
}

function DashboardTab({
  stats,
  books,
  categories,
}: {
  stats: {
    totalBooks: number
    activeBooks: number
    totalStock: number
    pendingOrders: number
    revenue: number
    lowStock: number
  }
  books: Book[]
  categories: ProductCategory[]
}) {
  const cards = [
    { label: 'Produse în catalog', value: String(stats.totalBooks), icon: IconBook },
    { label: 'Produse publicate', value: String(stats.activeBooks), icon: IconBook },
    { label: 'Exemplare în stoc', value: String(stats.totalStock), icon: IconBook },
    { label: 'Comenzi în așteptare', value: String(stats.pendingOrders), icon: IconCart },
  ]

  const byCategory = categories
    .map((category) => {
      const items = books.filter((book) => book.categoryId === category.id)
      return {
        category,
        total: items.length,
        active: items.filter((book) => book.status === 'active').length,
      }
    })
    .sort((a, b) => (a.category.sort ?? 0) - (b.category.sort ?? 0))

  const uncategorized = books.filter(
    (book) => !book.categoryId || !categories.some((category) => category.id === book.categoryId),
  )

  const lowStock = books.filter((book) => book.status === 'active' && book.stock <= 3)

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-ink/10 bg-paper-50 p-6">
            <card.icon className="mb-4 h-7 w-7 text-brass-dark" />
            <p className="font-serif text-4xl text-ink">{card.value}</p>
            <p className="mt-1 text-sm text-ink-muted">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-ink/10 bg-paper-50 p-6">
          <p className="text-sm uppercase tracking-wider text-ink-muted">Produse pe categorie</p>
          <ul className="mt-4 space-y-3">
            {byCategory.map(({ category, total, active }) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3 last:border-0"
              >
                <span className="font-serif text-ink">{category.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-ink-muted">{active} publicate</span>
                  <span className="font-serif text-lg text-ink">{total}</span>
                </div>
              </li>
            ))}
            {uncategorized.length > 0 && (
              <li className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3 last:border-0">
                <span className="font-serif text-ink">Fără categorie</span>
                <span className="font-serif text-lg text-ink">{uncategorized.length}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-ink/10 bg-paper-50 p-6">
            <p className="text-sm uppercase tracking-wider text-ink-muted">Valoare totală comenzi</p>
            <p className="mt-2 font-serif text-3xl text-ink">{formatPrice(stats.revenue)}</p>
            <p className="mt-1 text-xs text-ink-muted">Fără comenzile anulate.</p>
          </div>
          <div className="border border-ink/10 bg-paper-50 p-6">
            <p className="text-sm uppercase tracking-wider text-ink-muted">Stoc scăzut</p>
            <p className="mt-2 font-serif text-3xl text-ink">{stats.lowStock}</p>
            {lowStock.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                {lowStock.slice(0, 5).map((book) => (
                  <li key={book.id}>
                    {book.title} — {book.stock} buc.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">Toate produsele au stoc suficient.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CatalogTab({
  books,
  categories,
  onRefresh,
}: {
  books: Book[]
  categories: ProductCategory[]
  onRefresh: () => Promise<void>
}) {
  const [editing, setEditing] = useState<Book | null | 'new'>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const { confirm } = useDialog()

  const categoryName = (book: Book): string => {
    if (book.categoryId) {
      const category = categories.find((item) => item.id === book.categoryId)
      if (category) return category.name
    }
    return book.category?.trim() || 'Fără categorie'
  }

  const visibleBooks = useMemo(
    () =>
      categoryFilter === 'all'
        ? books
        : books.filter((book) => book.categoryId === categoryFilter),
    [books, categoryFilter],
  )

  const countFor = (id: string | 'all') =>
    id === 'all' ? books.length : books.filter((book) => book.categoryId === id).length

  const remove = async (book: Book) => {
    const ok = await confirm({
      title: 'Ștergi produsul?',
      message: `„${book.title}” va fi șters definitiv din catalog.`,
      confirmLabel: 'Șterge produsul',
      tone: 'danger',
    })
    if (!ok) return
    setBusy(book.id)
    setActionError(null)
    try {
      await bookService.deleteBook(book.id)
      await onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Produsul nu a putut fi șters.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {books.length} produse în catalog
          {categoryFilter !== 'all' && (
            <span className="text-ink">
              {' '}
              · {visibleBooks.length} în „{categories.find((item) => item.id === categoryFilter)?.name ?? categoryFilter}”
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5"
        >
          <IconPlus className="h-4 w-4" />
          Adaugă produs
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
            categoryFilter === 'all'
              ? 'bg-ink text-paper-50'
              : 'border border-ink/15 text-ink-muted hover:text-ink'
          }`}
        >
          Toate ({countFor('all')})
        </button>
        {categories
          .slice()
          .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
          .map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === category.id ? 'all' : category.id)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                categoryFilter === category.id
                  ? 'bg-ink text-paper-50'
                  : 'border border-ink/15 text-ink-muted hover:text-ink'
              }`}
            >
              {category.name} ({countFor(category.id)})
            </button>
          ))}
      </div>

      {actionError && (
        <div className="mb-6 rounded border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood" role="alert">
          <p className="font-medium">Operațiunea nu a putut fi finalizată.</p>
          <p className="mt-1 text-oxblood/80">{actionError}</p>
        </div>
      )}

      <div className="overflow-x-auto border border-ink/10">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-paper-200/50 text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">Titlu</th>
              <th className="px-4 py-3">Categorie</th>
              <th className="px-4 py-3">Preț</th>
              <th className="px-4 py-3">Stoc</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {visibleBooks.map((book) => (
              <tr key={book.id} className="text-sm text-ink">
                <td className="px-4 py-3">
                  <p className="font-serif">{book.title}</p>
                  <p className="text-xs text-ink-muted">{book.author}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full border border-ink/15 px-2.5 py-0.5 text-xs text-ink-muted">
                    {categoryName(book)}
                  </span>
                </td>
                <td className="px-4 py-3">{formatPrice(book.price)}</td>
                <td className="px-4 py-3">
                  <span className={book.stock <= 3 ? 'text-oxblood' : ''}>
                    {book.stock}
                    {book.stock <= 3 ? ' ⚠' : ''}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      book.status === 'active' ? 'text-oxblood' : 'text-ink-muted'
                    }`}
                  >
                    <IconCheck className="h-4 w-4" />
                    {book.status === 'active' ? 'Publicat' : 'Ciornă'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(book)}
                      className="inline-flex items-center gap-1 text-ink-muted transition-colors hover:text-ink"
                      aria-label={`Editează ${book.title}`}
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(book)}
                      disabled={busy === book.id}
                      className="inline-flex items-center gap-1 text-oxblood transition-opacity disabled:opacity-40"
                      aria-label={`Șterge ${book.title}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleBooks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  {categoryFilter === 'all'
                    ? 'Catalogul este gol. Adaugă primul produs.'
                    : 'Nu există produse în această categorie.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing === 'new' ? (
        <BookFormModal
          book={null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onRefresh()
          }}
        />
      ) : editing ? (
        <BookFormModal
          book={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onRefresh()
          }}
        />
      ) : null}
    </div>
  )
}
