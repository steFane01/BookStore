# Librăria — Docker & database

Full-stack Docker setup for the bookstore: PostgreSQL, a Node/Express backend
**template**, and the React frontend served by nginx.

## Quick start

```bash
# (optional) create your own env — defaults are fine for local dev
cp .env.example .env
# pentru un cont de admin, setează ADMIN_ACCOUNTS în .env (vezi secțiunea „Admin accounts")

# build & start all services
docker compose up --build

# open the app
open http://localhost:8080
```

> **Producție:** pașii completi (domeniu, VPS, HTTPS, auto-deploy din Git,
> credențiale, backup, monitorizare) sunt în [`DEPLOY.md`](./DEPLOY.md).

The first `db` container boot applies every `sql/init/*.sql` file automatically,
in filename order, only on an empty volume (`01_schema`, `02_seed`, then the
incremental migrations up to `06_migration_category_pages`). On existing volumes
`backend/src/db.js#ensureSchema()` applies the same idempotent changes at boot.

## Services

| Service    | Purpose                                                      | Host port |
|------------|--------------------------------------------------------------|-----------|
| `db`       | PostgreSQL 16 — schema + seed                                | 5432      |
| `backend`  | Node/Express API (auth, catalog CRUD, mail)                  | — (internal, 4000) |
| `frontend` | nginx serving the React build, SPA fallback, `/api` → backend| 8080      |
| `mailpit`  | Local SMTP catch-all + web UI to view outgoing email         | 8025 (UI) / 1025 (SMTP) |

## Databases tables (PostgreSQL)

Created by `sql/init/01_schema.sql`:

| Table            | Mirrors (frontend type)           |
|------------------|-----------------------------------|
| `users`          | `User` (+ password_hash for later)|
| `books`          | `Book`                            |
| `addresses`      | `CustomerAddress`                 |
| `orders`         | `OrderDraft` (shipping flattened) |
| `order_lines`    | `OrderLine` (snapshot per purchase)|
| `cart_items`     | optional server-side cart         |
| `password_resets`| single-use password-reset tokens  |

Enums: `user_role` (`customer`/`admin`), `book_status` (`draft`/`active`),
`order_status` (`pending`/`processing`/`shipped`/`delivered`/`cancelled`).

## Connecting to the database

From the host (any PG client — psql, pgAdmin, DBeaver):

```
host:     localhost
port:     5432
database: libraria
user:     libraria
password: libraria_dev_only   (from .env / compose default)
```

Or inside the container:

```bash
docker compose exec db psql -U libraria -d libraria
# then e.g.:
\dt                 # list tables
\d books            # describe a table
SELECT * FROM books;
```

## Backend — implemented endpoints

The `backend/` image serves the real Express API backed by Postgres:

- `GET  /api/health` — DB connectivity check
- `GET  /api/books` — public active catalog (nested `Book` shape)
- `GET  /api/books/:id` — single product
- `GET  /api/books/all` — full catalog incl. drafts + private digital links (admin)
- `POST/PUT/DELETE /api/books[/:id]` — product CRUD (admin)
- `GET  /api/books/categories` — storefront categories
- `POST/PUT/DELETE /api/books/categories[/:id]` — category CRUD (admin)
- `POST /api/auth/register|login` — accounts with bcrypt hashes + JWT session
- `GET/PATCH /api/auth/me` — resolve session / update the display name
- `POST /api/auth/change-password` — change the password while signed in
- `POST /api/auth/request-password-reset|reset-password` — single-use email tokens
- `GET/PUT /api/settings` — owner-editable storefront content (brand, contact, legal)
- `POST /api/forms/contact|newsletter` — public forms (rate limited)
- `GET/DELETE /api/newsletter[/:email]` + `GET /api/newsletter/export` — subscribers (admin)
- `POST /api/newsletter/send` — trimite emailul de ofertă tuturor abonaților (admin; `testTo` pentru o copie de test)
- `POST /api/orders` — place an order (guest or signed-in): prices and stock are
  re-read from the catalog, stock is reserved inside the transaction, the owner
  gets the full delivery details by email and the customer gets a confirmation
  (including download links for digital products)
- `GET  /api/orders[/all]` — own orders / every order (admin)
- `POST /api/orders/lookup` — public tracking with reference + checkout email
- `PATCH /api/orders/:id` — status + internal note (admin); emails the customer
- `GET/POST/PUT/DELETE /api/addresses[/:id]` — saved addresses (scoped per user)
- `POST /api/upload` — admin image upload (validated by magic bytes)
- `GET  /api/easyboxes` — SameDay EasyBox pickup points
- `GET  /api/mail/status`, `POST /api/mail/test` — SMTP diagnostics (admin only)
- `GET  /robots.txt`, `GET /sitemap.xml` — SEO files built from `PUBLIC_URL`

Every public write endpoint is rate limited; auth/admin/order scoping is enforced
server-side. `/api/cart` and `/api/users` remain stubs.

## Admin accounts

No credentials are committed anywhere. At startup the backend creates or
updates every administrator from `ADMIN_ACCOUNTS` (`backend/src/bootstrap.js`):

```dotenv
ADMIN_ACCOUNTS=ralucarv@rvstudio.ro|parola-puternica|RalucaRV;stefanlucian@rvstudio.ro|alta-parola|StefanLucian
```

Format: `email|password|Name` entries separated by `;` (no spaces around the
values). The legacy single-account `ADMIN_EMAIL` + `ADMIN_PASSWORD` +
`ADMIN_NAME` variables still work and are appended to the list when set.

Admins can sign in at `/autentificare` with their **email or their display name**
(e.g. `RalucaRV`) plus the password. The env password is only the *initial* one:
it never overwrites a password changed from **Cont → Securitate**. To force all
env passwords back, set `ADMIN_RESET_PASSWORD=1`, restart once, then set it back
to `0`. Production refuses to start when neither `ADMIN_ACCOUNTS` nor the legacy
pair is configured.

To remove an old admin account, delete it from the `users` table (or from a SQL
client): `DELETE FROM users WHERE role = 'admin' AND email = '...';`. The
bootstrap never deletes accounts, it only creates/promotes the configured ones.

## Mail service

A mail stack is included and wired up:

- By default the backend sends through the **`mailpit`** service (SMTP on
  `:1025`), which catches every message. Open **http://localhost:8025** to read
  them — no inbox or credentials needed. This is perfect for testing while you
  have no real domain yet.
- Emails are sent with **Nodemailer** (`backend/src/mailer.js`). Registration
  sends a welcome email automatically; the reset and test endpoints are also
  wired.

### Sending a test email

The endpoint is admin-only and requires the session token:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@rvstudio.ro","password":"…"}' | jq -r .token)

curl -X POST http://localhost:8080/api/mail/test \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"to":"someone@gmail.com"}'
```

You can also do it from the UI: **Admin → Setări → Testează emailul**.

### Delivering to a real inbox (e.g. test to your Gmail now)

No domain is needed — Gmail's SMTP server with an **App Password** works today.
In `.env` add:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
MAIL_FROM=Librăria <you@gmail.com>
```

then restart the backend (`docker compose up -d`). When `SMTP_HOST` is set, the
backend uses it instead of Mailpit, and `POST /api/mail/test` will deliver to
your real Gmail. When you later get a real domain for your site/mail, point
these at your provider instead and set `SMTP_SECURE=true`.

### Deliverability (Gmail → Yahoo / Gmail)

A very common gotcha when sending from a Gmail account to **Yahoo** (or Gmail
itself) is mail landing in **Spam** or bouncing with "DMARC / SPF / DKIM"
warnings. This happens when the `From` address does **not** match the SMTP
account the server authenticates as:

- **Gmail** *requires* either SPF **or** DKIM to pass for the From domain.
- **Yahoo** *requires* **both** SPF **and** DKIM to pass, with **DMARC alignment**
  (the From domain must equal — or be a subdomain of — the domain that signed DKIM
  and that publishes SPF).

Since the app relays through your own Gmail account, Gmail already signs and
aligns every message it sends **for `@gmail.com` addresses**. The rule is
therefore:

- **Keep `MAIL_FROM` on your Gmail address** — e.g. `Librăria <you@gmail.com>`.
  The backend now **defaults `From` to `SMTP_USER`** when SMTP is active and
  `MAIL_FROM` is unset, precisely so the From stays aligned and Yahoo/Gmail don't
  discard the mail. **Never** set it to a bare domain like `no-reply@libraria.local`
  — that domain has no DNS records, so SPF/DKIM always fail and Yahoo rejects it.
- Don't email the same unrestricted recipients too aggressively from a free Gmail
  address; Gmail enforces per-day sending limits.
- For a production store, sign up for a real domain + a transactional provider
  (SendGrid, Postmark, Amazon SES, …) and add the SPF/DKIM DNS records that
  provider gives you — then point `SMTP_HOST`/`MAIL_FROM` at it. That is the only
  durable fix for high-volume or brand-domain sending.

### Notes

- SMTP credentials are only read from environment variables — nothing is
  committed to the repo (see `.env.example`).
- Security: passwords are hashed with **bcrypt** (cost 10); session tokens are
  signed JWTs; admin-only routes reject anonymous (401) and non-admin (403)
  callers.

## Production

Use the production compose file — no public database port, no Mailpit, `NODE_ENV=production`
and required secrets (the stack refuses to start if one is missing):

```bash
cp .env.example .env       # completează parole, JWT_SECRET, SMTP, PUBLIC_URL
# JWT_SECRET: openssl rand -hex 32
# POSTGRES_PASSWORD / parolele din ADMIN_ACCOUNTS: parole lungi, unice
docker compose -f docker-compose.prod.yml up -d --build
```

Then put a TLS terminator in front (Caddy, Traefik or nginx) that proxies to
`FRONTEND_PORT` (80 by default) and redirects HTTP → HTTPS. Set `PUBLIC_URL` to
the real `https://…` domain so email links, `robots.txt` and `sitemap.xml` are
correct. Back up the `db_data` and `uploads_data` volumes.

## Tests

```bash
cd backend && npm test      # node --test: pricing/stock, escaping, settings
cd .. && npm run build      # tsc -b + vite build (what CI runs)
```
