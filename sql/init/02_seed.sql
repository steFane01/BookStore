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

-- ---------------------------------------------------------------------------
-- Demo products — every category populated, each with multiple test images.
-- (Mirrors sql/seed_demo_products.sql so fresh volumes get the same catalog.)
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
    'orasul-din-librarie',
    'Orașul din librărie',
    'Andrei Munteanu',
    'Un roman despre un cartier care își adună poveștile într-o singură librărie, cu o librăreasă care refuză să închidă ușa.',
    'La colțul dintre strada Tăcerea și strada Cititorului se află o librărie care nu apare pe nicio hartă. Cei care o găsesc spun că librăreasa cunoaște fiecare carte pe de rost și că poate ghici titlul de care ai nevoie doar din felul în care porți pauza de la prânz. Romanul urmărește un an în viața acestui cartier, când primăria anunță că librăria trebuie să se mute.',
    'Printre rafturi, mirosea a hârtie veche și a cafea care se răcea încet.',
    89.00, 20, 'RON',
    'https://picsum.photos/seed/orasul-librarie-cover/600/800',
    'Coperta cărții „Orașul din librărie” de Andrei Munteanu',
    NULL, NULL, NULL,
    ARRAY[
        'https://picsum.photos/seed/orasul-librarie-1/600/800',
        'https://picsum.photos/seed/orasul-librarie-2/600/800',
        'https://picsum.photos/seed/orasul-librarie-3/600/800',
        'https://picsum.photos/seed/orasul-librarie-4/600/800'
    ]::text[],
    '978-606-000-221-7', 336, 2025, 'Română', 'Copertă dură, 14 × 21 cm', 'Ficțiune',
    'carti', 'physical',
    '[]'::jsonb, NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata ramburs sau transfer bancar.","returns":"Returnare gratuită în 14 zile, în ambalajul original."}'::jsonb,
    true, 'active', ARRAY['roman','librărie','contemporan']
);

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
    'jurnal-de-toamna',
    'Jurnal de toamnă',
    'Irina Stancu',
    'Eseuri despre lumina scăzută a toamnei, despre ceaiul de după-amiază și despre felul în care citim mai bine când ne este frig.',
    'O culegere de eseuri care urmărește trei luni de toamnă: octombrie, noiembrie, decembrie. Fiecare eseu pleacă de la o imagine simplă — o pleoapă de nor, o foaie galbenă pe un pervaz — și se îndreaptă spre o idee despre ritm, răbdare și lectură. O carte de citit cu paltonul pe umeri.',
    'Toamna nu este un sfârșit; este doar felul în care anul își trage răsuflarea.',
    64.00, 15, 'RON',
    'https://picsum.photos/seed/jurnal-toamna-cover/600/800',
    'Coperta cărții „Jurnal de toamnă” de Irina Stancu',
    NULL, NULL, NULL,
    ARRAY[
        'https://picsum.photos/seed/jurnal-toamna-1/600/800',
        'https://picsum.photos/seed/jurnal-toamna-2/600/800',
        'https://picsum.photos/seed/jurnal-toamna-3/600/800',
        'https://picsum.photos/seed/jurnal-toamna-4/600/800'
    ]::text[],
    '978-606-000-222-4', 192, 2024, 'Română', 'Broșat, 12 × 20 cm', 'Eseuri',
    'carti', 'physical',
    '[]'::jsonb, NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata ramburs sau transfer bancar.","returns":"Returnare gratuită în 14 zile."}'::jsonb,
    true, 'active', ARRAY['eseuri','toamnă','contemporan']
);

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
    'ghid-lectura-atenta',
    'Ghidul de lectură atentă — Ediție digitală',
    'Echipa RV STUDIO',
    'Un ghid digital PDF de 96 de pagini despre aprofundarea lecturii: note, marginalii și tehnici de recitire — livrat automat pe email.',
    'Colecția noastră de texte despre cum să citim nu doar mai mult, ci mai atent. Include tehnici de note, planuri de recitire, exerciții de marginalie și un index de resurse — totul într-un PDF curat, pregătit pentru print.',
    'A citi atent înseamnă a te întoarce asupra unei pagini ca asupra unei camere în care ai locuit.',
    45.00, 0, 'RON',
    'https://picsum.photos/seed/ghid-lectura-cover/600/800',
    'Coperta ghidului digital „Lectură atentă”',
    NULL, NULL, NULL,
    ARRAY[
        'https://picsum.photos/seed/ghid-lectura-1/600/800',
        'https://picsum.photos/seed/ghid-lectura-2/600/800',
        'https://picsum.photos/seed/ghid-lectura-3/600/800'
    ]::text[],
    NULL, NULL, NULL, 'Română', 'PDF, 96 pagini', 'Digital',
    'produse-digitale', 'digital',
    '[]'::jsonb,
    '/files/ghid-lectura-atenta.pdf',
    'După confirmarea plății, fișierul PDF îți este trimis automat pe email. Îl poți descărca și direct din contul tău, secțiunea Comenzi.',
    '{}'::jsonb,
    true, 'active', ARRAY['digital','ghid','pdf']
);


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
    'atelier-editare-coperte',
    'Atelier digital: Coperte de carte',
    'RV STUDIO Academy',
    'Un ghid video pas cu pas despre cum construiești o copertă de carte echilibrată: tipografie, culoare și spațiu negativ — cu exerciții practice.',
    'Un curs digital, livrat instant, despre arta copertei: de la tipografie și grilă la paleta de culori și mesajul vizual. Fiecare modul are un exemplu filmat și o listă de verificare pe care o poți folosi imediat.',
    'O copertă bună nu strigă; ea deschide ușa.',
    99.00, 999, 'RON',
    'https://picsum.photos/seed/atelier-cover-cover/600/800',
    'Coperta atelierului digital „Coperte de carte”',
    NULL, NULL, NULL,
    ARRAY[
        'https://picsum.photos/seed/atelier-cover-1/600/800',
        'https://picsum.photos/seed/atelier-cover-2/600/800',
        'https://picsum.photos/seed/atelier-cover-3/600/800'
    ]::text[],
    NULL, NULL, NULL, 'Română', 'Video, acces instant', 'Digital',
    'produse-digitale', 'digital',
    '[]'::jsonb,
    '/files/atelier-editare-coperte.mp4',
    'După efectuarea comenzii primești automat linkul de acces pe email, fără costuri de livrare.',
    '{}'::jsonb,
    true, 'active', ARRAY['digital','atelier','coperte']
);

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
    'sertar-de-biblioteca',
    'Sertar bibliotecă din lemn',
    'RV STUDIO',
    'Un sertar mic din lemn de stejar, gândit să adune semne de carte, note și mici comori de lectură lângă pat sau birou.',
    'Un obiect simplu, sculptat în atelierul nostru: sertar din stejar masiv cu sertăraș interior pentru semne și adnotări. Margini rotunjite, finisaj cu ceară naturală. Un loc anume pentru lucrurile care însoțesc lectura.',
    'Fiecare carte citită lasă câte ceva în urma ei; acest sertar le ține pe toate laolaltă.',
    149.00, 8, 'RON',
    'https://picsum.photos/seed/sertar-biblioteca-cover/600/800',
    'Fotografia sertarului de bibliotecă din lemn',
    NULL, NULL, NULL,
    ARRAY[
        'https://picsum.photos/seed/sertar-biblioteca-1/600/800',
        'https://picsum.photos/seed/sertar-biblioteca-2/600/800',
        'https://picsum.photos/seed/sertar-biblioteca-3/600/800',
        'https://picsum.photos/seed/sertar-biblioteca-4/600/800'
    ]::text[],
    NULL, NULL, NULL, NULL, 'Stejar, 34 × 22 × 12 cm', 'Accesorii',
    'diverse-accesorii', 'physical',
    '[{"id":"v1","name":"Stejar natural","price_delta":0,"stock":3},{"id":"v2","name":"Stejar nucit","price_delta":18,"stock":5}]'::jsonb,
    NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata ramburs sau transfer bancar.","returns":"Returnare gratuită în 14 zile, în ambalajul original."}'::jsonb,
    true, 'active', ARRAY['accesorii','lemn','bibliotecă']
);


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
    'lampa-de-citit',
    'Lampă de citit din hârtie',
    'RV STUDIO',
    'O lampă caldă, pliabilă, din hârtie artizanală — lumina perfectă pentru paginile de seară, fără ecrane.',
    'O lampă de citit cu abajur din hârtie Canson și suport din lemn. Lumina este caldă și difuză, exact ce ai nevoie lângă fotoliu. Se pliază plat pentru depozitare și se deschide prin simpla rotire a suportului.',
    'Unele lumini nu sunt făcute să lumineze camera, ci doar pagina.',
    89.00, 14, 'RON',
    'https://picsum.photos/seed/lampa-citit-cover/600/800',
    'Fotografia lămpii de citit din hârtie',
    NULL, NULL, NULL,
    ARRAY[
        'https://picsum.photos/seed/lampa-citit-1/600/800',
        'https://picsum.photos/seed/lampa-citit-2/600/800',
        'https://picsum.photos/seed/lampa-citit-3/600/800'
    ]::text[],
    NULL, NULL, NULL, NULL, 'Hârtie + lemn, Ø 26 cm', 'Accesorii',
    'diverse-accesorii', 'physical',
    '[]'::jsonb, NULL, NULL,
    '{"delivery":"Livrare prin curier în 1–3 zile lucrătoare.","payment":"Plata ramburs sau transfer bancar.","returns":"Returnare gratuită în 14 zile, în ambalajul original."}'::jsonb,
    true, 'active', ARRAY['accesorii','lampă','lectură']
);

COMMIT;

