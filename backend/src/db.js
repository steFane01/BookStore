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

/**
 * Idempotent, self-healing schema bootstrap.
 *
 * This is the production guarantee that the database is ALWAYS up to date
 * regardless of how it was first created:
 *
 *  - Docker's `/docker-entrypoint-initdb.d` scripts (see `sql/init/`) only run
 *    on a FRESH volume. An existing `db_data` volume keeps its original schema
 *    forever, so columns added in later migrations would NEVER appear — which
 *    is exactly what caused checkout to fail with `column "delivery_method"
 *    does not exist` on databases created before the EasyBox/shipping fields
 *    were introduced.
 *  - By contrast this routine runs on EVERY backend boot. It uses only
 *    `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT
 *    EXISTS`, so it is safe to run repeatedly and will both create a brand-new
 *    database and bump an old/stale one up to the current shape.
 *
 * Kept in sync with `sql/init/01_schema.sql` (fresh volumes) + `sql/init/
 * 03_migration_orders_delivery_uploads.sql` (upgrades). Called from `server.js`
 * before the HTTP server starts accepting traffic.
 */
export async function ensureSchema() {
  // Postgres enums have no `IF NOT EXISTS` in plain form — use a guarded DO block.
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE user_role    AS ENUM ('customer', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE book_status  AS ENUM ('draft', 'active');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE order_status AS ENUM ('pending','processing','shipped','delivered','cancelled');
                                                                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  // ---- users ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role          user_role NOT NULL DEFAULT 'customer',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // ---- books ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id                       TEXT PRIMARY KEY,
      title                    TEXT NOT NULL,
      author                   TEXT NOT NULL,
      short_description        TEXT NOT NULL DEFAULT '',
      description              TEXT NOT NULL DEFAULT '',
      excerpt                  TEXT NOT NULL DEFAULT '',
      price                    NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      stock                    INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      currency                 TEXT NOT NULL DEFAULT 'RON',
      cover_src                TEXT,
      cover_alt                TEXT,
      cover_placeholder_title  TEXT,
      cover_placeholder_author TEXT,
      cover_placeholder_theme  TEXT,
      gallery                  TEXT[] NOT NULL DEFAULT '{}',
      isbn                     TEXT,
      pages                    INTEGER CHECK (pages IS NULL OR pages > 0),
      year                     INTEGER,
      language                 TEXT,
      format                   TEXT,
      category                 TEXT,
      featured                 BOOLEAN NOT NULL DEFAULT false,
      status                   book_status NOT NULL DEFAULT 'draft',
      tags                     TEXT[] NOT NULL DEFAULT '{}',
      created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // ---- addresses ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      label       TEXT NOT NULL DEFAULT 'Acasă',
      recipient   TEXT NOT NULL,
      phone       TEXT,
      county      TEXT,
      locality    TEXT,
      street      TEXT,
      number      TEXT,
      block       TEXT,
      staircase   TEXT,
      floor       TEXT,
      apartment   TEXT,
      postal_code TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // ---- orders ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reference   TEXT NOT NULL UNIQUE,
      user_id     UUID REFERENCES users (id) ON DELETE SET NULL,
      status      order_status NOT NULL DEFAULT 'pending',
      subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
      delivery_method  TEXT NOT NULL DEFAULT 'courier',
      easybox_name     TEXT,
      easybox_address  TEXT,
      shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
      total            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
      payment     JSONB,
      ship_full_name   TEXT NOT NULL,
      ship_email       TEXT NOT NULL,
      ship_phone       TEXT,
      ship_county      TEXT,
      ship_locality    TEXT,
      ship_street      TEXT,
      ship_number      TEXT,
      ship_block       TEXT,
      ship_staircase   TEXT,
      ship_floor       TEXT,
      ship_apartment   TEXT,
      ship_postal_code TEXT,
      ship_notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // ---- order_lines ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_lines (
      id        BIGSERIAL PRIMARY KEY,
      order_id  UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
      book_id   TEXT,
      title     TEXT NOT NULL,
      author    TEXT NOT NULL,
      price     NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      quantity  INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
    )
  `)

  // ---- cart_items (reserved for a future persistent cart) ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id         BIGSERIAL PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      book_id    TEXT NOT NULL REFERENCES books (id) ON DELETE CASCADE,
      quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, book_id)
    )
  `)

  // ---- password_resets ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id         BIGSERIAL PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)


  // ---- column upgrades (self-heal stale volumes) ----
  // `ADD COLUMN IF NOT EXISTS` is idempotent, so this is safe to run every boot.
  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method  TEXT NOT NULL DEFAULT 'courier';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS easybox_name     TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS easybox_address  TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS total            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment          JSONB;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_full_name   TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_email       TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_phone       TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_county      TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_locality    TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_street      TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_number      TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_block       TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_staircase   TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_floor       TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_apartment   TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_postal_code TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_notes       TEXT;
    ALTER TABLE books   ADD COLUMN IF NOT EXISTS gallery         TEXT[] NOT NULL DEFAULT '{}';
  `)

  // ---- indexes (IF NOT EXISTS so they're also idempotent) ----
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_books_status      ON books (status);
    CREATE INDEX IF NOT EXISTS idx_books_featured    ON books (featured) WHERE featured = true;
    CREATE INDEX IF NOT EXISTS idx_books_category    ON books (category);
    CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders (user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
    CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_addresses_user    ON addresses (user_id);
    CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines (order_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_user   ON cart_items (user_id);
    CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token_hash);
  `)

  // ---- updated-at maintenance trigger ----
  await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN
        NEW.updated_at := now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_users_updated ON users;
    CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS trg_books_updated ON books;
    CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `)
}

