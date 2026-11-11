import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { optionalAuth, requireAdmin, requireAuth } from '../auth.js'
import { sendMail, getContactRecipient } from '../mailer.js'
import { getPublicUrl } from '../config.js'
import { findLocker } from '../sameday.js'
import { getSiteName, getShippingFees } from '../settings.js'
import { ApiError, serverError } from '../lib/errors.js'
import { cleanString, escapeHtml, isEmail } from '../lib/text.js'
import { computeOrderTotals, resolveOrderLines } from '../lib/pricing.js'

export const ordersRouter = Router()

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export const ORDER_STATUS_LABELS = {
  pending: 'În așteptare',
  processing: 'În procesare',
  shipped: 'Expediată',
  delivered: 'Livrată',
  cancelled: 'Anulată',
}

/**
 * Map an `orders` row + its `order_lines` rows into the frontend `OrderDraft`
 * JSON shape. Shipping columns are flattened in the DB (`ship_*`); we rebuild
 * the nested `shipping` object here so the UI can render it unchanged.
 */
function toOrder(row, lines, { admin = false } = {}) {
  return {
    id: row.id,
    reference: row.reference,
    lines: lines.map((line) => ({
      bookId: line.book_id,
      title: line.title,
      author: line.author,
      price: Number(line.price),
      quantity: line.quantity,
      variantName: line.variant_name ?? undefined,
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
    shippingCost: row.shipping_cost != null ? Number(row.shipping_cost) : 0,
    total: row.total != null ? Number(row.total) : Number(row.subtotal),
    deliveryMethod: row.delivery_method || 'courier',
    // Pickup point (EasyBox or FANbox): name + exact locker address.
    pickupPoint: row.easybox_name
      ? { name: row.easybox_name, address: row.easybox_address ?? '' }
      : undefined,
    // Kept for backwards compatibility with older clients.
    easybox: row.easybox_name
      ? { name: row.easybox_name, address: row.easybox_address ?? '' }
      : undefined,
    payment: row.payment ?? null,
    status: row.status,
    ...(admin ? { adminNote: row.admin_note ?? undefined } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    userId: row.user_id,
  }
}

/** Load a full order (with lines) by id, or null when missing. */
async function fetchOrderWithLines(id, options = {}) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
  if (rows.length === 0) return null
  const lines = await pool.query(
    'SELECT book_id, title, author, price, quantity, variant_name FROM order_lines WHERE order_id = $1 ORDER BY id',
    [id],
  )
  return toOrder(rows[0], lines.rows, options)
}

/** Make a stored file path clickable from an email. */
function absoluteUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${getPublicUrl()}${url.startsWith('/') ? '' : '/'}${url}`
}

/** Human-readable address block for courier delivery. */
function addressLines(shipping) {
  const first = [`${shipping.street} nr. ${shipping.number}`]
  if (shipping.block) first.push(`Bl. ${shipping.block}`)
  if (shipping.staircase) first.push(`Sc. ${shipping.staircase}`)
  if (shipping.floor) first.push(`Et. ${shipping.floor}`)
  if (shipping.apartment) first.push(`Ap. ${shipping.apartment}`)
  return [
    first.filter(Boolean).join(', '),
    `${shipping.locality}, ${shipping.county}${shipping.postalCode ? `, ${shipping.postalCode}` : ''}`,
  ]
}

/** Render one order line for the plain-text email body. */
function lineText(line) {
  const variant = line.variantName ? ` [${line.variantName}]` : ''
  return `- ${line.title}${variant} (${line.author}) x${line.quantity} — ${Number(line.price).toFixed(2)} RON`
}

/** HTML table with the ordered products. */
function linesTable(lines) {
  return (
    `<table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse">` +
    `<tr style="background:#f4f1ea"><th align="left">Produs</th><th align="right">Cant.</th>` +
    `<th align="right">Preț</th></tr>` +
    lines
      .map(
        (line) =>
          `<tr><td>${escapeHtml(line.title)}${line.variantName ? ` <em>(${escapeHtml(line.variantName)})</em>` : ''}` +
          ` (${escapeHtml(line.author)})</td><td align="right">${line.quantity}</td>` +
          `<td align="right">${(Number(line.price) * line.quantity).toFixed(2)} RON</td></tr>`,
      )
      .join('') +
    `</table>`
  )
}

/** Totals rows shared by both emails. */
function totalsRowsHtml(subtotal, shippingCost, total) {
  return (
    `<p style="margin:0">Subtotal: <strong>${subtotal.toFixed(2)} RON</strong><br/>` +
    `Transport: ${Number(shippingCost || 0).toFixed(2)} RON<br/>` +
    `TOTAL: <strong>${Number(total || subtotal).toFixed(2)} RON</strong></p>`
  )
}

/** Human-readable label for a pickup-point delivery method. */
function pickupLabel(deliveryMethod) {
  return deliveryMethod === 'fanbox' ? 'FANbox' : 'EasyBox'
}

/** Email to the owner: everything needed to place the shipment manually. */
function buildOwnerEmail({ brand, reference, createdAt, lines, shipping, subtotal, deliveryMethod, pickupPoint, shippingCost, total, adminUrl }) {
  const isPickup = deliveryMethod === 'easybox' || deliveryMethod === 'fanbox'
  const address = addressLines(shipping)
  const notes = shipping.notes ? `Observații: ${shipping.notes}\n` : ''
  const deliveryText = isPickup
    ? `== Livrare: ${pickupLabel(deliveryMethod)} ==\nPunct: ${pickupPoint?.name ?? '—'}\nAdresă locker: ${pickupPoint?.address ?? '—'}\nDestinatar: ${shipping.fullName}\nTelefon: ${shipping.phone}\n` +
      `Plată: card la locker (ramburs posibil)\n${notes}`
    : `== Livrare: curier la adresă ==\nNume: ${shipping.fullName}\nEmail: ${shipping.email}\nTelefon: ${shipping.phone}\nAdresă: ${address.join(', ')}\n${notes}`

  const text =
    `Ai primit o comandă nouă pe ${brand}.\n\n` +
    `Număr comandă: ${reference}\n` +
    `Data: ${new Date(createdAt).toLocaleString('ro-RO')}\n\n` +
    `== Produse ==\n${lines.map(lineText).join('\n')}\n` +
    `Subtotal: ${subtotal.toFixed(2)} RON\n` +
    `Transport: ${Number(shippingCost || 0).toFixed(2)} RON\n` +
    `TOTAL: ${Number(total || subtotal).toFixed(2)} RON\n\n` +
    `${deliveryText}\n` +
    `Gestionează comanda: ${adminUrl}\n\n` +
    `Echipa ${brand}.`

  const html =
    `<p><strong>Ai primit o comandă nouă</strong> pe ${escapeHtml(brand)}.</p>` +
    `<p style="color:#642A2E;font-size:1.15em"><strong>${escapeHtml(reference)}</strong></p>` +
    `<p>Data: ${escapeHtml(new Date(createdAt).toLocaleString('ro-RO'))}</p>` +
    linesTable(lines) +
    totalsRowsHtml(subtotal, shippingCost, total) +
    (isPickup
      ? `<h3>Livrare — ${pickupLabel(deliveryMethod)}</h3><p>Punct: <strong>${escapeHtml(pickupPoint?.name ?? '—')}</strong><br/>` +
        `Adresă locker: ${escapeHtml(pickupPoint?.address ?? '—')}<br/>` +
        `Destinatar: ${escapeHtml(shipping.fullName)}<br/>Telefon: ${escapeHtml(shipping.phone)}<br/>` +
        `Plată: card la locker (ramburs posibil)</p>`
      : `<h3>Livrare — curier la adresă</h3><p>Nume: <strong>${escapeHtml(shipping.fullName)}</strong><br/>` +
        `Email: ${escapeHtml(shipping.email)}<br/>Telefon: ${escapeHtml(shipping.phone)}<br/>` +
        `Adresă: ${escapeHtml(address.join(', '))}</p>`) +
    (shipping.notes ? `<p>Observații: ${escapeHtml(shipping.notes)}</p>` : '') +
    `<p><a href="${escapeHtml(adminUrl)}">Deschide panoul de administrare</a></p>` +
    `<p style="color:#642A2E">Echipa ${escapeHtml(brand)}.</p>`

  return { text, html }
}

/** Confirmation email to the customer (with download links for digital items). */
function buildCustomerEmail({ brand, reference, lines, shipping, subtotal, deliveryMethod, pickupPoint, shippingCost, total, digitalLinks }) {
  const isPickup = deliveryMethod === 'easybox' || deliveryMethod === 'fanbox'
  const address = addressLines(shipping)
  const paymentNote = isPickup
    ? `Plata se face cu cardul la locker, la ridicarea coletului. Poți alege și ramburs la locker.\n`
    : `Nu se plătește nimic online — te contactăm pentru confirmare și livrare.\n`
  const digitalText = digitalLinks.length
    ? `\n== Produse digitale ==\n` +
      digitalLinks
        .map((link) => `- ${link.title}: ${link.url}${link.access ? ` (${link.access})` : ''}`)
        .join('\n') +
      '\n'
    : ''

  const text =
    `Salut, ${shipping.fullName}!\n\n` +
    `Comanda ta la ${brand} a fost înregistrată cu numărul ${reference}.\n` +
    paymentNote +
    `\n== Produse ==\n${lines.map(lineText).join('\n')}\n` +
    `Subtotal: ${subtotal.toFixed(2)} RON\n` +
    `Transport: ${Number(shippingCost || 0).toFixed(2)} RON\n` +
    `TOTAL: ${Number(total || subtotal).toFixed(2)} RON\n\n` +
    (isPickup
      ? `Livrare la ${pickupLabel(deliveryMethod)}: ${pickupPoint?.name ?? '—'} (${pickupPoint?.address ?? '—'})\nDestinatar: ${shipping.fullName}, ${shipping.phone}\n`
      : `Livrare la adresă: ${address.join(', ')}\n`) +
    digitalText +
    `\nCu drag, echipa ${brand}.`

  const html =
    `<p>Salut, <strong>${escapeHtml(shipping.fullName)}</strong>!</p>` +
    `<p>Comanda ta la <strong>${escapeHtml(brand)}</strong> a fost înregistrată cu numărul ` +
    `<strong>${escapeHtml(reference)}</strong>.</p>` +
    `<p>${escapeHtml(paymentNote.trim())}</p>` +
    linesTable(lines) +
    totalsRowsHtml(subtotal, shippingCost, total) +
    (isPickup
      ? `<h3>Livrare — ${pickupLabel(deliveryMethod)}</h3><p>${escapeHtml(pickupPoint?.name ?? '—')}<br/>${escapeHtml(pickupPoint?.address ?? '—')}<br/>` +
        `Destinatar: ${escapeHtml(shipping.fullName)}, ${escapeHtml(shipping.phone)}</p>`
      : `<h3>Livrare</h3><p>${escapeHtml(address.join(', '))}</p>`) +
    (digitalLinks.length
      ? `<h3>Produse digitale</h3><ul>` +
        digitalLinks
          .map(
            (link) =>
              `<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.title)}</a>` +
              (link.access ? `<br/><small>${escapeHtml(link.access)}</small>` : '') +
              `</li>`,
          )
          .join('') +
        `</ul>`
      : '') +
    `<p style="color:#642A2E">Cu drag, echipa ${escapeHtml(brand)}.</p>`

  return { text, html }
}

/** Email sent to the customer when the owner changes the order status. */
function buildStatusEmail({ brand, reference, status, shipping }) {
  const label = ORDER_STATUS_LABELS[status] || status
  const detail = {
    processing: 'Comanda ta este pregătită și urmează să fie expediată.',
    shipped: 'Comanda ta a fost expediată. Curierul te va contacta pentru livrare.',
    delivered: 'Comanda ta a fost livrată. Îți mulțumim că ai cumpărat de la noi!',
    cancelled: 'Comanda ta a fost anulată. Dacă ai întrebări, scrie-ne.',
    pending: 'Comanda ta este în așteptare.',
  }[status] || ''
  const text =
    `Salut, ${shipping.fullName}!\n\n` +
    `Comanda ${reference} are acum statusul: ${label}.\n` +
    (detail ? `${detail}\n` : '') +
    `\nCu drag, echipa ${brand}.`
  const html =
    `<p>Salut, <strong>${escapeHtml(shipping.fullName)}</strong>!</p>` +
    `<p>Comanda <strong>${escapeHtml(reference)}</strong> are acum statusul:` +
    ` <strong>${escapeHtml(label)}</strong>.</p>` +
    (detail ? `<p>${escapeHtml(detail)}</p>` : '') +
    `<p style="color:#642A2E">Cu drag, echipa ${escapeHtml(brand)}.</p>`
  return { text, html }
}

/**
 * POST /api/orders
 *
 * Create an order. The cart comes from the browser, but prices, stock and
 * product identity are resolved from the database, stock is decremented inside
 * the same transaction, and the owner + customer receive the delivery details.
 * Guests may check out; a valid session links the order to the account.
 */
ordersRouter.post('/', optionalAuth, async (req, res) => {
  const rawLines = Array.isArray(req.body?.lines) ? req.body.lines : []
  const shipping = req.body?.shipping && typeof req.body.shipping === 'object' ? req.body.shipping : null
  const requestedMethod = req.body?.deliveryMethod
  const deliveryMethod =
    requestedMethod === 'easybox' || requestedMethod === 'fanbox' ? requestedMethod : 'courier'
  const pickupName = cleanString(req.body?.pickupName ?? req.body?.fanboxName, 160)
  const pickupAddress = cleanString(req.body?.pickupAddress ?? req.body?.fanboxAddress, 300)
  // Legacy: older clients sent the SameDay locker id instead of free text.
  const easyboxId = cleanString(req.body?.easyboxId, 120)

  if (!shipping) {
    return res.status(422).json({ error: 'Datele de livrare sunt obligatorii.' })
  }
  const fullName = cleanString(shipping.fullName, 160)
  const email = cleanString(shipping.email, 200).toLowerCase()
  const phone = cleanString(shipping.phone, 40)
  if (!fullName || !isEmail(email) || !phone) {
    return res.status(422).json({ error: 'Completează numele, emailul și telefonul.' })
  }

  let pickupPoint = null
  if (deliveryMethod === 'easybox' || deliveryMethod === 'fanbox') {
    const label = deliveryMethod === 'fanbox' ? 'FANbox' : 'EasyBox'
    if (pickupName && pickupAddress) {
      pickupPoint = { name: pickupName, address: pickupAddress }
    } else if (deliveryMethod === 'easybox' && easyboxId) {
      // Legacy clients: resolve the locker from the SameDay list.
      const locker = await findLocker(easyboxId).catch(() => null)
      if (locker) pickupPoint = { name: locker.name, address: locker.address }
    }
    if (!pickupPoint) {
      return res.status(422).json({
        error: `Completează numele lockerului ${label} și adresa exactă a acestuia.`,
      })
    }
  }

  try {
    // ---- Authoritative catalog lookup (never trust prices from the browser). ----
    const ids = [...new Set(rawLines.map((line) => String(line?.bookId ?? '').trim()).filter(Boolean))]
    const booksById = new Map()
    if (ids.length > 0) {
      const { rows } = await pool.query(
        `SELECT id, title, author, price, stock, product_type, variants, digital_file_url, digital_access
         FROM books WHERE id = ANY($1::text[])`,
        [ids],
      )
      for (const row of rows) booksById.set(row.id, row)
    }

    const { lines, errors } = resolveOrderLines(rawLines, booksById)
    if (errors.length > 0) {
      return res.status(422).json({ error: errors[0] })
    }

    const hasPhysical = lines.some((line) => line.productType === 'physical')
    const county = cleanString(shipping.county, 120)
    const locality = cleanString(shipping.locality, 120)
    const street = cleanString(shipping.street, 200)
    const number = cleanString(shipping.number, 40)
    if (hasPhysical && deliveryMethod === 'courier' && (!county || !locality || !street || !number)) {
      return res.status(422).json({ error: 'Completează toate câmpurile obligatorii de adresă.' })
    }

    const fees = await getShippingFees()
    const fee = fees[deliveryMethod] ?? fees.courier
    const { subtotal, shipping: shippingCost, total } = computeOrderTotals(
      lines,
      hasPhysical ? fee : 0,
    )

    const shipObj = {
      fullName,
      email,
      phone,
      county: county || null,
      locality: locality || null,
      street: street || null,
      number: number || null,
      block: cleanString(shipping.block, 40) || null,
      staircase: cleanString(shipping.staircase, 40) || null,
      floor: cleanString(shipping.floor, 40) || null,
      apartment: cleanString(shipping.apartment, 40) || null,
      postalCode: cleanString(shipping.postalCode, 20) || null,
      notes: cleanString(shipping.notes, 1000) || null,
    }

    let client
    let orderId
    let reference
    try {
      client = await pool.connect()
      await client.query('BEGIN')

      // Link the order to a real account only (guests stay anonymous).
      let ownerId = req.user?.id || null
      if (ownerId) {
        const existing = await client.query('SELECT id FROM users WHERE id = $1', [ownerId])
        if (existing.rowCount === 0) ownerId = null
      }

      // Reserve stock atomically. Variants with their own stock decrement that
      // variant; otherwise the product's base stock is used.
      for (const line of lines) {
        if (line.productType !== 'physical') continue
        const book = booksById.get(line.bookId)
        const variants = Array.isArray(book?.variants) ? book.variants : []
        const variant = line.variantId
          ? variants.find((item) => String(item.id) === String(line.variantId))
          : null
        const ownVariantStock = Boolean(variant && variant.stock != null)

        const result = ownVariantStock
          ? await client.query(
              `UPDATE books SET variants = (
                 SELECT jsonb_agg(
                   CASE WHEN elem->>'id' = $2
                     THEN jsonb_set(elem, '{stock}', to_jsonb(GREATEST(COALESCE((elem->>'stock')::int, 0) - $1::int, 0)))
                     ELSE elem END
                 ) FROM jsonb_array_elements(variants) AS elem
               )
               WHERE id = $3
                 AND EXISTS (
                   SELECT 1 FROM jsonb_array_elements(variants) AS e
                   WHERE e->>'id' = $2 AND COALESCE((e->>'stock')::int, 0) >= $1::int
                 )`,
              [line.quantity, line.variantId, line.bookId],
            )
          : await client.query(
              'UPDATE books SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
              [line.quantity, line.bookId],
            )
        if (result.rowCount === 0) {
          throw new ApiError(
            409,
            `Stocul pentru „${line.title}” s-a epuizat între timp. Reîncarcă pagina și încearcă din nou.`,
          )
        }
      }

      // Atomic reference derived from a fresh UUID — id and reference are unique
      // by construction, no retry loop needed.
      orderId = crypto.randomUUID()
      reference = `LB-${new Date().getFullYear()}-${orderId.slice(0, 6).toUpperCase()}`

      await client.query(
        `INSERT INTO orders (id, reference, user_id, status, subtotal,
           delivery_method, easybox_name, easybox_address, shipping_cost, total,
           ship_full_name, ship_email, ship_phone, ship_county, ship_locality,
           ship_street, ship_number, ship_block, ship_staircase, ship_floor,
           ship_apartment, ship_postal_code, ship_notes)
         VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [
          orderId, reference, ownerId, subtotal, deliveryMethod,
          pickupPoint ? pickupPoint.name : null, pickupPoint ? pickupPoint.address : null,
          shippingCost, total, shipObj.fullName, shipObj.email, shipObj.phone,
          shipObj.county, shipObj.locality, shipObj.street, shipObj.number,
          shipObj.block, shipObj.staircase, shipObj.floor, shipObj.apartment,
          shipObj.postalCode, shipObj.notes,
        ],
      )

      for (const line of lines) {
        await client.query(
          `INSERT INTO order_lines (order_id, book_id, title, author, price, quantity, variant_name)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            orderId, line.bookId, line.title, line.author, line.price, line.quantity,
            line.variantName ?? null,
          ],
        )
      }

      await client.query('COMMIT')
    } catch (err) {
      if (client) await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      if (client) client.release()
    }

    // Re-read the committed order so the response mirrors the persistence layer.
    const draft = await fetchOrderWithLines(orderId)
    const brand = await getSiteName()

    // Digital products: deliver the file/access link in the confirmation email.
    const digitalLinks = lines
      .filter((line) => line.productType === 'digital')
      .map((line) => {
        const book = booksById.get(line.bookId)
        const url = absoluteUrl(book?.digital_file_url)
        return url
          ? { title: line.title, url, access: book?.digital_access || '' }
          : null
      })
      .filter(Boolean)

    const owner = getContactRecipient()
    if (owner) {
      const { text, html } = buildOwnerEmail({
        brand, reference, createdAt: draft.createdAt, lines: draft.lines,
        shipping: draft.shipping, subtotal, deliveryMethod: draft.deliveryMethod,
        pickupPoint: draft.pickupPoint, shippingCost: draft.shippingCost, total: draft.total,
        adminUrl: `${getPublicUrl()}/admin`,
      })
      sendMail({ to: owner, subject: `Comandă nouă ${reference} — ${brand}`, text, html }).catch(
        (mailErr) => console.warn('[libraria] order email to owner skipped:', mailErr.message),
      )
    }

    const customerContent = buildCustomerEmail({
      brand, reference, lines: draft.lines, shipping: draft.shipping, subtotal,
      deliveryMethod: draft.deliveryMethod, pickupPoint: draft.pickupPoint,
      shippingCost: draft.shippingCost, total: draft.total, digitalLinks,
    })
    sendMail({
      to: email,
      subject: `Comandă confirmată ${reference} — ${brand}`,
      text: customerContent.text,
      html: customerContent.html,
    }).catch((mailErr) => console.warn('[libraria] customer confirmation skipped:', mailErr.message))

    return res.status(201).json(draft)
  } catch (err) {
    return serverError(res, err, 'create-order')
  }
})

/** GET /api/orders — the signed-in customer's own orders (newest first). */
ordersRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id],
    )
    const orders = []
    for (const row of rows) orders.push(await fetchOrderWithLines(row.id))
    return res.json(orders)
  } catch (err) {
    return serverError(res, err, 'list-orders')
  }
})

/** GET /api/orders/all — every order, admin only (newest first). */
ordersRouter.get('/all', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM orders ORDER BY created_at DESC LIMIT 500',
    )
    const orders = []
    for (const row of rows) orders.push(await fetchOrderWithLines(row.id, { admin: true }))
    return res.json(orders)
  } catch (err) {
    return serverError(res, err, 'list-all-orders')
  }
})

/**
 * POST /api/orders/lookup
 * Public order tracking: reference + the email used at checkout. Both must
 * match, so knowing a reference alone is not enough to read someone's address.
 */
ordersRouter.post('/lookup', async (req, res) => {
  const reference = cleanString(req.body?.reference, 60).toUpperCase()
  const email = cleanString(req.body?.email, 200).toLowerCase()
  if (!reference || !isEmail(email)) {
    return res.status(422).json({ error: 'Completează numărul comenzii și emailul folosit la comandă.' })
  }
  try {
    const { rows } = await pool.query(
      'SELECT id FROM orders WHERE UPPER(reference) = $1 AND LOWER(ship_email) = $2',
      [reference, email],
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nu am găsit o comandă cu aceste date.' })
    }
    return res.json(await fetchOrderWithLines(rows[0].id))
  } catch (err) {
    return serverError(res, err, 'lookup-order')
  }
})

/**
 * PATCH /api/orders/:id
 * Admin: update the order status and/or the internal note. The customer is
 * emailed when the status changes.
 */
ordersRouter.patch('/:id', requireAdmin, async (req, res) => {
  const status = req.body?.status
  const hasNote = req.body?.adminNote !== undefined
  const adminNote = hasNote ? cleanString(req.body.adminNote, 2000) : undefined

  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    return res.status(422).json({ error: 'Status de comandă invalid.' })
  }
  if (status === undefined && !hasNote) {
    return res.status(422).json({ error: 'Trimite un status sau o notă.' })
  }

  try {
    const current = await fetchOrderWithLines(req.params.id, { admin: true })
    if (!current) return res.status(404).json({ error: 'Comanda nu a fost găsită.' })

    const nextStatus = status ?? current.status
    await pool.query(
      `UPDATE orders SET status = $1${hasNote ? ', admin_note = $3' : ''}, updated_at = now()
       WHERE id = $2`,
      hasNote ? [nextStatus, req.params.id, adminNote || null] : [nextStatus, req.params.id],
    )

    const updated = await fetchOrderWithLines(req.params.id, { admin: true })

    // Notify the customer when the status actually changed.
    if (status !== undefined && status !== current.status && updated?.shipping?.email) {
      const brand = await getSiteName()
      const { text, html } = buildStatusEmail({
        brand,
        reference: updated.reference,
        status,
        shipping: updated.shipping,
      })
      sendMail({
        to: updated.shipping.email,
        subject: `Comanda ${updated.reference} — ${ORDER_STATUS_LABELS[status]}`,
        text,
        html,
      }).catch((mailErr) => console.warn('[libraria] status email skipped:', mailErr.message))
    }

    return res.json(updated)
  } catch (err) {
    return serverError(res, err, 'update-order')
  }
})

/**
 * GET /api/orders/:id
 * Return a single order (by id or reference). Customers may only read their own
 * orders; admins may read any. Guests use POST /lookup instead.
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
    return res.json(await fetchOrderWithLines(order.id))
  } catch (err) {
    return serverError(res, err, 'get-order')
  }
})
