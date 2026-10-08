import express from 'express'
import cors from 'cors'
import { pingDatabase } from './db.js'
import { booksRouter } from './routes/books.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { mailRouter } from './routes/mail.js'
import { formsRouter } from './routes/forms.js'
import { ordersRouter } from './routes/orders.js'
import { addressesRouter } from './routes/addresses.js'

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

// ---- Stub routers (not part of the current scope) ----
app.use('/api/cart', async (_req, res) => {
  res.status(501).json({ message: 'Cart endpoints not implemented yet — template only.' })
})
app.use('/api/users', async (_req, res) => {
  res.status(501).json({ message: 'User endpoints not implemented yet — template only.' })
})

// Warm-up check so a broken DB config fails fast at startup.
app.locals.ready = pingDatabase().catch((err) => {
  console.error('[libraria] DB ping failed at startup:', err.message)
  return null
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  console.log(`[libraria] backend listening on :${PORT}`)
})

