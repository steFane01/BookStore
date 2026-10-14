-- ============================================================================
-- Librăria — migration: order delivery (SameDay EasyBox) + shipping + images
-- ----------------------------------------------------------------------------
-- Applies on TOP of an existing 01_schema database (the docker-compose init
-- scripts only run on an EMPTY volume, so an already-created DB needs these
-- statements run once). Idempotent — safe to re-run.
--
-- Apply to a running database:
--   docker compose exec -T db psql -U libraria -d libraria < sql/init/03_migration_orders_delivery_uploads.sql
-- ============================================================================

BEGIN;

-- Orders: delivery method (courier / easybox), chosen SameDay EasyBox, and the
-- shipping cost / grand total (subtotal + shipping).
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_method  TEXT NOT NULL DEFAULT 'courier';
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS easybox_name     TEXT;
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS easybox_address  TEXT;
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0);
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS total            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0);

-- Books: richer gallery per book (coloring books show interior photos).
ALTER TABLE books
    ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}';

COMMIT;
