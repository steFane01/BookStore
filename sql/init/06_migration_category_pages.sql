-- ============================================================================
-- 06 — category landing pages (description + owner image)
-- ----------------------------------------------------------------------------
-- Each storefront category gets its own page (/categorie/<slug>): a large title,
-- a description below it and an optional owner-uploaded image. The columns are
-- added here for fresh volumes; `backend/src/db.js#ensureSchema()` applies the
-- same statements on every boot so existing volumes are upgraded too.
-- ============================================================================

BEGIN;

ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS image_url   TEXT;

COMMIT;
