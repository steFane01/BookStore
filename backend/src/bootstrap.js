/**
 * Startup data bootstrap.
 *
 * Creates (or updates) the administrator accounts from the environment, so a
 * fresh deployment has real administrators without any credentials baked into
 * the repository.
 *
 * Two formats are supported:
 *   - ADMIN_ACCOUNTS="email|password|Name;email2|password2|Name2"   (preferred)
 *   - ADMIN_EMAIL + ADMIN_PASSWORD + ADMIN_NAME                     (legacy, one account)
 *
 * The env password is an INITIAL password: it never overwrites a password the
 * owner changed from the UI. Set ADMIN_RESET_PASSWORD=1 for one restart to force
 * it back to the value from `.env`.
 */
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

const DEMO_ADMIN_EMAIL = 'admin@libraria.ro'
const DEMO_ADMIN_HASH = '$2a$10$1P0UExHflO8BSj3n1HcYvu6yX3GABTXEbUAp2bnlwEnvlhlScAQkS'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

/**
 * Parse the admin accounts from env.
 *
 * `ADMIN_ACCOUNTS` uses `email|password|Name` entries separated by `;`. The
 * legacy single-account variables are appended when they are not duplicated,
 * so existing deployments keep working.
 */
export function parseAdminAccounts(env = process.env) {
  const accounts = []
  const seen = new Set()

  const add = (emailRaw, passwordRaw, nameRaw) => {
    const email = String(emailRaw || '').trim().toLowerCase()
    const password = String(passwordRaw || '')
    const name = String(nameRaw || 'Administrator').trim() || 'Administrator'
    if (!email || !password || seen.has(email)) return
    seen.add(email)
    accounts.push({ email, password, name })
  }

  for (const entry of String(env.ADMIN_ACCOUNTS || '').split(';')) {
    if (!entry.trim()) continue
    const [email, password, ...nameParts] = entry.split('|')
    add(email, password, nameParts.join('|'))
  }

  add(env.ADMIN_EMAIL, env.ADMIN_PASSWORD, env.ADMIN_NAME)
  return accounts
}

export async function bootstrapAdmin() {
  const accounts = parseAdminAccounts()
  const forceReset = process.env.ADMIN_RESET_PASSWORD === '1'

  for (const account of accounts) {
    if (!EMAIL_RE.test(account.email)) {
      throw new Error(`ADMIN_ACCOUNTS: adresă de email invalidă (${account.email}).`)
    }
    if (account.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `ADMIN_ACCOUNTS: parola pentru ${account.email} trebuie să aibă minim ${MIN_PASSWORD_LENGTH} caractere.`,
      )
    }

    const { rows } = await pool.query('SELECT id, role FROM users WHERE email = $1', [
      account.email,
    ])
    const existing = rows[0]

    if (!existing) {
      const hash = await bcrypt.hash(account.password, 10)
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        [account.name, account.email, hash],
      )
      console.log(`[libraria] cont admin creat: ${account.email} (${account.name})`)
    } else if (forceReset) {
      const hash = await bcrypt.hash(account.password, 10)
      await pool.query(
        `UPDATE users SET password_hash = $1, role = 'admin', name = COALESCE(NULLIF($2, ''), name)
         WHERE email = $3`,
        [hash, account.name, account.email],
      )
      console.log(`[libraria] parola contului admin a fost resetată din .env: ${account.email}`)
    } else if (existing.role !== 'admin') {
      // An explicitly configured admin account must always have the admin role.
      await pool.query(
        `UPDATE users SET role = 'admin', name = COALESCE(NULLIF($1, ''), name) WHERE email = $2`,
        [account.name, account.email],
      )
      console.log(`[libraria] cont existent promovat la admin: ${account.email}`)
    }
  }

  if (accounts.length === 0) {
    console.warn(
      '[libraria] ATENȚIE: niciun cont de administrator configurat. ' +
        'Setează ADMIN_ACCOUNTS în .env și repornește backend-ul.',
    )
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
          '  Șterge-l sau schimbă-i parola din Cont → Securitate.\n',
      )
    }
  } catch (err) {
    console.warn('[libraria] nu am putut verifica contul demo:', err.message)
  }
}

