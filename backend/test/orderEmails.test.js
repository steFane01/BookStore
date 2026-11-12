import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCustomerEmail,
  buildOwnerEmail,
  buildStatusEmail,
} from '../src/routes/orders.js'

const lines = [
  {
    title: 'Cartea <Nouă>',
    author: 'Ana Autor',
    price: 42.5,
    quantity: 2,
    variantName: 'Ediția a II-a',
  },
]

const shipping = {
  fullName: 'Ion <Pop>',
  email: 'ion@example.com',
  phone: '0700 000 000',
  street: 'Str. Librăriei',
  number: '12',
  block: '',
  staircase: '',
  floor: '',
  apartment: '',
  locality: 'Cluj-Napoca',
  county: 'Cluj',
  postalCode: '400001',
  notes: 'Sună înainte de livrare',
}

const base = {
  brand: 'RV STUDIO',
  reference: 'RV-1001',
  lines,
  shipping,
  subtotal: 85,
  shippingCost: 19,
  total: 104,
}

test('owner email uses the shared shell and escapes customer data', () => {
  const { html, text } = buildOwnerEmail({
    ...base,
    createdAt: '2026-01-05T10:00:00Z',
    deliveryMethod: 'courier',
    pickupPoint: null,
    adminUrl: 'https://rvstudio.ro/admin',
  })

  assert.ok(html.includes('RV STUDIO &middot; Comandă nouă'))
  assert.ok(html.includes('Comanda RV-1001'))
  assert.ok(html.includes('background-color:#f5f0e6'))
  assert.ok(html.includes('href="https://rvstudio.ro/admin"'))
  assert.ok(html.includes('Cartea &lt;Nouă&gt;'))
  assert.ok(html.includes('Ion &lt;Pop&gt;'))
  assert.ok(!html.includes('Cartea <Nouă>'))
  assert.ok(html.includes('TOTAL: <strong>104.00 RON</strong>'))
  assert.ok(html.includes('Ediția a II-a'))
  assert.ok(html.includes('Sună înainte de livrare'))
  assert.ok(text.includes('Număr comandă: RV-1001'))
  assert.ok(text.includes('Ion <Pop>'))
})

test('owner email shows the locker details for pickup orders', () => {
  const { html, text } = buildOwnerEmail({
    ...base,
    createdAt: '2026-01-05T10:00:00Z',
    deliveryMethod: 'easybox',
    pickupPoint: { name: 'EasyBox <1>', address: 'Str. Locker 4' },
    adminUrl: 'https://rvstudio.ro/admin',
  })

  assert.ok(html.includes('Livrare — EasyBox'))
  assert.ok(html.includes('EasyBox &lt;1&gt;'))
  assert.ok(!html.includes('EasyBox <1>'))
  assert.ok(text.includes('Punct: EasyBox <1>'))
})

test('customer confirmation email has the tracking button and digital links', () => {
  const { html, text } = buildCustomerEmail({
    ...base,
    deliveryMethod: 'courier',
    pickupPoint: null,
    digitalLinks: [
      { title: 'Ghid <PDF>', url: 'https://rvstudio.ro/f/ghid.pdf', access: 'cod 123' },
    ],
  })

  assert.ok(html.includes('RV STUDIO &middot; Comandă confirmată'))
  assert.ok(html.includes('Comanda RV-1001'))
  assert.ok(html.includes('/urmarire-comanda'))
  assert.ok(html.includes('Urmărește comanda'))
  assert.ok(html.includes('Cartea &lt;Nouă&gt;'))
  assert.ok(html.includes('Produse digitale'))
  assert.ok(html.includes('Ghid &lt;PDF&gt;'))
  assert.ok(html.includes('https://rvstudio.ro/f/ghid.pdf'))
  assert.ok(html.includes('cod 123'))
  assert.ok(html.includes('Cluj-Napoca, Cluj, 400001'))
  assert.ok(text.includes('Comanda ta la RV STUDIO a fost înregistrată'))
  assert.ok(text.includes('Ghid <PDF>'))
})

test('status email uses the shared shell and the human status label', () => {
  const { html, text } = buildStatusEmail({
    brand: 'RV STUDIO',
    reference: 'RV-1001',
    status: 'shipped',
    shipping,
  })

  assert.ok(html.includes('RV STUDIO &middot; Comanda ta'))
  assert.ok(html.includes('RV-1001 — Expediată'))
  assert.ok(html.includes('a fost expediată'))
  assert.ok(html.includes('/urmarire-comanda'))
  assert.ok(html.includes('Ion &lt;Pop&gt;'))
  assert.ok(text.includes('Comanda RV-1001 are acum statusul: Expediată.'))
})
