import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { requireAuth, signToken } from '../auth.js'
import { sendMail } from '../mailer.js'
import { getPublicUrl } from '../config.js'
import { getSiteName } from '../settings.js'
import { ApiError, isUniqueViolation, serverError } from '../lib/errors.js'
import { cleanString, escapeHtml, isEmail } from '../lib/text.js'

export const authRouter = Router()

const MIN_PASSWORD_LENGTH = 8

/** Map a users row to the public `User` JSON shape the frontend expects. */
function toUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role }
}

/**
 * POST /api/auth/register
 * Create a new customer account in the `users` table.
 */
authRouter.post('/register', async (req, res) => {
  const name = cleanString(req.body?.name, 120)
  const email = cleanString(req.body?.email, 200).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!name || !email || !password) {
    return res.status(422).json({ error: 'Numele, emailul și parola sunt obligatorii.' })
  }
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Adresa de email nu este validă.' })
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(422)
      .json({ error: `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.` })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role`,
      [name, email, hash],
    )
    const user = toUser(rows[0])
    const brand = await getSiteName()

    // Non-fatal: send a welcome email if mail is configured.
    try {
      await sendMail({
        to: user.email,
        subject: `Bine ai venit la ${brand}`,
        text:
          `Salut, ${user.name}!\n\n` +
          `Contul tău la ${brand} a fost creat cu succes.\n\n` +
          `Cu drag, echipa ${brand}.`,
        html:
          `<p>Salut, <strong>${escapeHtml(user.name)}</strong>!</p>` +
          `<p>Contul tău la <strong>${escapeHtml(brand)}</strong> a fost creat cu succes.</p>` +
          `<p style="color:#642A2E">Cu drag, echipa ${escapeHtml(brand)}.</p>`,
      })
    } catch (mailErr) {
      console.warn('[libraria] welcome email skipped:', mailErr.message)
    }

    return res.status(201).json({ user, token: signToken(rows[0]) })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'Există deja un cont cu acest email.' })
    }
    return serverError(res, err, 'register')
  }
})

/**
 * POST /api/auth/login
 * Verify credentials against `users` and return a session token.
 */
authRouter.post('/login', async (req, res) => {
  const email = cleanString(req.body?.email, 200).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!email || !password) {
    return res.status(422).json({ error: 'Emailul și parola sunt obligatorii.' })
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [email],
    )
    const row = rows[0]
    if (!row || !row.password_hash) {
      return res.status(401).json({ error: 'Email sau parolă incorecte.' })
    }
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Email sau parolă incorecte.' })
    }
    return res.json({ user: toUser(row), token: signToken(row) })
  } catch (err) {
    return serverError(res, err, 'login')
  }
})

/**
 * GET /api/auth/me
 * Resolve the current session from the database (so a role change or a deleted
 * account is reflected immediately, not only when the token expires).
 */
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [
      req.user.id,
    ])
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Sesiune invalidă.' })
    }
    return res.json({ user: toUser(rows[0]) })
  } catch (err) {
    return serverError(res, err, 'me')
  }
})

/**
 * PATCH /api/auth/me
 * Update the signed-in customer's profile (display name).
 */
authRouter.patch('/me', requireAuth, async (req, res) => {
  const name = cleanString(req.body?.name, 120)
  if (!name) {
    return res.status(422).json({ error: 'Numele este obligatoriu.' })
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role',
      [name, req.user.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contul nu a fost găsit.' })
    return res.json({ user: toUser(rows[0]) })
  } catch (err) {
    return serverError(res, err, 'update-profile')
  }
})

/**
 * POST /api/auth/change-password
 * Change the password of the signed-in account (requires the current one).
 */
authRouter.post('/change-password', requireAuth, async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
  if (!currentPassword || !newPassword) {
    return res.status(422).json({ error: 'Parola actuală și parola nouă sunt obligatorii.' })
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(422)
      .json({ error: `Parola nouă trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.` })
  }
  if (newPassword === currentPassword) {
    return res.status(422).json({ error: 'Parola nouă trebuie să fie diferită de cea actuală.' })
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    const row = rows[0]
    if (!row?.password_hash) {
      throw new ApiError(400, 'Contul nu are o parolă setată.')
    }
    const ok = await bcrypt.compare(currentPassword, row.password_hash)
    if (!ok) {
      return res.status(400).json({ error: 'Parola actuală este incorectă.' })
    }
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id])
    await pool.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [
      req.user.id,
    ])
    return res.json({ ok: true })
  } catch (err) {
    return serverError(res, err, 'change-password')
  }
})

/**
 * POST /api/auth/request-password-reset
 * Send a single-use reset link to the address, if the account exists. The reply
 * is always `{ ok: true }` so the endpoint cannot be used to enumerate accounts.
 */
authRouter.post('/request-password-reset', async (req, res) => {
  const email = cleanString(req.body?.email, 200).toLowerCase()
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Adresa de email nu este validă.' })
  }
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await pool.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM password_resets
           WHERE user_id = $1 AND used = false AND expires_at > now()
         )`,
        [user.id, tokenHash, expiresAt],
      )

      const brand = await getSiteName()
      const resetUrl = `${getPublicUrl()}/resetare-parola/${token}`
      try {
        await sendMail({
          to: email,
          subject: `Resetarea parolei — ${brand}`,
          text:
            `Salut, ${user.name}!\n\n` +
            `Ai solicitat resetarea parolei contului tău de la ${brand}.\n` +
            `Deschide linkul de mai jos pentru a alege o parolă nouă (valabil 1 oră):\n\n` +
            `${resetUrl}\n\n` +
            `Dacă nu ai fost tu, poți ignora acest email.\n\n` +
            `Cu drag, echipa ${brand}.`,
          html:
            `<p>Salut, <strong>${escapeHtml(user.name)}</strong>!</p>` +
            `<p>Ai solicitat resetarea parolei contului tău de la <strong>${escapeHtml(brand)}</strong>.</p>` +
            `<p><a href="${escapeHtml(resetUrl)}">Alege o parolă nouă aici</a> (linkul este valabil 1 oră).</p>` +
            `<p>Dacă nu ai fost tu, poți ignora acest email.</p>` +
            `<p style="color:#642A2E">Cu drag, echipa ${escapeHtml(brand)}.</p>`,
        })
      } catch (mailErr) {
        console.warn('[libraria] reset email skipped:', mailErr.message)
      }
    }
    return res.json({ ok: true })
  } catch (err) {
    console.error('[libraria] request-password-reset error:', err.message)
    return res.json({ ok: true }) // still don't reveal account existence
  }
})

/**
 * POST /api/auth/reset-password
 * Validate a reset token (unused, not expired), then set the new password and
 * mark the token as used. Used by the ResetPassword page after the email link.
 */
authRouter.post('/reset-password', async (req, res) => {
  const token = cleanString(req.body?.token, 200)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!token || !password) {
    return res.status(422).json({ error: 'Tokenul și noua parolă sunt obligatorii.' })
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(422)
      .json({ error: `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.` })
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
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
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, resetRow.user_id])
    await client.query('UPDATE password_resets SET used = true WHERE user_id = $1', [resetRow.user_id])
    await client.query('COMMIT')
    return res.json({ ok: true })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    return serverError(res, err, 'reset-password')
  } finally {
    if (client) client.release()
  }
})
