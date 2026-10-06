import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { signToken } from '../auth.js'
import { sendMail, getPublicUrl } from '../mailer.js'

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
 *
 * Sends a password-reset email containing a real, clickable link to the
 * frontend reset page (`/resetare-parola/:token`). The token is stored (as a
 * SHA-256 hash) in the `password_resets` table with an expiry. Always resolves
 * with `{ ok: true }` to avoid leaking which emails have accounts.
 */
authRouter.post('/request-password-reset', async (req, res) => {
  const email = String((req.body || {}).email ?? '').trim().toLowerCase()
  res.setHeader('Content-Type', 'application/json')

  if (!email) {
    return res.json({ ok: true })
  }

  try {
    // Look up the account WITHOUT revealing whether it exists.
    const { rows } = await pool.query('SELECT id, name FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (user) {
      // Single-use token, stored hashed so a DB leak isn't a usable token.
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      // Invalidate any previous reset tokens for this user.
      await pool.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM password_resets
           WHERE user_id = $1 AND used = false AND expires_at > now()
         )`,
        [user.id, tokenHash, expiresAt],
      )
      const resetUrl = `${getPublicUrl()}/resetare-parola/${token}`
      try {
        await sendMail({
          to: email,
          subject: 'Resetarea parolei — Librăria',
          text:
            `Salut, ${user.name}!\n\n` +
            `Ai solicitat resetarea parolei contului tău de la Librăria.\n` +
            `Apasă pe linkul de mai jos pentru a alege o parolă nouă (valabil 1 oră):\n\n` +
            `${resetUrl}\n\n` +
            `Dacă nu ai fost tu, poți ignora acest email.\n\n` +
            `Cu drag, echipa Librăria.`,
          html:
            `<p>Salut, <strong>${user.name}</strong>!</p>` +
            `<p>Ai solicitat resetarea parolei contului tău de la <strong>Librăria</strong>.</p>` +
            `<p><a href="${resetUrl}">Alege o parolă nouă aici</a> (linkul este valabil 1 oră).</p>` +
            `<p>Dacă nu ai fost tu, poți ignora acest email.</p>` +
            `<p style="color:#642A2E">Cu drag, echipa Librăria.</p>`,
        })
      } catch (mailErr) {
        // Non-fatal from the requester's perspective.
        console.warn('[libraria] reset email skipped:', mailErr.message)
      }
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('[libraria] request-password-reset error:', err.message)
    res.json({ ok: true }) // still don't reveal account existence
  }
})

/**
 * POST /api/auth/reset-password
 *
 * Validates a reset token (unused, not expired), then updates the user's
 * password hash and marks the token as used. Used by the `ResetPassword` page
 * after the user follows the link from the email.
 *
 * Body: { token: string, password: string }
 */
authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !password) {
    return res.status(422).json({ error: 'Tokenul și noua parolă sunt obligatorii.' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(422).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere.' })
  }

  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex')
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT id, user_id FROM password_resets
       WHERE token_hash = $1 AND used = false AND expires_at > now()
       FOR UPDATE`,
      [tokenHash],
    )
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Linkul de resetare este invalid sau a expirat.' })
    }
    const resetRow = rows[0]
    const hash = await bcrypt.hash(password, 10)
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      hash,
      resetRow.user_id,
    ])
    await client.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRow.id])
    await client.query('COMMIT')
    return res.json({ ok: true })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    return res.status(500).json({ error: err.message })
  } finally {
    if (client) client.release()
  }
})
