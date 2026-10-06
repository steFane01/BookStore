-- ============================================================================
-- Librăria — seed data
-- ----------------------------------------------------------------------------
-- Idempotent-ish baseline data: one admin user and the books from the app's
-- mock catalog (src/data/books.ts). Run automatically by the db container's
-- init scripts, right after 01_schema.sql.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Users — the demo accounts the UI documents. Real bcrypt hashes (cost 10) so
-- login works out of the box against the real /api/auth/login endpoint:
--   admin@libraria.ro   / admin123
--   cititor@example.com / parola123
-- ---------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Administrator', 'admin@libraria.ro',
     '$2a$10$1P0UExHflO8BSj3n1HcYvu6yX3GABTXEbUAp2bnlwEnvlhlScAQkS', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'Ioana Popescu', 'cititor@example.com',
     '$2a$10$xCyhowKmkJrnAMwj52yVPO50jKGs0UMeek7Snl2g5fvIvEqt1x5NS', 'customer')
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;


-- ---------------------------------------------------------------------------
-- Books — mirror of src/data/books.ts
-- ---------------------------------------------------------------------------
INSERT INTO books (
    id, title, author, short_description, description, excerpt,
    price, stock, currency,
    cover_src, cover_alt,
    cover_placeholder_title, cover_placeholder_author, cover_placeholder_theme,
    gallery, isbn, pages, year, language, format, category,
    featured, status, tags
) VALUES
(
    'cartea-de-pagini-luminoase',
    'Cartea paginilor luminoase',
    'Andrei Munteanu',
    'Un roman despre lumină, hârtie și despre oamenii care apucă să găsească frumosul exact atunci când se gândeau să renunțe.',
    'Scris pe o perioadă de șapte ani, „Cartea paginilor luminoase” este un roman despre timpul pe care îl petrecem în compania cărților și despre felul în care unele povești reușesc să ne schimbe ritmul vieții.',
    'Atelierul mirosea a clei cald și a carton vechi.',
    89.00, 24, 'RON',
    NULL,
    'Coperta cărții „Cartea paginilor luminoase” de Andrei Munteanu',
    'Cartea paginilor luminoase', 'Andrei Munteanu', 'oxblood',
    '{}',
    '978-606-000-123-4', 312, 2024, 'Română', 'Copertă dură, 13 × 20 cm', 'Ficțiune',
    true, 'active', ARRAY['roman','contemporan','cărți','restaurare']
),
(
    'calendarul-semnelor-bune',
    'Calendarul semnelor bune',
    'Irina Stancu',
    'Esauri dedicate micilor ritualuri care ne țin aproape de lumea reală, departe de ecrane și de graba fără chip.',
    'O colecție de eseuri despre gesturi mici, repetate, care ne ancorează în prezent: udatul florilor dimineața, gătitul în zilele de duminică, cititul cu voce tare pentru cineva drag.',
    'Ritualurile nu sunt repetitii goale.',
    64.00, 18, 'RON',
    NULL,
    'Coperta cărții „Calendarul semnelor bune” de Irina Stancu',
    'Calendarul semnelor bune', 'Irina Stancu', 'brass',
    '{}',
    '978-606-000-130-9', 178, 2023, 'Română', 'Broșat, 12 × 19 cm', 'Eseuri',
    false, 'active', ARRAY['eseuri','contemporan']
);

COMMIT;
