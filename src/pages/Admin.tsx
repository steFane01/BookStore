import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Book, OrderDraft } from '../types'
import { useAuth } from '../context/AuthContext'
import { bookService } from '../services/bookService'
import { orderService } from '../services/orderService'
import { HttpError } from '../services/http'
import { orderStatusLabels } from '../services/authService'
import { formatPrice } from '../utils/format'
import { FormField } from '../components/FormField'
import { IconBook, IconCart, IconCheck, IconPlus, IconTrash, IconEdit } from '../components/icons'
import { BookFormModal } from '../components/BookFormModal'

type Tab = 'dashboard' | 'catalog' | 'orders' | 'settings'

export default function Admin() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, logout } = useAuth()

  const [tab, setTab] = useState<Tab>('dashboard')
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<OrderDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/autentificare', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return
    let active = true
    ;(async () => {
      setLoadError(null)
      try {
        const [b, o] = await Promise.all([
          bookService.getAllBooks(),
          orderService.getOrders(),
        ])
        if (!active) return
        setBooks(b)
        setOrders(o)
        setLoading(false)
      } catch (err) {
        if (!active) return
        // An expired/invalid session shows up as a 401 on the admin endpoints.
        // Clear it and send the user back to the login screen instead of leaving
        // the page stuck on the loading spinner ("pending") forever.
        if (err instanceof HttpError && err.status === 401) {
          logout()
          navigate('/autentificare', { replace: true })
          return
        }
        setLoadError(err instanceof Error ? err.message : 'Nu am putut încărca datele.')
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  const stats = useMemo(() => {
    const activeBooks = books.filter((b) => b.status === 'active').length
    const totalStock = books.reduce((s, b) => s + b.stock, 0)
    const pendingOrders = orders.filter((o) => o.status === 'pending').length
    const revenue = orders.reduce((s, o) => s + o.subtotal, 0)
    return { totalBooks: books.length, activeBooks, totalStock, pendingOrders, revenue }
  }, [books, orders])

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  const refreshBooks = async () => {
    try {
      setLoadError(null)
      setBooks(await bookService.getAllBooks())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Nu am putut reîncărca catalogul.')
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Prezentare generală' },
    { key: 'catalog', label: 'Catalog' },
    { key: 'orders', label: 'Comenzi' },
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
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                tab === t.key ? 'bg-ink text-paper-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === 'dashboard' && <DashboardTab stats={stats} />}
          {tab === 'catalog' && (
            <CatalogTab books={books} onRefresh={refreshBooks} />
          )}
          {tab === 'orders' && <OrdersTab orders={orders} />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  )
}

function DashboardTab({
  stats,
}: {
  stats: {
    totalBooks: number
    activeBooks: number
    totalStock: number
    pendingOrders: number
    revenue: number
  }
}) {
  const cards = [
    { label: 'Cărți în catalog', value: String(stats.totalBooks), icon: IconBook },
    { label: 'Cărți active', value: String(stats.activeBooks), icon: IconBook },
    { label: 'Exemplare în stoc', value: String(stats.totalStock), icon: IconBook },
    { label: 'Comenzi în așteptare', value: String(stats.pendingOrders), icon: IconCart },
  ]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-ink/10 bg-paper-50 p-6">
            <c.icon className="mb-4 h-7 w-7 text-brass-dark" />
            <p className="font-serif text-4xl text-ink">{c.value}</p>
            <p className="mt-1 text-sm text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-ink/10 bg-paper-50 p-6">
        <p className="text-sm uppercase tracking-wider text-ink-muted">Valoare totală comenzi</p>
        <p className="mt-2 font-serif text-3xl text-ink">{formatPrice(stats.revenue)}</p>
      </div>
    </div>
  )
}


function CatalogTab({
  books,
  onRefresh,
}: {
  books: Book[]
  onRefresh: () => Promise<void>
}) {
  const [editing, setEditing] = useState<Book | null | 'new'>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const remove = async (id: string) => {
    setBusy(id)
    setActionError(null)
    try {
      await bookService.deleteBook(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cartea nu a putut fi ștearsă.')
      setBusy(null)
      return
    }
    setBusy(null)
    await onRefresh()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {books.length} titluri în catalog
        </p>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5"
        >
          <IconPlus className="h-4 w-4" />
          Adaugă carte
        </button>
      </div>

      {actionError && (
        <div className="mb-6 rounded border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood" role="alert">
          <p className="font-medium">Operațiunea nu a putut fi finalizată.</p>
          <p className="mt-1 text-oxblood/80">{actionError}</p>
        </div>
      )}

      <div className="overflow-x-auto border border-ink/10">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-paper-200/50 text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">Titlu</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Preț</th>
              <th className="px-4 py-3">Stoc</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {books.map((b) => (
              <tr key={b.id} className="text-sm text-ink">
                <td className="px-4 py-3 font-serif">{b.title}</td>
                <td className="px-4 py-3 text-ink-light">{b.author}</td>
                <td className="px-4 py-3">{formatPrice(b.price)}</td>
                <td className="px-4 py-3">{b.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      b.status === 'active' ? 'text-oxblood' : 'text-ink-muted'
                    }`}
                  >
                    <IconCheck className="h-4 w-4" />
                    {b.status === 'active' ? 'Publicată' : 'Ciornă'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(b)}
                      className="inline-flex items-center gap-1 text-ink-muted transition-colors hover:text-ink"
                      aria-label={`Editează ${b.title}`}
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(b.id)}
                      disabled={busy === b.id}
                      className="inline-flex items-center gap-1 text-oxblood transition-opacity disabled:opacity-40"
                      aria-label={`Șterge ${b.title}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  Catalogul este gol.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing === 'new' ? (
        <BookFormModal book={null} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onRefresh() }} />
      ) : editing ? (
        <BookFormModal book={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onRefresh() }} />
      ) : null}
    </div>
  )
}


function OrdersTab({ orders }: { orders: OrderDraft[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-ink-muted">Nu există comenzi înregistrate.</p>
  }

  return (
    <div className="max-w-3xl">
      <ul className="divide-y divide-ink/10 border border-ink/10">
        {orders.map((o) => (
          <li key={o.id} className="px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-lg text-ink">{o.reference}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(o.createdAt).toLocaleDateString('ro-RO')} · {o.shipping.fullName}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-serif text-lg text-ink">{formatPrice(o.subtotal)}</span>
                <span className="rounded-full border border-ink/15 px-3 py-1 text-xs uppercase tracking-wider text-ink-muted">
                  {orderStatusLabels[o.status]}
                </span>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm text-ink-light">
              {o.lines.map((line) => (
                <li key={`${line.bookId}-${line.title}`}>
                  {line.title} × {line.quantity}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SettingsTab() {
  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem('libraria.settings-email') ?? 'bună@libraria.ro'
    } catch {
      return 'bună@libraria.ro'
    }
  })
  const [saved, setSaved] = useState(false)

  const save = () => {
    try {
      window.localStorage.setItem('libraria.settings-email', email)
    } catch {
      // ignore
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="max-w-md">
      <p className="mb-6 text-sm text-ink-muted">
        Setările de mai jos sunt demonstrative și se păstrează doar în acest
        browser.
      </p>
      <div className="flex flex-col gap-4">
        <FormField label="Email de contact" htmlFor="set-email">
          <input id="set-email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button type="button" onClick={save} className="btn btn-primary px-6 py-3">
          Salvează setările
        </button>
        {saved && <span className="text-sm text-oxblood">Salvate.</span>}
      </div>
    </div>
  )
}

