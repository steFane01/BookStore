-- ============================================================================
-- Librăria — PostgreSQL schema
-- ----------------------------------------------------------------------------
-- Complete initial schema for the online bookstore. The tables and columns
-- mirror the domain model already present in the React frontend
-- (src/types/index.ts, src/services/*, src/data/*) so a future backend can
-- swap the mock/localStorage services with real persistence without changing
-- the UI.
--
-- Postgres 16+. Applied automatically by the `db` container via the
-- /docker-entrypoint-initdb.d mount (docker-compose).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE user_role  AS ENUM ('customer', 'admin');
CREATE TYPE book_status AS ENUM ('draft', 'active');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- users — matches the frontend `User` type (+ password hash for a real backend)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT,                -- bcrypt/argon2 hash; nullable until auth is wired
    role          user_role NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- books — matches the frontend `Book` type
-- ---------------------------------------------------------------------------
CREATE TABLE books (
    id                       TEXT PRIMARY KEY,          -- human slug, e.g. 'cartea-de-pagini-luminoase'
    title                    TEXT NOT NULL,
    author                   TEXT NOT NULL,
    short_description        TEXT NOT NULL DEFAULT '',
    description              TEXT NOT NULL DEFAULT '',
    excerpt                  TEXT NOT NULL DEFAULT '',
    price                    NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock                    INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    currency                 TEXT NOT NULL DEFAULT 'RON',
    -- cover image
    cover_src                TEXT,
    cover_alt                TEXT,
    -- editorial placeholder (when no real cover image exists)
    cover_placeholder_title  TEXT,
    cover_placeholder_author TEXT,
    cover_placeholder_theme  TEXT,                       -- 'oxblood' | 'brass' | 'ink' | 'paper'
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
);

CREATE INDEX idx_books_status ON books (status);
CREATE INDEX idx_books_featured ON books (featured) WHERE featured = true;
CREATE INDEX idx_books_category ON books (category);
-- ---------------------------------------------------------------------------
-- addresses — saved customer addresses (frontend `CustomerAddress`)
-- ---------------------------------------------------------------------------
CREATE TABLE addresses (
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
);
-- ---------------------------------------------------------------------------
-- orders — high-level order (frontend `OrderDraft`, minus lines/payment detail)
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference   TEXT NOT NULL UNIQUE,                     -- e.g. 'LB-2026-XXXXXX'
    user_id     UUID REFERENCES users (id) ON DELETE SET NULL,
    status      order_status NOT NULL DEFAULT 'pending',
    subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    -- No online payment by design (frontend states this explicitly). Column
    -- reserved for a future payment provider payload.
    payment     JSONB,
    -- shipping snapshot (frontend `ShippingAddress`)
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
);

CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at DESC);


CREATE INDEX idx_addresses_user ON addresses (user_id);

-- ---------------------------------------------------------------------------
-- order_lines — snapshot of each purchased item (frontend `OrderLine`).
-- Book data is copied at purchase time so historical orders survive later
-- catalog edits / deletions.
-- ---------------------------------------------------------------------------
CREATE TABLE order_lines (
    id        BIGSERIAL PRIMARY KEY,
    order_id  UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    book_id   TEXT,
    title     TEXT NOT NULL,
    author    TEXT NOT NULL,
    price     NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity  INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX idx_order_lines_order ON order_lines (order_id);

-- ---------------------------------------------------------------------------
-- cart_items — optional server-side cart. The current frontend keeps the cart
-- in localStorage (`CartItem`), but a table is provided so the backend can
-- offer persistent carts later.
-- ---------------------------------------------------------------------------
CREATE TABLE cart_items (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    book_id    TEXT NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, book_id)
);

CREATE INDEX idx_cart_items_user ON cart_items (user_id);

-- ---------------------------------------------------------------------------
-- password_resets — single-use tokens for the "forgot password" flow
-- (used by POST /api/auth/reset-password). Tokens are stored hashed (SHA-256)
-- so the DB never holds a usable reset link.
-- ---------------------------------------------------------------------------
CREATE TABLE password_resets (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_resets_token ON password_resets (token_hash);

-- ---------------------------------------------------------------------------
-- Updated-at maintenance trigger for tables with `updated_at`
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_books_updated  BEFORE UPDATE ON books  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

