import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { signToken } from '../auth.js'
import { sendMail } from '../mailer.js'

export const authRouter = Router()

/** Map a users row to the public `User` JSON shape the frontend expects. */
function toUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role }
}

/**
 * POST /api/auth/register
 * Create a new customer account in the `users` table.
 */
authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name || !email || !password) {
    return res.status(422).json({ error: 'Numele, emailul și parola sunt obligatorii.' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(422).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere.' })
  }
  const normalizedEmail = String(email).trim().toLowerCase()

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'Există deja un cont cu acest email.' })
    }
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role`,
      [String(name).trim(), normalizedEmail, hash],
    )
    const user = toUser(rows[0])
    // Non-fatal: send a welcome/confirm email if mail is configured.
    try {
      await sendMail({
        to: user.email,
        subject: 'Bine ai venit la Librăria',
        text: `Salut, ${user.name}!\n\nContul tău la Librăria a fost creat cu succes.\n\nCu drag, echipa Librăria.`,
        html: `<p>Salut, <strong>${user.name}</strong>!</p><p>Contul tău la <strong>Librăria</strong> a fost creat cu succes.</p>`,
      })
    } catch (mailErr) {
      console.warn('[libraria] welcome email skipped:', mailErr.message)
    }
    return res.status(201).json({ user, token: signToken(rows[0]) })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/auth/login
 * Verify credentials against `users` and return a session token.
 */
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(422).json({ error: 'Emailul și parola sunt obligatorii.' })
  }
  const normalizedEmail = String(email).trim().toLowerCase()
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [normalizedEmail],
    )
    const row = rows[0]
    if (!row || !row.password_hash) {
      return res.status(401).json({ error: 'Email sau parolă incorecte.' })
    }
    const ok = await bcrypt.compare(String(password), row.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Email sau parolă incorecte.' })
    }
    const user = toUser(row)
    return res.json({ user, token: signToken(row) })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/auth/me
 * Resolve the current session (used to restore a logged-in user on reload).
 */
authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Neautorizat.' })
  try {
    const { verify } = await import('jsonwebtoken')
    const payload = verify(token, process.env.JWT_SECRET || 'libraria-dev-secret-change-me')
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [payload.sub],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contul nu mai există.' })
    return res.json({ user: toUser(rows[0]) })
  } catch {
    return res.status(401).json({ error: 'Sesiune expirată sau nevalidă.' })
  }
})

/**
 * POST /api/auth/request-password-reset
 * Stub for now — sends an email via the configured mail service when the
 * reset flow is implemented. Always resolves to avoid leaking which emails exist.
 */
authRouter.post('/request-password-reset', async (req, res) => {
  const { email } = req.body || {}
  if (email) {
    try {
      await sendMail({
        to: String(email),
        subject: 'Resetarea parolei — Librăria',
        text: 'Ai solicitat resetarea parolei. (Implementare completă în curând.)',
        html: '<p>Ai solicitat resetarea parolei.</p>',
      })
    } catch {
      // ignore — never reveal whether the account exists
    }
  }
  res.json({ ok: true })
})
