-- ============================================================================
-- 05 — owner-editable settings, newsletter subscribers, order admin fields
-- ----------------------------------------------------------------------------
-- Applied on fresh volumes after the base schema; the backend's idempotent
-- `ensureSchema()` applies the same statements on every boot so existing
-- volumes are upgraded too.
-- ============================================================================

BEGIN;

ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Owner-editable storefront content (single row, JSON document).
CREATE TABLE IF NOT EXISTS site_settings (
    id         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    data       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Real newsletter list (the previous implementation only sent an email).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    email      TEXT PRIMARY KEY,
    source     TEXT NOT NULL DEFAULT 'newsletter-site',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_created ON newsletter_subscribers (created_at DESC);

-- Initial storefront content (the owner edits it from Admin → Setări).
INSERT INTO site_settings (id, data) VALUES (
    1,
    jsonb_build_object(
        'brandName', 'RV STUDIO',
        'brandNameLong', 'RV STUDIO — Cărți & Tipar',
        'tagline', 'O librărie independentă și o mică editură.',
        'description', 'Cărți atent alese, tipografie frumoasă și gustul lucrurilor făcute cu răbdare.',
        'contactEmail', 'contact@rvstudio.ro'
    )
) ON CONFLICT (id) DO NOTHING;

COMMIT;
