import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import { pingDatabase, ensureSchema } from './db.js'
import { booksRouter } from './routes/books.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { mailRouter } from './routes/mail.js'
import { formsRouter } from './routes/forms.js'
import { ordersRouter } from './routes/orders.js'
import { addressesRouter } from './routes/addresses.js'
import { uploadRouter } from './routes/upload.js'
import { easyboxesRouter } from './routes/easyboxes.js'

/**
 * Librăria backend.
 *
 * Boots the Express server, wires the PostgreSQL connection, and exposes:
 *
 *   GET  /api/health            -> DB connectivity check
 *   GET  /api/books             -> public active catalog
 *   GET  /api/books/all         -> full catalog (admin)
 *   GET  /api/books/:id         -> single book
 *   POST /api/books             -> create book (admin)
 *   PUT  /api/books/:id         -> update book (admin)
 *   DELETE /api/books/:id       -> delete book (admin)
 *   POST /api/auth/register     -> create account (persists to users table)
 *   POST /api/auth/login        -> authenticate, returns JWT
 *   GET  /api/auth/me           -> resolve current session
 *   POST /api/auth/request-password-reset -> sends a reset email with a link
 *   POST /api/auth/reset-password         -> set a new password (single-use token)
 *   GET/POST /api/mail/...                -> mail diagnostics + test send
 *   POST /api/forms/contact               -> email contact-form message to the owner
 *   POST /api/forms/newsletter            -> email a newsletter confirmation
 *   POST /api/orders                      -> create an order (atomic ref) + email owner
 *   GET  /api/orders                      -> current user's orders
 *   GET  /api/orders/all                  -> all orders (admin)
 *   GET  /api/orders/:id                  -> single order (id or reference)
 *   GET/POST /api/addresses               -> list / save current user's addresses
 *   PUT/DELETE /api/addresses/:id         -> update / remove one saved address
 *   POST /api/upload                      -> admin image upload (cover / gallery)
 *
 * Uploaded images are stored under the `uploads/` directory and served at
 * `/uploads/...`.
 *
 * Cart and users remain stubbed (501) for a later pass.
 */
const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/books', booksRouter)
app.use('/api/auth', authRouter)
app.use('/api/mail', mailRouter)
app.use('/api/forms', formsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/addresses', addressesRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/easyboxes', easyboxesRouter)

// Serve admin-uploaded book images (covers + gallery). The directory is created
// eagerly by upload.js, but we make sure it exists here too so a fresh container
// that has never processed an upload still serves an existing volume.
const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// ---- Stub routers (not part of the current scope) ----
app.use('/api/cart', async (_req, res) => {
  res.status(501).json({ message: 'Cart endpoints not implemented yet — template only.' })
})
app.use('/api/users', async (_req, res) => {
  res.status(501).json({ message: 'User endpoints not implemented yet — template only.' })
})

// Warm-up check so a broken DB config fails fast at startup.
app.locals.ready = (async () => {
  try {
    // Self-healing schema: creates missing tables and bumps stale volumes with
    // any missing columns (delivery_method, easybox_*, shipping_cost, total…)
    // so checkout INSERTs never hit a "column does not exist" error, no matter
    // how old the `db_data` volume is. Idempotent — safe on every boot.
    await ensureSchema()
    const info = await pingDatabase()
    console.log(`[libraria] DB ready (${info.db} @ ${info.user})`)
    return info
  } catch (err) {
    console.error('[libraria] DB ping failed at startup:', err.message)
    return null
  }
})()

const PORT = Number(process.env.PORT || 4000)

// Only start accepting traffic once the schema is guaranteed to be in place.
app.locals.ready
  .then(() => app.listen(PORT))
  .catch((err) => {
    console.error('[libraria] failed to start:', err.message)
    process.exit(1)
  })

