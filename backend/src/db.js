import pg from 'pg'

const { Pool } = pg

/**
 * Shared PostgreSQL connection pool.
 *
 * Connection settings are provided via environment variables (see `.env.example`
 * at the repo root and `docker-compose.yml`). Nothing sensitive is hard-coded.
 */
export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'libraria',
  password: process.env.PGPASSWORD || 'libraria',
  database: process.env.PGDATABASE || 'libraria',
  max: 10,
  idleTimeoutMillis: 30_000,
})

/** Verify the DB connection and return a small diagnostic object. */
export async function pingDatabase() {
  const result = await pool.query(
    `SELECT current_database() AS db, current_user AS user, now() AS now`,
  )
  return result.rows[0]
}
