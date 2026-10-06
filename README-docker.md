# Librăria — Docker & database

Full-stack Docker setup for the bookstore: PostgreSQL, a Node/Express backend
**template**, and the React frontend served by nginx.

## Quick start

```bash
# (optional) create your own env — defaults are fine for local dev
cp .env.example .env

# build & start all services
docker compose up --build

# open the app
open http://localhost:8080
```

The first `db` container boot applies `sql/init/01_schema.sql` then
`sql/init/02_seed.sql` automatically (filename order, only on an empty volume).

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

The `backend/` image serves a real Express API backed by Postgres:

- `GET  /api/health` — live DB connectivity check
- `GET  /api/books` — public active catalog (nested `Book` shape)
- `GET  /api/books/all` — full catalog incl. drafts (admin)
- `POST /api/books`, `PUT /api/books/:id`, `DELETE /api/books/:id` — catalog CRUD (admin)
- `POST /api/auth/register` — create account, persists to `users` with a bcrypt hash
- `POST /api/auth/login` — authenticate, returns a JWT session token
- `GET  /api/auth/me` — resolve/restore a session from the stored token
- `POST /api/auth/request-password-reset` — sends a reset email via the mail service
- `GET  /api/mail/status`, `POST /api/mail/test` — mail diagnostics + test send

`/api/orders`, `/api/addresses`, `/api/cart` and `/api/users` remain stubbed (501)
for a later pass.

Demo accounts (seeded with real bcrypt hashes): `admin@libraria.ro / admin123`
and `cititor@example.com / parola123`.

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

```bash
curl -X POST http://localhost:8080/api/mail/test \
  -H 'Content-Type: application/json' \
  -d '{"to":"someone@gmail.com","subject":"Salut de la Librăria"}'
```

Then open **http://localhost:8025** to see it.

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

### Notes

- SMTP credentials are only read from environment variables — nothing is
  committed to the repo (see `.env.example`).
- Security: passwords are hashed with **bcrypt** (cost 10); session tokens are
  signed JWTs; admin-only routes reject anonymous (401) and non-admin (403)
  callers.
