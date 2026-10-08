import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { requireAuth, requireAdmin } from '../auth.js'
import { sendMail, getContactRecipient } from '../mailer.js'

export const ordersRouter = Router()

/** Loose email validator. */
function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Map an `orders` row + its `order_lines` rows into the frontend `OrderDraft`
 * JSON shape. Shipping columns are flattened in the DB (`ship_*`); we rebuild
 * the nested `shipping` object here so the UI can render it unchanged.
 */
function toOrder(row, lines) {
  return {
    id: row.id,
    reference: row.reference,
    lines: lines.map((l) => ({
      bookId: l.book_id,
      title: l.title,
      author: l.author,
      price: Number(l.price),
      quantity: l.quantity,
    })),
    shipping: {
      fullName: row.ship_full_name,
      email: row.ship_email,
      phone: row.ship_phone,
      county: row.ship_county,
      locality: row.ship_locality,
      street: row.ship_street,
      number: row.ship_number,
      block: row.ship_block ?? undefined,
      staircase: row.ship_staircase ?? undefined,
      floor: row.ship_floor ?? undefined,
      apartment: row.ship_apartment ?? undefined,
      postalCode: row.ship_postal_code ?? undefined,
      notes: row.ship_notes ?? undefined,
    },
    subtotal: Number(row.subtotal),
    payment: row.payment,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id,
  }
}

/** Load a full order (with lines) by id, or null when missing. */
async function fetchOrderWithLines(id) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
  if (rows.length === 0) return null
  const lines = await pool.query(
    'SELECT book_id, title, author, price, quantity FROM order_lines WHERE order_id = $1 ORDER BY id',
    [id],
  )
  return toOrder(rows[0], lines.rows)
}

/**
 * Build the plain-text + HTML body of the "new order needs a courier" email sent
 * to the owner. Carries the exact delivery details.
 */
function buildOwnerEmail({ reference, createdAt, lines, shipping, subtotal }) {
  const linesText = lines
    .map((l) => `- ${l.title} (${l.author}) x${l.quantity} — ${l.price} RON`)
    .join('\n')
  const addressLine = [
    `${shipping.street} nr. ${shipping.number}`,
    shipping.block ? `Bl. ${shipping.block}` : '',
    shipping.apartment ? `Ap. ${shipping.apartment}` : '',
    shipping.floor ? `Et. ${shipping.floor}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const text =
    `Ai primit o comandă nouă care trebuie transmisă către firma de curierat.\n\n` +
    `Număr comandă: ${reference}\n` +
    `Data: ${new Date(createdAt).toLocaleString('ro-RO')}\n\n` +
    `== Cărți ==\n${linesText}\n` +
    `Subtotal: ${subtotal.toFixed(2)} RON\n\n` +
    `== Date de livrare ==\n` +
    `Nume: ${shipping.fullName}\n` +
    `Email: ${shipping.email}\n` +
    `Telefon: ${shipping.phone}\n` +
    `Adresă: ${addressLine}\n` +
    `${shipping.locality}, ${shipping.county}${shipping.postalCode ? `, ${shipping.postalCode}` : ''}\n` +
    (shipping.notes ? `Observații: ${shipping.notes}\n` : '') +
    `\nContactează clientul pentru a stabili livrarea. Echipa Librăria.`

  const html =
    `<p><strong>Ai primit o comandă nouă</strong> pe care trebuie să o transmiți ` +
    `către firma de curierat.</p>` +
    `<p style="color:#642A2E;font-size:1.15em"><strong>${reference}</strong></p>` +
    `<table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse">` +
    `<tr style="background:#f4f1ea"><th align="left">Carte</th><th align="right">Cant.</th><th align="right">Preț</th></tr>` +
    lines
      .map(
        (l) =>
          `<tr><td>${String(l.title).replace(/</g, '&lt;')} (${String(l.author).replace(/</g, '&lt;')})</td>` +
          `<td align="right">${l.quantity}</td><td align="right">${Number(l.price).toFixed(2)} RON</td></tr>`,
      )
      .join('') +
    `<tr><td colspan="2"><strong>Subtotal</strong></td>` +
    `<td align="right"><strong>${subtotal.toFixed(2)} RON</strong></td></tr>` +
    `</table>` +
    `<h3>Date de livrare</h3>` +
    `<p>Nume: <strong>${shipping.fullName}</strong><br/>` +
    `Email: ${shipping.email}<br/>` +
    `Telefon: ${shipping.phone}</p>` +
    `<p>Adresă: ${addressLine}<br/>${shipping.locality}, ${shipping.county}${shipping.postalCode ? `, ${shipping.postalCode}` : ''}</p>` +
    (shipping.notes ? `<p>Observații: ${shipping.notes}</p>` : '') +
    `<p>Contactează clientul pentru a stabili livrarea.</p>` +
    `<p style="color:#642A2E">Cu drag, echipa Librăria.</p>`

  return { text, html }
}

/**
 * POST /api/orders
 *
 * Records a new order inside a single transaction so the reference and the order
 * lines land atomically (all-or-nothing). No online payment (by design). After
 * committing, it emails the EXACT delivery details to the owner's mailbox (the
 * same inbox that receives contact messages), because the owner arranges the
 * courier directly.
 *
 * Body: { lines: OrderLine[], shipping: ShippingAddress, userId?: string }
 */
ordersRouter.post('/', async (req, res) => {
  const { lines, shipping } = req.body || {}
  const userId = req.body?.userId || null

  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(422).json({ error: 'Coșul nu poate fi gol.' })
  }
  if (!shipping || typeof shipping !== 'object') {
    return res.status(422).json({ error: 'Datele de livrare sunt obligatorii.' })
  }

  const fullName = String(shipping.fullName || '').trim()
  const email = String(shipping.email || '').trim()
  const phone = String(shipping.phone || '').trim()
  const county = String(shipping.county || '').trim()
  const locality = String(shipping.locality || '').trim()
  const street = String(shipping.street || '').trim()
  const number = String(shipping.number || '').trim()

  if (!fullName || !isEmail(email) || !phone || !county || !locality || !street || !number) {
    return res.status(422).json({ error: 'Completează toate câmpurile obligatorii de livrare.' })
  }

  let subtotal = 0
  for (const l of lines) {
    const price = Number(l.price)
    const qty = Number(l.quantity)
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty <= 0) {
      return res.status(422).json({ error: 'Linia de comandă este invalidă.' })
    }
    subtotal += price * qty
  }

  const shipObj = {
    fullName,
    email,
    phone: phone || null,
    county,
    locality,
    street,
    number,
    block: String(shipping.block ?? '').trim() || null,
    staircase: String(shipping.staircase ?? '').trim() || null,
    floor: String(shipping.floor ?? '').trim() || null,
    apartment: String(shipping.apartment ?? '').trim() || null,
    postalCode: String(shipping.postalCode ?? '').trim() || null,
    notes: String(shipping.notes ?? '').trim() || null,
  }

  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // Only link user_id when it matches a real account, so a non-UUID/demo id
    // can never break the foreign-key constraint.
    let ownerId = userId || null
    if (ownerId) {
      const existing = await client.query('SELECT id FROM users WHERE id = $1', [ownerId])
      if (existing.rowCount === 0) ownerId = null
    }

    // Atomic reference derived from a freshly generated UUID, so `id` and
    // `reference` are inherently unique — no retry loop or race to worry about.
    const orderId = crypto.randomUUID()
    const reference = `LB-${new Date().getFullYear()}-${orderId.slice(0, 6).toUpperCase()}`

    const ins = await client.query(
      `INSERT INTO orders (id, reference, user_id, status, subtotal,
         ship_full_name, ship_email, ship_phone, ship_county, ship_locality,
         ship_street, ship_number, ship_block, ship_staircase, ship_floor,
         ship_apartment, ship_postal_code, ship_notes)
       VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id, created_at`,
      [
        orderId,
        reference,
        ownerId,
        subtotal,
        shipObj.fullName,
        shipObj.email,
        shipObj.phone,
        shipObj.county,
        shipObj.locality,
        shipObj.street,
        shipObj.number,
        shipObj.block,
        shipObj.staircase,
        shipObj.floor,
        shipObj.apartment,
        shipObj.postalCode,
        shipObj.notes,
      ],
    )

    for (const l of lines) {
      await client.query(
        `INSERT INTO order_lines (order_id, book_id, title, author, price, quantity)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, l.bookId || null, String(l.title), String(l.author), Number(l.price), Number(l.quantity)],
      )
    }

    await client.query('COMMIT')

    // Re-read the committed order from the DB so the response always mirrors
    // exactly what is persisted (nested `shipping`, `userId`, `lines`, ...) —
    // identical to what GET /api/orders/:id returns later.
    const draft = await fetchOrderWithLines(orderId)

    // ---- Notify the owner with the exact delivery details (for the courier). ----
    const owner = getContactRecipient()
    if (owner) {
      const { text, html } = buildOwnerEmail({
        reference,
        createdAt: draft.createdAt,
        lines: draft.lines,
        shipping: draft.shipping,
        subtotal,
      })
      try {
        await sendMail({
          to: owner,
          subject: `Comandă nouă ${reference} — de trimis prin curier`,
          text,
          html,
        })
      } catch (mailErr) {
        // Non-fatal — the order is already recorded.
        console.warn('[libraria] order email to owner skipped:', mailErr.message)
      }
    }

    return res.status(201).json(draft)
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    return res.status(500).json({ error: err.message })
  } finally {
    if (client) client.release()
  }
})

/**
 * GET /api/orders
 * Return the current user's orders (newest first).
 */
ordersRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [_req.user.id],
    )
    const orders = []
    for (const row of rows) {
      orders.push(await fetchOrderWithLines(row.id))
    }
    return res.json(orders)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/orders/all
 * Return every order (admin only), newest first.
 */
ordersRouter.get('/all', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM orders ORDER BY created_at DESC')
    const orders = []
    for (const row of rows) {
      orders.push(await fetchOrderWithLines(row.id))
    }
    return res.json(orders)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/orders/:id
 * Return a single order (by id or reference). Customers may only read their
 * own orders; admins may read any.
 */
ordersRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id::text = $1 OR reference = $1',
      [req.params.id],
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Comanda nu a fost găsită.' })
    }
    const order = rows[0]
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acces interzis.' })
    }
    const orderData = await fetchOrderWithLines(order.id)
    return res.json(orderData)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})