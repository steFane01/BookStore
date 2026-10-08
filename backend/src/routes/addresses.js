import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../auth.js'

export const addressesRouter = Router()

/**
 * Map an `addresses` row into the frontend `CustomerAddress` JSON shape.
 * The table flattens the fields; here we rebuild the nested `address` object so
 * the UI can render it unchanged.
 */
function toAddress(row) {
  return {
    id: row.id,
    label: row.label,
    recipient: row.recipient,
    phone: row.phone,
    address: {
      county: row.county,
      locality: row.locality,
      street: row.street,
      number: row.number,
      block: row.block ?? undefined,
      staircase: row.staircase ?? undefined,
      floor: row.floor ?? undefined,
      apartment: row.apartment ?? undefined,
      postalCode: row.postal_code ?? undefined,
    },
  }
}

/** Pull the nested `address` fields out of the request body into a flat object. */
function readAddressFields(body) {
  const a = (body && body.address) || {}
  return {
    label: String(body?.label ?? '').trim(),
    recipient: String(body?.recipient ?? '').trim(),
    phone: String(body?.phone ?? '').trim(),
    county: String(a.county ?? '').trim(),
    locality: String(a.locality ?? '').trim(),
    street: String(a.street ?? '').trim(),
    number: String(a.number ?? '').trim(),
    block: a.block ? String(a.block).trim() : null,
    staircase: a.staircase ? String(a.staircase).trim() : null,
    floor: a.floor ? String(a.floor).trim() : null,
    apartment: a.apartment ? String(a.apartment).trim() : null,
    postalCode: a.postalCode ? String(a.postalCode).trim() : null,
  }
}

/** Load a single address row for a user, or null. */
async function fetchOwnAddress(id, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
    [id, userId],
  )
  return rows.length ? toAddress(rows[0]) : null
}

/**
 * GET /api/addresses
 * Return the current user's saved addresses (newest first).
 */
addressesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC, id',
      [req.user.id],
    )
    return res.json(rows.map(toAddress))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/addresses
 * Save a new address for the current user.
 */
addressesRouter.post('/', requireAuth, async (req, res) => {
  const f = readAddressFields(req.body)
  if (!f.recipient || !f.county || !f.locality || !f.street || !f.number) {
    return res.status(422).json({
      error: 'Destinatarul, județul, localitatea, strada și numărul sunt obligatorii.',
    })
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO addresses
         (user_id, label, recipient, phone, county, locality, street, number,
          block, staircase, floor, apartment, postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id,
        f.label || f.recipient || 'Adresă',
        f.recipient,
        f.phone,
        f.county,
        f.locality,
        f.street,
        f.number,
        f.block,
        f.staircase,
        f.floor,
        f.apartment,
        f.postalCode,
      ],
    )
    return res.status(201).json(toAddress(rows[0]))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * PUT /api/addresses/:id
 * Update one of the current user's saved addresses.
 */
addressesRouter.put('/:id', requireAuth, async (req, res) => {
  const f = readAddressFields(req.body)
  if (!f.recipient || !f.county || !f.locality || !f.street || !f.number) {
    return res.status(422).json({
      error: 'Destinatarul, județul, localitatea, strada și numărul sunt obligatorii.',
    })
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE addresses SET
         label = $1, recipient = $2, phone = $3,
         county = $4, locality = $5, street = $6, number = $7,
         block = $8, staircase = $9, floor = $10, apartment = $11, postal_code = $12
       WHERE id = $13 AND user_id = $14`,
      [
        f.label || f.recipient || 'Adresă',
        f.recipient,
        f.phone,
        f.county,
        f.locality,
        f.street,
        f.number,
        f.block,
        f.staircase,
        f.floor,
        f.apartment,
        f.postalCode,
        req.params.id,
        req.user.id,
      ],
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Adresa nu a fost găsită.' })
    }
    const updated = await fetchOwnAddress(req.params.id, req.user.id)
    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /api/addresses/:id
 * Remove one of the current user's saved addresses.
 */
addressesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Adresa nu a fost găsită.' })
    }
    return res.status(204).end()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})
