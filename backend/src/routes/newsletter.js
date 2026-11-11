import { Router } from 'express'
import { pool } from '../db.js'
import { requireAdmin } from '../auth.js'
import { serverError } from '../lib/errors.js'

export const newsletterRouter = Router()

/** GET /api/newsletter — subscriber list, admin only. */
newsletterRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email, source, created_at AS "createdAt" FROM newsletter_subscribers ORDER BY created_at DESC',
    )
    return res.json(rows)
  } catch (err) {
    return serverError(res, err, 'list-subscribers')
  }
})

/** GET /api/newsletter/export — CSV download for the owner's mailing tool. */
newsletterRouter.get('/export', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email, created_at FROM newsletter_subscribers ORDER BY created_at DESC',
    )
    const csv = ['email,abonat_la']
      .concat(rows.map((row) => `${row.email},${row.created_at.toISOString()}`))
      .join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="abonati-newsletter.csv"')
    return res.send(`\uFEFF${csv}`)
  } catch (err) {
    return serverError(res, err, 'export-subscribers')
  }
})

/** DELETE /api/newsletter/:email — remove a subscriber (GDPR requests). */
newsletterRouter.delete('/:email', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM newsletter_subscribers WHERE email = $1', [
      String(req.params.email || '').trim().toLowerCase(),
    ])
    if (rowCount === 0) return res.status(404).json({ error: 'Abonatul nu a fost găsit.' })
    return res.status(204).end()
  } catch (err) {
    return serverError(res, err, 'delete-subscriber')
  }
})
