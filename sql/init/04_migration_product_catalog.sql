-- ============================================================================
-- Librăria — migration: RV STUDIO multi-category catalog
-- ----------------------------------------------------------------------------
-- Turns the book-only store into a multi-category shop (Cărți, Produse
-- Digitale, Diverse & Accesorii). Adds the three canonical categories, a
-- `category_id` on books, and the product-type / variants / digital / shipping
-- columns so one product page can serve all categories.
--
-- Applies on TOP of an existing 01_schema + 03_migration database. Idempotent —
-- safe to re-run.
--
-- Apply to a running database:
--   docker compose exec -T db psql -U libraria -d libraria < sql/init/04_migration_product_catalog.sql
-- ============================================================================

BEGIN;

-- product_type enum (guarded — no plain IF NOT EXISTS for enums).
DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('physical', 'digital');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The three canonical categories.
CREATE TABLE IF NOT EXISTS product_categories (
    id     TEXT PRIMARY KEY,
    name   TEXT NOT NULL UNIQUE,
    slug   TEXT NOT NULL UNIQUE,
    blurb  TEXT NOT NULL DEFAULT '',
    sort   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO product_categories (id, name, slug, blurb, sort) VALUES
    ('carti',          'Cărți',            'carti',          'Cărți tipărite cu răbdare, cărți alese atent.', 1),
    ('produse-digitale','Produse Digitale', 'produse-digitale', 'Fișiere, cursuri și acces digital cu livrare automată.', 2),
    ('diverse-accesorii','Diverse & Accesorii','diverse-accesorii','Accesorii și obiecte gândite să însoțească lectura.', 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    blurb = EXCLUDED.blurb,
    sort = EXCLUDED.sort;

-- Extend the books table (now the products table for every category).
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS category_id      TEXT REFERENCES product_categories (id);
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS product_type     product_type NOT NULL DEFAULT 'physical';
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS variants         JSONB NOT NULL DEFAULT '[]';
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS digital_access   TEXT;
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS shipping_info    JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_books_category_id ON books (category_id);

-- Backfill existing books into the "cărți" category so nothing becomes orphaned.
UPDATE books
SET category_id = 'carti'
WHERE category_id IS NULL;

COMMIT;
