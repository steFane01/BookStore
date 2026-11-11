import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../auth.js'
import { serverError } from '../lib/errors.js'
import { cleanString } from '../lib/text.js'

export const addressesRouter = Router()

/** Map an `addresses` row into the frontend `CustomerAddress` JSON shape. */
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
  const address = (body && body.address) || {}
  return {
    label: cleanString(body?.label, 80),
    recipient: cleanString(body?.recipient, 160),
    phone: cleanString(body?.phone, 40),
    county: cleanString(address.county, 120),
    locality: cleanString(address.locality, 120),
    street: cleanString(address.street, 200),
    number: cleanString(address.number, 40),
    block: cleanString(address.block, 40) || null,
    staircase: cleanString(address.staircase, 40) || null,
    floor: cleanString(address.floor, 40) || null,
    apartment: cleanString(address.apartment, 40) || null,
    postalCode: cleanString(address.postalCode, 20) || null,
  }
}

/** Load a single address row for a user, or null. */
async function fetchOwnAddress(id, userId) {
  const { rows } = await pool.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ])
  return rows.length ? toAddress(rows[0]) : null
}

/** GET /api/addresses — the current user's saved addresses (newest first). */
addressesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC, id',
      [req.user.id],
    )
    return res.json(rows.map(toAddress))
  } catch (err) {
    return serverError(res, err, 'list-addresses')
  }
})

/** POST /api/addresses — save a new address for the current user. */
addressesRouter.post('/', requireAuth, async (req, res) => {
  const field = readAddressFields(req.body)
  if (!field.recipient || !field.county || !field.locality || !field.street || !field.number) {
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
        field.label || field.recipient || 'Adresă',
        field.recipient,
        field.phone,
        field.county,
        field.locality,
        field.street,
        field.number,
        field.block,
        field.staircase,
        field.floor,
        field.apartment,
        field.postalCode,
      ],
    )
    return res.status(201).json(toAddress(rows[0]))
  } catch (err) {
    return serverError(res, err, 'create-address')
  }
})

/** PUT /api/addresses/:id — update one of the current user's addresses. */
addressesRouter.put('/:id', requireAuth, async (req, res) => {
  const field = readAddressFields(req.body)
  if (!field.recipient || !field.county || !field.locality || !field.street || !field.number) {
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
        field.label || field.recipient || 'Adresă',
        field.recipient,
        field.phone,
        field.county,
        field.locality,
        field.street,
        field.number,
        field.block,
        field.staircase,
        field.floor,
        field.apartment,
        field.postalCode,
        req.params.id,
        req.user.id,
      ],
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Adresa nu a fost găsită.' })
    return res.json(await fetchOwnAddress(req.params.id, req.user.id))
  } catch (err) {
    return serverError(res, err, 'update-address')
  }
})

/** DELETE /api/addresses/:id — remove one of the current user's addresses. */
addressesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Adresa nu a fost găsită.' })
    return res.status(204).end()
  } catch (err) {
    return serverError(res, err, 'delete-address')
  }
})
