/**
 * Startup data bootstrap.
 *
 * Creates (or updates) the owner's admin account from ADMIN_EMAIL +
 * ADMIN_PASSWORD, so a fresh deployment has a real administrator without any
 * demo credentials baked into the repository. Also warns loudly when the old
 * demo password is still active on an existing database.
 */
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

const DEMO_ADMIN_EMAIL = 'admin@libraria.ro'
const DEMO_ADMIN_HASH = '$2a$10$1P0UExHflO8BSj3n1HcYvu6yX3GABTXEbUAp2bnlwEnvlhlScAQkS'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''
  const name = (process.env.ADMIN_NAME || 'Administrator').trim() || 'Administrator'

  if (email && password) {
    if (!EMAIL_RE.test(email)) {
      throw new Error('ADMIN_EMAIL nu este o adresă de email validă.')
    }
    if (password.length < 8) {
      throw new Error('ADMIN_PASSWORD trebuie să aibă minim 8 caractere.')
    }
    const { rows } = await pool.query('SELECT id, password_hash, role FROM users WHERE email = $1', [
      email,
    ])
    const existing = rows[0]
    // The env password is an INITIAL password: it never overwrites a password
    // the owner changed from the UI. Set ADMIN_RESET_PASSWORD=1 for one restart
    // to force it back to the value from `.env`.
    const forceReset = process.env.ADMIN_RESET_PASSWORD === '1'

    if (!existing) {
      const hash = await bcrypt.hash(password, 10)
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        [name, email, hash],
      )
      console.log(`[libraria] cont admin creat: ${email}`)
    } else if (forceReset) {
      const hash = await bcrypt.hash(password, 10)
      await pool.query(
        `UPDATE users SET password_hash = $1, role = 'admin', name = COALESCE(NULLIF($2, ''), name)
         WHERE email = $3`,
        [hash, name, email],
      )
      console.log(`[libraria] parola contului admin a fost resetată din .env: ${email}`)
    } else if (existing.role !== 'admin') {
      console.warn(
        `[libraria] contul ${email} există, dar nu are rol admin. Setează ADMIN_RESET_PASSWORD=1 și repornește.`,
      )
    }
  }

  await warnAboutDemoAdmin()
}

async function warnAboutDemoAdmin() {
  try {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 AND password_hash = $2',
      [DEMO_ADMIN_EMAIL, DEMO_ADMIN_HASH],
    )
    if (rowCount > 0) {
      console.warn(
        '\n[libraria] ATENȚIE: contul admin@libraria.ro folosește încă parola demo.\n' +
          '  Schimb-o din Cont → Securitate sau setează ADMIN_EMAIL/ADMIN_PASSWORD în .env\n' +
          '  și repornește backend-ul.\n',
      )
    }
  } catch (err) {
    console.warn('[libraria] nu am putut verifica contul demo:', err.message)
  }
}
