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

The `backend/` image serves a real Express API backed by Postgres:

- `GET  /api/health` — live DB connectivity check
- `GET  /api/books` — public active catalog (nested `Book` shape)
- `GET  /api/books/all` — full catalog incl. drafts (admin)
- `POST /api/books`, `PUT /api/books/:id`, `DELETE /api/books/:id` — catalog CRUD (admin)
- `POST /api/auth/register` — create account, persists to `users` with a bcrypt hash
- `POST /api/auth/login` — authenticate, returns a JWT session token
- `GET  /api/auth/me` — resolve/restore a session from the stored token
- `POST /api/auth/request-password-reset` — sends a reset email with a clickable link
- `POST /api/auth/reset-password` — set a new password via the single-use token
- `GET  /api/mail/status`, `POST /api/mail/test` — mail diagnostics + test send
- `POST /api/forms/contact` — email the contact-form message to the owner's mailbox
- `POST /api/forms/newsletter` — email a newsletter confirmation to the subscriber
- `POST /api/orders` — place an order: inserts `orders` + `order_lines` atomically,
  returns the order with a unique registration number (`LB-YYYY-XXXXXX`) and emails
  the exact delivery details to the owner's mailbox (for the courier partner)
- `GET  /api/orders` — current user's orders (newest first)
- `GET  /api/orders/all` — every order (admin only)
- `GET  /api/orders/:id` — single order by id or reference (customer sees own, admin any)
- `GET  /api/addresses` — current user's saved addresses
- `POST /api/addresses` — save a new address for the current user
- `PUT  /api/addresses/:id` — update one saved address
- `DELETE /api/addresses/:id` — remove one saved address

`/api/cart` and `/api/users` remain stubbed (501) for a later pass.

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
