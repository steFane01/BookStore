import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CustomerAddress, OrderDraft } from '../types'
import { useAuth } from '../context/AuthContext'
import { orderService } from '../services/orderService'
import { addressService } from '../services/addressService'
import { FormField } from '../components/FormField'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { orderStatusLabels } from '../services/authService'
import { formatPrice } from '../utils/format'

type Tab = 'profile' | 'addresses' | 'orders'

export default function Account() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()

  const [tab, setTab] = useState<Tab>('profile')
  const [orders, setOrders] = useState<OrderDraft[]>([])
  const [name, setName] = useState('')
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/autentificare', { replace: true })
      return
    }
    setName(user?.name ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    let active = true
    orderService.getOrders(user.id).then((data) => {
      if (active) setOrders(data)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    let active = true
    addressService.list(user.id).then((data) => {
      if (active) setAddresses(data)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  if (!isAuthenticated || !user) {
    return null
  }

  const saveProfile = () => {
    setSaving(true)
    setSaved(false)
    // Mock: only the book/admin services mutate data; here we reflect the UI state.
    window.setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 400)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profil' },
    { key: 'addresses', label: 'Adrese' },
    { key: 'orders', label: 'Comenzile mele' },
  ]

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page py-12">
        <SectionHeading
          eyebrow="Contul tău"
          title={user.name}
          description={user.email}
        />

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                tab === t.key
                  ? 'bg-ink text-paper-50'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {tab === 'profile' && (
            <ProfileTab
              name={name}
              email={user.email}
              onNameChange={setName}
              onSave={saveProfile}
              saving={saving}
              saved={saved}
              isAdmin={isAdmin}
            />
          )}
          {tab === 'addresses' && (
            <AddressesTab
              userId={user.id}
              addresses={addresses}
              setAddresses={setAddresses}
            />
          )}
          {tab === 'orders' && <OrdersTab orders={orders} />}
        </div>
      </AnimatedSection>
    </div>
  )
}

function ProfileTab({
  name,
  email,
  onNameChange,
  onSave,
  saving,
  saved,
  isAdmin,
}: {
  name: string
  email: string
  onNameChange: (v: string) => void
  onSave: () => void
  saving: boolean
  saved: boolean
  isAdmin: boolean
}) {
  return (
    <div className="max-w-md">
      <div className="flex flex-col gap-4">
        <FormField label="Nume complet" htmlFor="acc-name">
          <input
            id="acc-name"
            className="field"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </FormField>
        <FormField label="Email" htmlFor="acc-email">
          <input id="acc-email" className="field" value={email} disabled />
        </FormField>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn btn-primary px-6 py-3 disabled:opacity-60"
        >
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
        {saved && <span className="text-sm text-oxblood">Profilul a fost salvat.</span>}
      </div>
      {isAdmin && (
        <p className="mt-8 border border-brass/40 bg-brass/5 px-5 py-4 text-sm text-ink">
          Ai rol de administrator. Poți gestiona catalogul din{' '}
          <a href="/admin" className="text-brass-dark underline underline-offset-2">
            panoul de administrare
          </a>
          .
        </p>
      )}
    </div>
  )
}


function AddressesTab({
  userId,
  addresses,
  setAddresses,
}: {
  userId: string
  addresses: CustomerAddress[]
  setAddresses: React.Dispatch<React.SetStateAction<CustomerAddress[]>>
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [label, setLabel] = useState('')
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [county, setCounty] = useState('')
  const [locality, setLocality] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [block, setBlock] = useState('')
  const [staircase, setStaircase] = useState('')
  const [floor, setFloor] = useState('')
  const [apartment, setApartment] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setLabel('')
    setRecipient('')
    setPhone('')
    setCounty('')
    setLocality('')
    setStreet('')
    setNumber('')
    setBlock('')
    setStaircase('')
    setFloor('')
    setApartment('')
    setPostalCode('')
  }

  const startEdit = (a: CustomerAddress) => {
    setEditingId(a.id)
    setLabel(a.label)
    setRecipient(a.recipient)
    setPhone(a.phone)
    setCounty(a.address.county)
    setLocality(a.address.locality)
    setStreet(a.address.street)
    setNumber(a.address.number)
    setBlock(a.address.block ?? '')
    setStaircase(a.address.staircase ?? '')
    setFloor(a.address.floor ?? '')
    setApartment(a.address.apartment ?? '')
    setPostalCode(a.address.postalCode ?? '')
    setShowForm(true)
  }

  const formData = () => {
    const data: Parameters<typeof addressService.create>[1] = {
      label: label ? label.trim() : undefined,
      recipient: recipient.trim(),
      phone: phone.trim(),
      address: {
        county,
        locality,
        street,
        number,
        block: block || undefined,
        staircase: staircase || undefined,
        floor: floor || undefined,
        apartment: apartment || undefined,
        postalCode: postalCode || undefined,
      },
    }
    return data
  }

  const saveAddress = async () => {
    if (!recipient.trim() || !county.trim() || !locality.trim() || !street.trim() || !number.trim()) {
      return
    }
    setBusy(true)
    try {
      if (editingId) {
        const updated = await addressService.update(userId, editingId, formData())
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      } else {
        const created = await addressService.create(userId, formData())
        setAddresses((prev) => [...prev, created])
      }
      setShowForm(false)
      resetForm()
    } finally {
      setBusy(false)
    }
  }

  const removeAddress = async (id: string) => {
    const previous = addresses
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    try {
      await addressService.remove(userId, id)
    } catch (err) {
      setAddresses(previous)
      alert(err instanceof Error ? err.message : 'Nu am putut șterge adresa.')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Adrese salvate pentru livrări mai rapide.</p>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false)
              resetForm()
            } else {
              resetForm()
              setShowForm(true)
            }
          }}
          className="btn btn-outline px-4 py-2 text-sm"
        >
          {showForm ? 'Anulează' : '+ Adaugă adresă'}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 grid gap-4 border border-ink/10 bg-paper-50 p-6 sm:grid-cols-2">
          <FormField label="Etichetă (ex. Acasă)" htmlFor="addr-label">
            <input id="addr-label" className="field" value={label} onChange={(e) => setLabel(e.target.value)} />
          </FormField>
          <FormField label="Destinatar" htmlFor="addr-recipient" required>
            <input id="addr-recipient" className="field" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </FormField>
          <FormField label="Telefon" htmlFor="addr-phone" required>
            <input id="addr-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Județ" htmlFor="addr-county" required>
            <input id="addr-county" className="field" value={county} onChange={(e) => setCounty(e.target.value)} />
          </FormField>
          <FormField label="Localitate" htmlFor="addr-locality" required>
            <input id="addr-locality" className="field" value={locality} onChange={(e) => setLocality(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <FormField label="Stradă" htmlFor="addr-street" required>
              <input id="addr-street" className="field" value={street} onChange={(e) => setStreet(e.target.value)} />
            </FormField>
            <FormField label="Nr." htmlFor="addr-number" required>
              <input id="addr-number" className="field" value={number} onChange={(e) => setNumber(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Bloc" htmlFor="addr-block">
            <input id="addr-block" className="field" value={block} onChange={(e) => setBlock(e.target.value)} />
          </FormField>
          <FormField label="Scară" htmlFor="addr-staircase">
            <input id="addr-staircase" className="field" value={staircase} onChange={(e) => setStaircase(e.target.value)} />
          </FormField>
          <FormField label="Etaj" htmlFor="addr-floor">
            <input id="addr-floor" className="field" value={floor} onChange={(e) => setFloor(e.target.value)} />
          </FormField>
          <FormField label="Apartament" htmlFor="addr-apartment">
            <input id="addr-apartment" className="field" value={apartment} onChange={(e) => setApartment(e.target.value)} />
          </FormField>
          <FormField label="Cod poștal" htmlFor="addr-postal">
            <input id="addr-postal" className="field" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={saveAddress}
              disabled={busy}
              className="btn btn-primary w-full px-6 py-3 disabled:opacity-60"
            >
              {busy ? 'Se salvează…' : editingId ? 'Salvează modificările' : 'Salvează adresa'}
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">
          Nu ai încă adrese salvate. Adaugă-ți adresa preferată pentru o livrare mai rapidă.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-ink/10 border border-ink/10">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="text-sm text-ink">
                <p className="font-medium">{a.label}</p>
                <p>{a.recipient}</p>
                <p className="text-ink-muted">
                  {a.address.street} nr. {a.address.number}
                  {a.address.block ? `, Bl. ${a.address.block}` : ''}
                  {a.address.apartment ? `, Ap. ${a.address.apartment}` : ''},{' '}
                  {a.address.locality}, {a.address.county}
                  {a.address.postalCode ? `, ${a.address.postalCode}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => removeAddress(a.id)}
                  className="text-sm text-oxblood underline-offset-2 hover:underline"
                >
                  Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


function OrdersTab({ orders }: { orders: OrderDraft[] }) {
  if (orders.length === 0) {
    return (
      <p className="max-w-md text-sm text-ink-muted">
        Nu ai încă nicio comandă înregistrată.
      </p>
    )
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
                  {new Date(o.createdAt).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full border border-ink/15 px-3 py-1 text-xs uppercase tracking-wider text-ink-muted">
                  {orderStatusLabels[o.status]}
                </span>
                <p className="mt-2 font-serif text-xl text-ink">{formatPrice(o.subtotal)}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 border-t border-ink/10 pt-3 text-sm text-ink-light">
              {o.lines.map((line) => (
                <li key={`${line.bookId}-${line.title}`} className="flex justify-between">
                  <span>
                    {line.title} <span className="text-ink-muted">× {line.quantity}</span>
                  </span>
                  <span>{formatPrice(line.price * line.quantity)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

