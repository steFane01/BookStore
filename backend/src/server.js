import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pingDatabase, ensureSchema, pool } from './db.js'
import { allowedOrigins, getPublicUrl, isProduction, validateRuntimeConfig } from './config.js'
import { rateLimit } from './lib/rateLimit.js'
import { bootstrapAdmin } from './bootstrap.js'
import { booksRouter } from './routes/books.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { mailRouter } from './routes/mail.js'
import { formsRouter } from './routes/forms.js'
import { ordersRouter } from './routes/orders.js'
import { addressesRouter } from './routes/addresses.js'
import { uploadRouter } from './routes/upload.js'
import { easyboxesRouter } from './routes/easyboxes.js'
import { settingsRouter } from './routes/settings.js'
import { newsletterRouter } from './routes/newsletter.js'

/**
 * Storefront backend.
 *
 *   GET  /api/health                      -> DB connectivity check
 *   GET  /api/books                       -> public active catalog
 *   GET  /api/books/all                   -> full catalog (admin)
 *   GET  /api/books/:id                   -> single product
 *   POST/PUT/DELETE /api/books[/:id]      -> catalog CRUD (admin)
 *   GET/POST/PUT/DELETE /api/books/categories -> collections (admin writes)
 *   POST /api/auth/register|login|change-password|request-password-reset|reset-password
 *   GET/PATCH /api/auth/me                -> session / profile
 *   GET/PUT /api/settings                 -> owner-editable storefront content
 *   POST /api/forms/contact|newsletter    -> public forms
 *   GET/DELETE /api/newsletter[/:email]   -> subscriber list + CSV export (admin)
 *   POST /api/orders                      -> place an order (guest or signed-in)
 *   GET  /api/orders[/all]                -> own orders / every order (admin)
 *   POST /api/orders/lookup               -> guest order tracking (reference + email)
 *   PATCH /api/orders/:id                 -> status + internal note (admin)
 *   GET/POST/PUT/DELETE /api/addresses    -> saved addresses
 *   POST /api/upload                      -> admin image upload
 *   GET  /api/easyboxes                   -> SameDay EasyBox pickup points
 *   GET  /api/mail/status|test            -> SMTP diagnostics (admin)
 */

const problems = validateRuntimeConfig()
if (problems.length > 0) {
  for (const problem of problems) console.error(`[libraria] configurare: ${problem}`)
  process.exit(1)
}

const app = express()
app.disable('x-powered-by')

// Behind nginx (Docker) or another reverse proxy: trust the first hop so
// `req.ip` is the real client address (needed by the rate limiter).
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))

app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
)

// Same-origin in production; a configurable allow-list otherwise.
const origins = allowedOrigins()
app.use(cors(origins.length > 0 ? { origin: origins } : undefined))
app.use(express.json({ limit: '200kb' }))

// ---- Rate limits (per client IP) ----
const tooMany = 'Prea multe cereri. Așteaptă câteva minute și încearcă din nou.'
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, max: 10, message: 'Prea multe încercări de autentificare. Încearcă din nou peste 15 minute.' }))
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60_000, max: 5, message: tooMany }))
app.use('/api/auth/request-password-reset', rateLimit({ windowMs: 60 * 60_000, max: 5, message: tooMany }))
app.use('/api/auth/reset-password', rateLimit({ windowMs: 60 * 60_000, max: 10, message: tooMany }))
app.use('/api/auth/change-password', rateLimit({ windowMs: 15 * 60_000, max: 10, message: tooMany }))
app.use('/api/forms', rateLimit({ windowMs: 10 * 60_000, max: 8, message: tooMany }))
app.use('/api/orders/lookup', rateLimit({ windowMs: 15 * 60_000, max: 20, message: tooMany }))
const orderCreateLimiter = rateLimit({ windowMs: 60 * 60_000, max: 10, message: tooMany })
app.use('/api/orders', (req, res, next) =>
  req.method === 'POST' ? orderCreateLimiter(req, res, next) : next(),
)
app.use('/api/upload', rateLimit({ windowMs: 60 * 60_000, max: 120, message: tooMany }))
app.use('/api', rateLimit({ windowMs: 15 * 60_000, max: 1500, message: tooMany }))

app.use('/api/health', healthRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/newsletter', newsletterRouter)
app.use('/api/books', booksRouter)
app.use('/api/auth', authRouter)
app.use('/api/mail', mailRouter)
app.use('/api/forms', formsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/addresses', addressesRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/easyboxes', easyboxesRouter)

// Admin-uploaded images: long cache + never let a browser re-interpret the type.
const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })
app.use(
  '/uploads',
  express.static(uploadsDir, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Cache-Control', 'public, max-age=604800')
    },
  }),
)

// ---- SEO helpers (served from the API so the domain comes from PUBLIC_URL) ----
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${getPublicUrl()}/sitemap.xml\n`,
  )
})

app.get('/sitemap.xml', async (_req, res) => {
  const base = getPublicUrl()
  let productUrls = []
  try {
    const { rows } = await pool.query(
      "SELECT id FROM books WHERE status = 'active' ORDER BY updated_at DESC",
    )
    productUrls = rows.map((row) => `${base}/carte/${encodeURIComponent(row.id)}`)
  } catch (err) {
    console.warn('[libraria] sitemap: books unavailable:', err.message)
  }
  const urls = [`${base}/`, `${base}/despre`, `${base}/contact`, ...productUrls]
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n') +
    '\n</urlset>\n'
  res.type('application/xml').send(xml)
})

// ---- API 404 + error handler (never leak internal messages) ----
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint inexistent: ${req.method} ${req.originalUrl}` })
})

app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err)
  console.error('[libraria] unhandled error:', err)
  return res.status(500).json({ error: 'A apărut o eroare internă. Încearcă din nou.' })
})

// Warm-up: guarantee the schema, verify the DB and ensure the admin account
// before accepting any traffic.
app.locals.ready = (async () => {
  await ensureSchema()
  const info = await pingDatabase()
  console.log(`[libraria] DB ready (${info.db} @ ${info.user})`)
  await bootstrapAdmin()
  return info
})()

const PORT = Number(process.env.PORT || 4000)

app.locals.ready
  .then(() => app.listen(PORT, () => console.log(`[libraria] API listening on :${PORT}`)))
  .catch((err) => {
    console.error('[libraria] failed to start:', err.message)
    process.exit(1)
  })
