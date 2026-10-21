-- ============================================================================
-- Librăria — seed data
-- ----------------------------------------------------------------------------
-- Idempotent-ish baseline data: one admin user and the books from the app's
-- mock catalog (src/data/books.ts). Run automatically by the db container's
-- init scripts, right after 01_schema.sql.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Product categories — the three canonical RV STUDIO categories.
-- ---------------------------------------------------------------------------
INSERT INTO product_categories (id, name, slug, blurb, sort) VALUES
    ('carti',           'Cărți',             'carti',            'Cărți tipărite cu răbdare.', 1),
    ('produse-digitale','Produse Digitale',  'produse-digitale', 'Fișiere, cursuri și acces digital cu livrare automată.', 2),
    ('diverse-accesorii','Diverse & Accesorii','diverse-accesorii','Accesorii și obiecte care însoțesc lectura.', 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, slug = EXCLUDED.slug, blurb = EXCLUDED.blurb, sort = EXCLUDED.sort;

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
    category_id, product_type, variants, digital_file_url, digital_access, shipping_info,
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
    'carti', 'physical',
    '[]'::jsonb,
    NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata se face ramburs sau prin transfer bancar după confirmarea comenzii.","returns":"Returnare gratuită în termen de 14 zile dacă volumul nu a fost deschis."}'::jsonb,
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
    'carti', 'physical',
    '[]'::jsonb,
    NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata ramburs sau transfer bancar.","returns":"Returnare gratuită în 14 zile."}'::jsonb,
    false, 'active', ARRAY['eseuri','contemporan']
),
(
    'ghid-de-lectura-digital',
    'Ghidul de lectură lentă — Ediție digitală',
    'Echipa RV STUDIO',
    'Un ghid digital PDF de 84 de pagini despre lectura lentă, cu exerciții și pagini de jurnal gata de printat — livrat automat pe email.',
    'Colecția noastră de texte despre cum să citim mai încet, mai prezent și mai atent. Include exerciții de lectură, planuri de jurnal și un index de resurse — totul într-un PDF curat, pregătit pentru print.',
    'Cititul lent nu este un moft; este un mod de a-i oferi minții spațiu să respire.',
    39.00, 0, 'RON',
    NULL,
    'Coperta ghidului digital de lectură lentă',
    'Ghidul de lectură lentă', 'Echipa RV STUDIO', 'brass',
    '{}',
    NULL, NULL, NULL, 'Română', 'PDF, 84 pagini', 'Digital',
    'produse-digitale', 'digital',
    '[]'::jsonb,
    '/files/ghid-de-lectura-digital.pdf',
    'După confirmarea plății, fișierul PDF îți este trimis automat pe email. Îl poți descărca și direct din contul tău, secțiunea Comenzi.',
    '{}'::jsonb,
    true, 'active', ARRAY['digital','ghid','pdf']
),
(
    'semne-de-carte-din-lemn',
    'Semne de carte din lemn — Set de 3',
    'RV STUDIO',
    'Trei semne de carte sculptate manual din lemn de fag, cu margini rotunjite — pentru paginile pe care nu vrei să le pierzi.',
    'Fiecare set conține trei semne de carte din lemn de fag, finisate cu ceară naturală și gravate discret cu un simbol al atelierului. Un mic obiect gândit să însoțească lectura zilnică.',
    'Lemnul păstrează căldura atelierului.',
    49.00, 12, 'RON',
    NULL,
    'Fotografia setului de semne de carte din lemn',
    'Semne de carte din lemn', 'RV STUDIO', 'paper',
    '{}',
    NULL, NULL, NULL, NULL, 'Set 3 bucăți', 'Accesorii',
    'diverse-accesorii', 'physical',
    '[{"id":"v1","name":"Simplu, gravat cu inițială","price_delta":0,"stock":8},{"id":"v2","name":"Gravat cu simbolul atelierului","price_delta":12,"stock":4}]'::jsonb,
    NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata ramburs sau transfer bancar.","returns":"Returnare gratuită în 14 zile, în ambalajul original."}'::jsonb,
    true, 'active', ARRAY['accesorii','semne de carte','lemn']
);

COMMIT;
