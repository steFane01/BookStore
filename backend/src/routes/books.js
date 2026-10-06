import { Router } from 'express'
import { pool } from '../db.js'
import { requireAdmin } from '../auth.js'

export const booksRouter = Router()

const BOOK_COLUMNS = `
  id, title, author, short_description AS "shortDescription",
  description, excerpt, price, stock, currency,
  cover_src AS "coverSrc", cover_alt AS "coverAlt",
  cover_placeholder_title AS "coverPlaceholderTitle",
  cover_placeholder_author AS "coverPlaceholderAuthor",
  cover_placeholder_theme AS "coverPlaceholderTheme",
  gallery, isbn, pages, year, language, format, category,
  featured, status, tags`

/**
 * Convert a flat DB row to the nested `Book` shape the frontend consumes.
 */
function rowToBook(row) {
  const hasCover = Boolean(row.coverSrc)
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    shortDescription: row.shortDescription ?? '',
    description: row.description ?? '',
    excerpt: row.excerpt ?? '',
    price: Number(row.price),
    stock: Number(row.stock),
    currency: row.currency ?? 'RON',
    cover: {
      src: row.coverSrc ?? null,
      alt: row.coverAlt ?? `Coperta cărții „${row.title}”`,
      placeholder: hasCover
        ? undefined
        : {
            title: row.coverPlaceholderTitle ?? row.title,
            author: row.coverPlaceholderAuthor ?? row.author,
            theme: row.coverPlaceholderTheme ?? undefined,
          },
    },
    gallery: row.gallery ?? [],
    isbn: row.isbn ?? undefined,
    pages: row.pages ?? undefined,
    year: row.year ?? undefined,
    language: row.language ?? undefined,
    format: row.format ?? undefined,
    category: row.category ?? undefined,
    featured: row.featured,
    status: row.status,
    tags: row.tags ?? [],
  }
}

/** Turn a human slug into a URL-safe id (the books.id primary key). */
function slugify(input) {
  const base = String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const suffix = Date.now().toString(36).slice(-5)
  return `${base || 'carte'}-${suffix}`
}

/** Map an AdminBookInput body to the DB insert/update column set. */
function bodyToColumns(body) {
  const coverSrc = body.coverSrc && body.coverSrc.trim() ? body.coverSrc.trim() : null
  return {
    title: String(body.title ?? '').trim(),
    author: String(body.author ?? '').trim(),
    short_description: String(body.shortDescription ?? '').trim(),
    description: String(body.description ?? '').trim(),
    excerpt: String(body.excerpt ?? '').trim(),
    price: Number(body.price ?? 0),
    stock: Number(body.stock ?? 0),
    cover_src: coverSrc,
    cover_alt: coverSrc ? `Coperta cărții „${body.title ?? ''}”` : null,
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    isbn: body.isbn ?? null,
    pages: body.pages ? Number(body.pages) : null,
    year: body.year ? Number(body.year) : null,
    language: body.language ?? null,
    format: body.format ?? null,
    category: body.category || null,
    featured: Boolean(body.featured),
    status: body.status === 'active' ? 'active' : 'draft',
    tags: Array.isArray(body.tags) ? body.tags : [],
  }
}

/** GET /api/books — public active catalog. */
booksRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${BOOK_COLUMNS}
       FROM books
       WHERE status = 'active'
       ORDER BY featured DESC, title ASC`,
    )
    res.json(rows.map(rowToBook))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/books/all — all books incl. drafts, admin only (before /:id). */
booksRouter.get('/all', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${BOOK_COLUMNS} FROM books ORDER BY featured DESC, created_at DESC`,
    )
    res.json(rows.map(rowToBook))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/books/:id — single public book. */
booksRouter.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${BOOK_COLUMNS} FROM books WHERE id = $1`, [
      req.params.id,
    ])
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rowToBook(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/books — create, admin only. */
booksRouter.post('/', requireAdmin, async (req, res) => {
  const body = req.body || {}
  if (!body.title || !body.author) {
    return res.status(422).json({ error: 'Titlul și autorul sunt obligatorii.' })
  }
  const c = bodyToColumns(body)
  const id = slugify(c.title)
  try {
    const { rows } = await pool.query(
      `INSERT INTO books
         (id, title, author, short_description, description, excerpt, price, stock,
          cover_src, cover_alt, gallery, isbn, pages, year, language, format,
          category, featured, status, tags)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING ${BOOK_COLUMNS}`,
      [
        id, c.title, c.author, c.short_description, c.description, c.excerpt,
        c.price, c.stock, c.cover_src, c.cover_alt, c.gallery, c.isbn, c.pages,
        c.year, c.language, c.format, c.category, c.featured, c.status, c.tags,
      ],
    )
    res.status(201).json(rowToBook(rows[0]))
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'O carte cu acest titlu există deja.' })
    }
    return res.status(500).json({ error: err.message })
  }
})

/** PUT /api/books/:id — update, admin only. */
booksRouter.put('/:id', requireAdmin, async (req, res) => {
  const body = req.body || {}
  const c = bodyToColumns(body)
  try {
    const { rows } = await pool.query(
      `UPDATE books SET
         title=$1, author=$2, short_description=$3, description=$4, excerpt=$5,
         price=$6, stock=$7, cover_src=$8, cover_alt=$9, gallery=$10, isbn=$11,
         pages=$12, year=$13, language=$14, format=$15, category=$16, featured=$17,
         status=$18, tags=$19
       WHERE id=$20
       RETURNING ${BOOK_COLUMNS}`,
      [
        c.title, c.author, c.short_description, c.description, c.excerpt,
        c.price, c.stock, c.cover_src, c.cover_alt, c.gallery, c.isbn, c.pages,
        c.year, c.language, c.format, c.category, c.featured, c.status, c.tags,
        req.params.id,
      ],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Cartea nu a fost găsită.' })
    res.json(rowToBook(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /api/books/:id — remove, admin only. */
booksRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM books WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Cartea nu a fost găsită.' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
