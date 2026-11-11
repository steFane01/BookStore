import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAdmin } from '../auth.js'
import { ApiError, isUniqueViolation, serverError } from '../lib/errors.js'
import { cleanString } from '../lib/text.js'

export const booksRouter = Router()

/** Public catalog columns. `digital_file_url` is deliberately NOT selected — a
 * paid download link must never be readable by an anonymous catalog request. */
const PUBLIC_COLUMNS = `
  id, title, author, short_description AS "shortDescription",
  description, excerpt, price, stock, currency,
  cover_src AS "coverSrc", cover_alt AS "coverAlt",
  cover_placeholder_title AS "coverPlaceholderTitle",
  cover_placeholder_author AS "coverPlaceholderAuthor",
  cover_placeholder_theme AS "coverPlaceholderTheme",
  gallery, isbn, pages, year, language, format, category,
  category_id AS "categoryId",
  product_type AS "productType",
  variants, digital_access AS "digitalAccess",
  shipping_info AS "shippingInfo",
  featured, status, tags`

/** Admin catalog columns (adds the private digital delivery link). */
const ADMIN_COLUMNS = `${PUBLIC_COLUMNS}, digital_file_url AS "digitalFileUrl"`

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'))

/** Convert a flat DB row to the nested `Book` shape the frontend consumes. */
function rowToBook(row, { admin = false } = {}) {
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
    categoryId: row.categoryId ?? undefined,
    productType: row.productType ?? 'physical',
    variants: row.variants ?? [],
    ...(admin ? { digitalFileUrl: row.digitalFileUrl ?? undefined } : {}),
    digitalAccess: row.digitalAccess ?? undefined,
    shippingInfo: row.shippingInfo ?? {},
    featured: row.featured,
    status: row.status,
    tags: row.tags ?? [],
  }
}

/** Turn a human label into a URL-safe slug (categories). */
function slugify(input, fallback = 'categorie') {
  const base = String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

/** Turn a human slug into a URL-safe id (the books.id primary key). */
function bookIdFromTitle(title) {
  return `${slugify(title, 'carte')}-${Date.now().toString(36).slice(-5)}`
}

/** Best-effort removal of an uploaded file referenced by a stored URL. */
function deleteUploadedFile(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return
  const name = url.split('/').pop()
  if (!name || !/^[A-Za-z0-9._-]+$/.test(name)) return
  const full = path.resolve(UPLOAD_DIR, name)
  if (!full.startsWith(UPLOAD_DIR + path.sep)) return
  fs.promises.unlink(full).catch(() => {})
}

/** Validate + normalize the admin book payload into DB columns. */
function bodyToColumns(body) {
  const title = cleanString(body?.title, 200)
  const author = cleanString(body?.author, 200)
  const price = Number(body?.price ?? 0)
  const stock = Number(body?.stock ?? 0)
  if (!Number.isFinite(price) || price < 0) throw new ApiError(422, 'Prețul trebuie să fie un număr pozitiv.')
  if (!Number.isInteger(stock) || stock < 0) throw new ApiError(422, 'Stocul trebuie să fie un număr întreg pozitiv.')

  const coverSrc = cleanString(body?.coverSrc, 500) || null
  const gallery = Array.isArray(body?.gallery)
    ? body.gallery.map((src) => cleanString(src, 500)).filter(Boolean).slice(0, 12)
    : []
  const pages = body?.pages ? Number(body.pages) : null
  if (pages != null && (!Number.isInteger(pages) || pages <= 0)) {
    throw new ApiError(422, 'Numărul de pagini trebuie să fie un întreg pozitiv.')
  }

  return {
    title,
    author,
    short_description: cleanString(body?.shortDescription, 400),
    description: cleanString(body?.description, 8000),
    excerpt: cleanString(body?.excerpt, 8000),
    price: Math.round(price * 100) / 100,
    stock,
    cover_src: coverSrc,
    cover_alt: coverSrc ? `Coperta cărții „${title}”` : null,
    gallery,
    isbn: cleanString(body?.isbn, 40) || null,
    pages,
    year: body?.year ? Number(body.year) : null,
    language: cleanString(body?.language, 60) || null,
    format: cleanString(body?.format, 60) || null,
    category: cleanString(body?.category, 120) || null,
    category_id: cleanString(body?.categoryId, 120) || null,
    product_type: body?.productType === 'digital' ? 'digital' : 'physical',
    variants: Array.isArray(body?.variants) ? body.variants.slice(0, 20) : [],
    digital_file_url: cleanString(body?.digitalFileUrl, 500) || null,
    digital_access: cleanString(body?.digitalAccess, 800) || null,
    shipping_info:
      body?.shippingInfo && typeof body.shippingInfo === 'object' ? body.shippingInfo : {},
    featured: Boolean(body?.featured),
    status: body?.status === 'active' ? 'active' : 'draft',
    tags: Array.isArray(body?.tags)
      ? body.tags.map((tag) => cleanString(tag, 40)).filter(Boolean).slice(0, 20)
      : [],
  }
}

/** GET /api/books — public active catalog (optionally filtered by category). */
booksRouter.get('/', async (req, res) => {
  const category = typeof req.query.categorie === 'string' ? req.query.categorie.trim() : ''
  try {
    const params = []
    let where = `status = 'active'`
    if (category) {
      params.push(category)
      where += ` AND (category_id = $${params.length} OR LOWER(category) = LOWER($${params.length}))`
    }
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM books WHERE ${where} ORDER BY featured DESC, title ASC`,
      params,
    )
    return res.json(rows.map((row) => rowToBook(row)))
  } catch (err) {
    return serverError(res, err, 'list-books')
  }
})

/** GET /api/books/all — full catalog incl. drafts, admin only (before /:id). */
booksRouter.get('/all', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${ADMIN_COLUMNS} FROM books ORDER BY featured DESC, created_at DESC`,
    )
    return res.json(rows.map((row) => rowToBook(row, { admin: true })))
  } catch (err) {
    return serverError(res, err, 'list-all-books')
  }
})

/** GET /api/books/categories — the storefront categories (before /:id). */
booksRouter.get('/categories', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, slug, blurb, sort FROM product_categories ORDER BY sort ASC, name ASC',
    )
    return res.json(rows)
  } catch (err) {
    return serverError(res, err, 'list-categories')
  }
})

/** POST /api/books/categories — create a category, admin only. */
booksRouter.post('/categories', requireAdmin, async (req, res) => {
  const name = cleanString(req.body?.name, 120)
  const blurb = cleanString(req.body?.blurb, 400)
  const sort = Number.isFinite(Number(req.body?.sort)) ? Number(req.body.sort) : 0
  if (!name) return res.status(422).json({ error: 'Numele categoriei este obligatoriu.' })
  const id = slugify(name)
  try {
    const { rows } = await pool.query(
      `INSERT INTO product_categories (id, name, slug, blurb, sort)
       VALUES ($1, $2, $1, $3, $4)
       RETURNING id, name, slug, blurb, sort`,
      [id, name, blurb, sort],
    )
    return res.status(201).json(rows[0])
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'Există deja o categorie cu acest nume.' })
    }
    return serverError(res, err, 'create-category')
  }
})

/** PUT /api/books/categories/:id — rename / reorder, admin only. */
booksRouter.put('/categories/:id', requireAdmin, async (req, res) => {
  const name = cleanString(req.body?.name, 120)
  const blurb = cleanString(req.body?.blurb, 400)
  const sort = Number.isFinite(Number(req.body?.sort)) ? Number(req.body.sort) : 0
  if (!name) return res.status(422).json({ error: 'Numele categoriei este obligatoriu.' })
  try {
    const { rows } = await pool.query(
      `UPDATE product_categories SET name = $1, blurb = $2, sort = $3
       WHERE id = $4 RETURNING id, name, slug, blurb, sort`,
      [name, blurb, sort, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Categoria nu a fost găsită.' })
    return res.json(rows[0])
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'Există deja o categorie cu acest nume.' })
    }
    return serverError(res, err, 'update-category')
  }
})

/** DELETE /api/books/categories/:id — only when no product uses it. */
booksRouter.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const used = await pool.query('SELECT COUNT(*)::int AS count FROM books WHERE category_id = $1', [
      req.params.id,
    ])
    if (used.rows[0].count > 0) {
      return res.status(409).json({
        error: 'Categoria conține produse. Mută-le într-o altă categorie înainte de ștergere.',
      })
    }
    const { rowCount } = await pool.query('DELETE FROM product_categories WHERE id = $1', [
      req.params.id,
    ])
    if (rowCount === 0) return res.status(404).json({ error: 'Categoria nu a fost găsită.' })
    return res.status(204).end()
  } catch (err) {
    return serverError(res, err, 'delete-category')
  }
})

/** GET /api/books/:id — single public book. */
booksRouter.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM books WHERE id = $1`, [
      req.params.id,
    ])
    if (rows.length === 0) return res.status(404).json({ error: 'Cartea nu a fost găsită.' })
    return res.json(rowToBook(rows[0]))
  } catch (err) {
    return serverError(res, err, 'get-book')
  }
})

/** POST /api/books — create a product, admin only. */
booksRouter.post('/', requireAdmin, async (req, res) => {
  let c
  try {
    c = bodyToColumns(req.body || {})
  } catch (err) {
    return serverError(res, err, 'create-book')
  }
  if (!c.title || !c.author) {
    return res.status(422).json({ error: 'Titlul și autorul sunt obligatorii.' })
  }
  const id = bookIdFromTitle(c.title)
  try {
    const { rows } = await pool.query(
      `INSERT INTO books
         (id, title, author, short_description, description, excerpt, price, stock,
          cover_src, cover_alt, gallery, isbn, pages, year, language, format,
          category, category_id, product_type, variants, digital_file_url,
          digital_access, shipping_info, featured, status, tags)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
          $20,$21,$22,$23,$24,$25,$26)
       RETURNING ${ADMIN_COLUMNS}`,
      [
        id, c.title, c.author, c.short_description, c.description, c.excerpt,
        c.price, c.stock, c.cover_src, c.cover_alt, c.gallery, c.isbn, c.pages,
        c.year, c.language, c.format, c.category, c.category_id, c.product_type,
        c.variants, c.digital_file_url, c.digital_access, c.shipping_info,
        c.featured, c.status, c.tags,
      ],
    )
    return res.status(201).json(rowToBook(rows[0], { admin: true }))
  } catch (err) {
    return serverError(res, err, 'create-book')
  }
})

/** PUT /api/books/:id — update a product, admin only. */
booksRouter.put('/:id', requireAdmin, async (req, res) => {
  let c
  try {
    c = bodyToColumns(req.body || {})
  } catch (err) {
    return serverError(res, err, 'update-book')
  }
  if (!c.title || !c.author) {
    return res.status(422).json({ error: 'Titlul și autorul sunt obligatorii.' })
  }
  try {
    const existing = await pool.query('SELECT cover_src, gallery FROM books WHERE id = $1', [
      req.params.id,
    ])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cartea nu a fost găsită.' })
    }
    const { rows } = await pool.query(
      `UPDATE books SET
         title=$1, author=$2, short_description=$3, description=$4, excerpt=$5,
         price=$6, stock=$7, cover_src=$8, cover_alt=$9, gallery=$10, isbn=$11,
         pages=$12, year=$13, language=$14, format=$15, category=$16,
         category_id=$17, product_type=$18, variants=$19, digital_file_url=$20,
         digital_access=$21, shipping_info=$22, featured=$23, status=$24, tags=$25
       WHERE id=$26
       RETURNING ${ADMIN_COLUMNS}`,
      [
        c.title, c.author, c.short_description, c.description, c.excerpt,
        c.price, c.stock, c.cover_src, c.cover_alt, c.gallery, c.isbn, c.pages,
        c.year, c.language, c.format, c.category, c.category_id, c.product_type,
        c.variants, c.digital_file_url, c.digital_access, c.shipping_info,
        c.featured, c.status, c.tags,
        req.params.id,
      ],
    )
    // Remove uploaded images that are no longer referenced by this product.
    const previous = existing.rows[0]
    const keep = new Set([c.cover_src, ...c.gallery].filter(Boolean))
    for (const url of [previous.cover_src, ...(previous.gallery || [])]) {
      if (url && !keep.has(url)) deleteUploadedFile(url)
    }
    return res.json(rowToBook(rows[0], { admin: true }))
  } catch (err) {
    return serverError(res, err, 'update-book')
  }
})

/** DELETE /api/books/:id — remove a product and its uploaded images. */
booksRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query('SELECT cover_src, gallery FROM books WHERE id = $1', [
      req.params.id,
    ])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cartea nu a fost găsită.' })
    }
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id])
    const row = existing.rows[0]
    for (const url of [row.cover_src, ...(row.gallery || [])]) deleteUploadedFile(url)
    return res.status(204).end()
  } catch (err) {
    return serverError(res, err, 'delete-book')
  }
})
