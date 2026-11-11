# Ghid de deploy — RV STUDIO

Checklist complet pentru trecerea de la dezvoltare locală la site-ul public.
Înlocuiește valorile din `{{...}}` cu datele tale reale. Fișierul este intenționat
scris ca o listă de bifat: poți lucra de sus în jos.

> **Ce conține aplicația:** React + Vite (frontend, servit de nginx) + Node/Express
> (backend) + PostgreSQL 16 + upload-uri persistente, toate prin Docker Compose.
> Fișierul de producție este `docker-compose.prod.yml`.

---

## 0. Rezumat: ce cumperi și de unde

| Ce | Recomandare | Unde | Cost orientativ |
| --- | --- | --- | --- |
| Domeniu `.ro` | Hosterion / Romarg / ClausWeb (registrars acreditați RotLD) | hosterion.ro, romarg.ro, clausweb.ro | ~50–80 RON/an |
| Domeniu `.com` / `.shop` | Cloudflare Registrar (la preț de cost) sau Porkbun / Namecheap | cloudflare.com/products/registrar, porkbun.com, namecheap.com | ~10–15 USD/an |
| DNS + CDN + SSL | Cloudflare Free | cloudflare.com | gratuit |
| Server (VPS) | Hetzner Cloud CX22 (2 vCPU / 4 GB / 40 GB) sau similar | hetzner.com/cloud, digitalocean.com, vultr.com, ovhcloud.com | ~5–10 €/lună |
| VPS românesc | Hosterion VPS / Romarg VPS | hosterion.ro, romarg.ro | ~30–60 RON/lună |
| Email tranzacțional | Brevo (300/zi gratuit), SMTP2GO, Mailgun, Resend sau Google Workspace | brevo.com, smtp2go.com, mailgun.com, resend.com | gratuit pentru început |
| Backup off-site | Hetzner Storage Box sau Backblaze B2 | hetzner.com/storage, backblaze.com | ~3–6 €/lună |
| Monitorizare uptime | Uptime Kuma (self-hosted) sau BetterStack Free | github.com/louislam/uptime-kuma, betterstack.com | gratuit |
| Auto-deploy din Git | GitHub Actions (inclus) sau Dokploy / Coolify pe VPS | github.com, dokploy.com, coolify.io | gratuit |

**Nu folosi shared hosting** (cPanel clasic): aplicația are nevoie de Docker,
porturi, volume persistente și un reverse proxy cu HTTPS.

Recomandarea mea: **domeniu `.ro` de la Hosterion/Romarg + DNS la Cloudflare +
VPS Hetzner CX22 + Caddy pentru HTTPS + GitHub Actions pentru deploy**. Este
ieftin, stabil și ușor de întreținut.

---

## 1. Domeniul

- [ ] Cumpără domeniul (ex. `rvstudio.ro`) de la un registrar acreditat RotLD.
- [ ] Creează cont Cloudflare și adaugă domeniul („Add a site”).
- [ ] La registrar, schimbă nameserverele cu cele date de Cloudflare.
- [ ] În Cloudflare → DNS:
  - `A  @  {{IP_SERVER}}` (proxied sau DNS only — vezi secțiunea TLS)
  - `CNAME  www  {{DOMENIU}}`
- [ ] Verifică propagarea: `dig +short {{DOMENIU}}` și `dig +short www.{{DOMENIU}}`.
- [ ] (Recomandat) Activează „Domain Lock”, „WHOIS privacy” dacă registrarul oferă.

> Pentru `.ro` nu există privacy WHOIS complet, dar poți folosi datele firmei.
> Completează datele reale ale firmei și în Admin → Setări → „Date firmă”.

---

## 2. Serverul (VPS)

- [ ] Creează VPS cu **Ubuntu 24.04 LTS**, 2 vCPU / 4 GB RAM / 40 GB SSD.
- [ ] Adaugă cheia ta SSH publică la creare (sau în panoul providerului).
- [ ] Notează IP-ul public: `{{IP_SERVER}}`.

Conectare și securizare de bază:

```bash
ssh root@{{IP_SERVER}}

# utilizator non-root pentru deploy
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
# lipește cheia publică în /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# firewall: doar SSH + HTTP + HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# update-uri automate
apt update && apt upgrade -y
apt install -y git curl ufw fail2ban unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
```

- [ ] (Recomandat) Dezactivează login-ul root cu parolă în `/etc/ssh/sshd_config`
      (`PermitRootLogin no`, `PasswordAuthentication no`) și repornește SSH.
- [ ] (Recomandat) `fail2ban` activ pentru SSH.
- [ ] Verifică: `docker --version` și `docker compose version`.

---

## 3. HTTPS / certificatul

Alege **una** dintre variante.

### Varianta A — Caddy pe server (recomandat, certificat Let's Encrypt automat)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```caddyfile
{{DOMENIU}}, www.{{DOMENIU}} {
    encode gzip
    reverse_proxy 127.0.0.1:8080
}
```

- [ ] Setează `FRONTEND_PORT=8080` în `.env` (Caddy ocupă 80/443).
- [ ] `sudo systemctl reload caddy`
- [ ] În Cloudflare, pentru emiterea certificatului poți folosi temporar
      „DNS only” (nor gri), apoi „Proxied” (nor portocaliu).
- [ ] Setează Cloudflare → SSL/TLS → **Full (strict)**.

### Varianta B — Cloudflare Tunnel (fără porturi deschise, fără certificat pe server)

- [ ] În Cloudflare Zero Trust → Tunnels creezi un tunnel către
      `http://localhost:8080`.
- [ ] Rulezi `cloudflared` pe server (serviciu systemd) și rutezi
      `{{DOMENIU}}` către tunnel.
- [ ] SSL/TLS → Full (strict). Nu mai deschizi 80/443 în firewall.

### Varianta C — nginx + certbot pe host

- [ ] instalezi nginx + `certbot --nginx -d {{DOMENIU}} -d www.{{DOMENIU}}`
- [ ] proxy către `127.0.0.1:8080`, `FRONTEND_PORT=8080` în `.env`.

> Aplicația are deja header-e de securitate în nginx-ul intern; HSTS se adaugă
> la terminatorul TLS (Caddy/Cloudflare/nginx).

---

## 4. Legarea site-ului la Git (deploy automat la fiecare push)

Ai două variante bune. Alege una.

### Varianta A — GitHub Actions + SSH (recomandat pentru acest repo)

Repository-ul are deja CI în `.github/workflows/ci.yml` (type-check, build,
teste, build Docker). Am adăugat și `.github/workflows/deploy.yml`, care rulează
după ce CI-ul trece și face deploy pe server prin SSH.

Pe server:

```bash
sudo mkdir -p /opt/rvstudio
sudo chown deploy:deploy /opt/rvstudio
git clone {{REPO_GIT_URL}} /opt/rvstudio/books
cd /opt/rvstudio/books
cp .env.example .env
nano .env          # completează valorile din secțiunea 5
```

În GitHub → Settings → Secrets and variables → Actions adaugă:

| Secret | Valoare |
| --- | --- |
| `DEPLOY_HOST` | `{{IP_SERVER}}` sau `{{DOMENIU}}` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | cheia **privată** SSH pentru userul `deploy` |
| `DEPLOY_PATH` | `/opt/rvstudio/books` |

- [ ] Verifică în `.github/workflows/deploy.yml` portul de healthcheck
      (implicit `8080`; schimbă dacă folosești alt `FRONTEND_PORT`).
- [ ] Fă push pe `main` → CI → deploy automat.
- [ ] (Recomandat) Branch protection pe `main`: doar PR + CI verde.

Workflow-ul face `git reset --hard origin/main`, apoi
`docker compose -f docker-compose.prod.yml up -d --build`. `.env` este ignorat de
git și rămâne pe server; volumele `db_data` și `uploads_data` nu se șterg.

### Varianta B — Dokploy sau Coolify (UI, Git integrat, TLS automat)

- [ ] Instalează Dokploy/Coolify pe VPS conform documentației oficiale
      (`docs.dokploy.com`, `coolify.io/docs`).
- [ ] Creează un proiect → „Docker Compose” → conectează repository-ul GitHub.
- [ ] Fișier compose: `docker-compose.prod.yml`.
- [ ] Setează variabilele de mediu din secțiunea 5 în UI (nu în git).
- [ ] Adaugă domeniul; platforma emite certificatul Let's Encrypt.
- [ ] Activează „Auto Deploy” pe push în `main`.

Ambele variante sunt valide; nu folosi simultan GitHub Actions și Dokploy pe
același server (se pot bate pe containere).

---

## 5. Credențiale de înlocuit (`.env` pe server)

Fișierul `.env` **nu se comite** (este în `.gitignore`). Folosește
`.env.example` ca șablon și completează:

```dotenv
# --- Baza de date ---
POSTGRES_USER=libraria
POSTGRES_PASSWORD={{PAROLA_DB_GENERATA}}
POSTGRES_DB=libraria

# --- Sesiuni ---
JWT_SECRET={{OPENSSL_RAND_HEX_32}}
JWT_TTL=7d

# --- Conturi de administrare (email|parola|Nume;...) ---
ADMIN_ACCOUNTS={{EMAIL_ADMIN_1}}|{{PAROLA_ADMIN_1}}|{{NUME_ADMIN_1}};{{EMAIL_ADMIN_2}}|{{PAROLA_ADMIN_2}}|{{NUME_ADMIN_2}}
ADMIN_RESET_PASSWORD=0

# --- Email real (SMTP) ---
SMTP_HOST={{SMTP_HOST_PROVIDER}}
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER={{SMTP_USER}}
SMTP_PASS={{SMTP_PASS}}
MAIL_FROM={{BRAND}} <{{EMAIL_EXPEDITOR}}>
CONTACT_TO={{EMAIL_COMENZI}}

# --- Site ---
PUBLIC_URL=https://{{DOMENIU}}
CORS_ORIGINS=https://{{DOMENIU}}
FRONTEND_PORT=8080

# --- SameDay (opțional; checkout-ul EasyBox e pe text liber) ---
SAMEDAY_API={{SAMEDAY_API_PRODUCTIE}}
SAMEDAY_USERNAME={{SAMEDAY_USER}}
SAMEDAY_PASSWORD={{SAMEDAY_PASS}}
SAMEDAY_REMEMBER_ME=1
```

Generare secrete:

```bash
openssl rand -hex 32     # JWT_SECRET
openssl rand -base64 24  # POSTGRES_PASSWORD
```

> Nu pune spații în jurul valorilor din `ADMIN_ACCOUNTS`; `;` și `|` sunt
> separatori, iar `#` și `$` pot fi interpretate de Docker Compose — evită-le în
> parole.

Ce **nu** trebuie să pui în git: `.env`, chei SSH, token-uri Cloudflare, parole
SMTP, parole baza de date, parole admin.

---

## 6. Primul boot

```bash
cd /opt/rvstudio/books
docker compose -f docker-compose.prod.yml config   # verifică env-urile obligatorii
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

- [ ] În log-uri trebuie să vezi `cont admin creat` pentru cele două conturi și
      `API listening`.
- [ ] Testează: `curl -I https://{{DOMENIU}}` și
      `curl https://{{DOMENIU}}/api/health`.
- [ ] Verifică `https://{{DOMENIU}}/robots.txt` și
      `https://{{DOMENIU}}/sitemap.xml` (trebuie să conțină domeniul real).
- [ ] Intră în `/autentificare` cu un cont de admin (email sau nume) și schimbă
      parola din Cont → Securitate dacă vrei.

> Baza de date pornește cu schema + produsele demo din `sql/init/`. Pe un volum
> nou, scripturile rulează o singură dată. Nu rula `docker compose down -v`
> decât dacă vrei să ștergi definitiv datele.

---

## 7. Emailul (SMTP) și livrabilitatea

Aplicația trimite: confirmări de comandă (owner + client), schimbări de status,
resetare parolă, newsletter, formular de contact.

- [ ] Alege un provider SMTP: **Brevo** (300 emailuri/zi gratuit), **SMTP2GO**
      (1000/lună), **Mailgun**, **Resend** sau **Google Workspace**.
- [ ] Verifică domeniul în provider (DNS records).
- [ ] Adaugă în DNS:
  - `TXT @ "v=spf1 include:{{SPF_INCLUDE_PROVIDER}} ~all"`
  - DKIM (valoarea dată de provider, de obicei `TXT {{SELECTOR}}._domainkey`)
  - `TXT _dmarc "v=DMARC1; p=none; rua=mailto:{{EMAIL_DMARC}}"`
- [ ] Setează în `.env`: `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_SECURE=false`,
      `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `CONTACT_TO`.
- [ ] Testează din **Admin → Setări → Testează emailul**.
- [ ] Trimite o comandă test și verifică inbox + spam (owner și client).

> Gmail SMTP nu este recomandat în producție (limite zilnice, deliverability).
> `MAIL_FROM` trebuie să folosească domeniul verificat, altfel emailurile ajung
> în spam sau sunt respinse.

---

## 8. SameDay EasyBox și FANbox

- EasyBox: checkout-ul cere **numele lockerului + adresa exactă** ca text liber.
  Datele ajung în comandă și în emailul ownerului. Nu ai nevoie de API SameDay
  pentru asta.
- FANbox: la fel, text liber; plata se face cu cardul la locker (sau ramburs,
  după regulile FAN).
- [ ] Dacă vrei integrare SameDay completă (listă live de lockere, AWB automat),
      ai nevoie de contract și credențiale SameDay:
      `SAMEDAY_API` (endpoint de **producție**, nu demo), `SAMEDAY_USERNAME`,
      `SAMEDAY_PASSWORD`, `SAMEDAY_REMEMBER_ME=1`.
- [ ] Pentru FANbox cu AWB automat ar fi nevoie de integrarea API FAN Courier —
      nu este implementată; comenzile se procesează manual pe baza datelor din email.
- [ ] Editează textele popup-urilor EasyBox/FANbox și taxele de livrare din
      **Admin → Setări → Checkout, livrare și lockere**.

---

## 9. Conținutul ownerului și datele legale

Intră ca admin și completează:

- [ ] **Setări → Identitate**: nume brand, nume lung, slogan, descriere.
- [ ] **Setări → Imagini**: hero + logo (fișiere reale, nu demo).
- [ ] **Setări → Contact și social**: email public, telefon, Instagram, Facebook.
- [ ] **Setări → Date firmă**: denumire, CUI, Registrul Comerțului, adresă,
      email legal (apar în Termeni/Confidențialitate/Footer).
- [ ] **Setări → Informații pentru clienți**: livrare, plată, retur, text subsol.
- [ ] **Setări → Pagina principală / Pagina produs / Pagina Despre / Contact /
      Newsletter**: textele editabile.
- [ ] **Setări → Checkout, livrare și lockere**: taxe, note de plată, popup-uri.
- [ ] **Produse**: șterge produsele demo, adaugă produsele reale, imagini,
      descrieri, prețuri, stoc, variante, produse digitale.
- [ ] **Categorii**: nume, descriere, ordine.
- [ ] Verifică paginile legale (`/termeni`, `/confidentialitate`, `/cookies`).
- [ ] Dacă folosești analytics/cookies, adaugă banner + actualizează politica.
- [ ] Șterge comenzile/abonații de test înainte de lansare (opțional, din DB).

> `index.html` conține meta OG cu URL-uri relative. După ce domeniul e live,
> actualizează `og:image` și `canonical` la `https://{{DOMENIU}}/...` pentru
> previzualizări corecte pe social media.

---

## 10. Backup și restaurare

- [ ] Creează `/opt/rvstudio/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/rvstudio/books
STAMP=$(date +%F-%H%M)
OUT=/opt/rvstudio/backups
mkdir -p "$OUT"
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$OUT/db-$STAMP.sql.gz"
# numele volumului: verifică cu `docker volume ls` (ex. books_uploads_data)
docker run --rm -v books_uploads_data:/data -v "$OUT":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .
find "$OUT" -type f -mtime +14 -delete
```

- [ ] `chmod +x /opt/rvstudio/backup.sh` și rulează-l o dată manual.
- [ ] Cron zilnic (user `deploy`): `crontab -e`
      `0 3 * * * /opt/rvstudio/backup.sh >> /var/log/rvstudio-backup.log 2>&1`
- [ ] Copiază backup-urile off-site (Hetzner Storage Box / Backblaze B2 / rsync).
- [ ] Testează restaurarea pe un mediu separat:

```bash
gunzip -c db-{{DATA}}.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker run --rm -v books_uploads_data:/data -v /opt/rvstudio/backups:/backup alpine \
  sh -c "cd /data && tar xzf /backup/uploads-{{DATA}}.tar.gz"
```

> Fără test de restaurare, backup-ul nu contează. Fă testul înainte de lansare.

---

## 11. Securitate și monitorizare

- [ ] `.env` doar pe server, cu permisiuni `chmod 600 .env`, owner `deploy`.
- [ ] Parole unice pentru DB/JWT/admin/SMTP, salvate în password manager.
- [ ] SSH doar cu chei, root login dezactivat, `fail2ban` activ.
- [ ] Firewall: doar 22, 80, 443 (sau doar 22 dacă folosești Cloudflare Tunnel).
- [ ] HTTPS obligatoriu, Cloudflare SSL „Full (strict)”, HSTS la proxy.
- [ ] Baza de date nu este expusă public (compose-ul de prod nu publică 5432).
- [ ] Actualizează periodic: `apt upgrade`, `docker compose pull` pentru imagini,
      rebuild la aplicație.
- [ ] Monitorizează: `https://{{DOMENIU}}/api/health`, expirarea certificatului,
      spațiu pe disc (`df -h`), logs (`docker compose logs`).
- [ ] (Opțional) Cloudflare Access pentru `/admin` sau WAF.
- [ ] (Opțional) Sentry pentru erori frontend/backend.
- [ ] Nu există 2FA în aplicație; folosește parole lungi + email securizat.

> Atenție la `docker compose down -v`: șterge volumele (baza de date + uploads).
> Nu îl rula în producție.

---

## 12. Checklist funcțional înainte de lansare

Testează pe domeniul real, nu pe localhost:

- [ ] Home încarcă, imaginile și fonturile apar; mobil OK.
- [ ] Înregistrare client → login → logout → resetare parolă (email primit).
- [ ] Login admin cu **email** și cu **nume de utilizator** (RalucaRV / StefanLucian).
- [ ] Admin: adaugă/editează/șterge produs, upload copertă, publică/ciornește.
- [ ] Admin: categorii, comenzi, statusuri, notă internă, abonați, CSV.
- [ ] Checkout curier: comandă completă, email owner + client, scădere stoc.
- [ ] Checkout EasyBox: popup, nume + adresă locker, comandă, email owner.
- [ ] Checkout FANbox: popup, nume + adresă locker, comandă, email owner.
- [ ] Plata/nota de plată apare corect în checkout și pe pagina de succes.
- [ ] Urmărire comandă cu referință + email.
- [ ] Produs digital: link livrat în email.
- [ ] Adrese salvate în cont.
- [ ] Newsletter: abonare, email, apariție în admin, export CSV, ștergere.
- [ ] Formular contact: mesaj primit pe `CONTACT_TO`.
- [ ] Pagini legale și date firmă corecte.
- [ ] `/robots.txt`, `/sitemap.xml`, 404, meta title/description.
- [ ] Backup manual + restaurare testată.
- [ ] Verifică logurile după test: fără 500/eroare SMTP.

---

## 13. Tabel „ce înlocuiesc cu datele ownerului”

| Unde | Ce înlocuiești |
| --- | --- |
| Registrar | nume domeniu, date firmă, nameservere Cloudflare |
| Cloudflare | cont, DNS A/CNAME, SSL Full strict, eventual Access/WAF |
| Server | IP, user `deploy`, cheie SSH, `/opt/rvstudio/books` |
| `.env` | `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_ACCOUNTS`, `SMTP_*`, `MAIL_FROM`, `CONTACT_TO`, `PUBLIC_URL`, `CORS_ORIGINS`, `SAMEDAY_*`, `FRONTEND_PORT` |
| GitHub Secrets | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH` |
| Admin → Setări | brand, contact, social, date firmă, texte, taxe livrare, popup-uri |
| Admin → Produse/Categorii | catalogul real, imagini, prețuri, stoc |
| SMTP provider | user/parolă, SPF, DKIM, DMARC |
| SameDay | endpoint producție + user/parolă (opțional) |
| Backup | destinație off-site + program cron |
| Monitorizare | URL healthcheck + alertă email/Telegram |

---

## 14. Costuri orientative (verifică înainte de cumpărare)

| Element | Lunar | Anual |
| --- | --- | --- |
| Domeniu `.ro` | — | ~50–80 RON |
| VPS Hetzner CX22 | ~5–6 € | ~60–72 € |
| Backup Storage Box | ~3,5 € | ~42 € |
| Email (Brevo/SMTP2GO) | 0 € (plan gratuit) | 0 € |
| Cloudflare DNS/CDN | 0 € | 0 € |
| **Total aproximativ** | **~9–10 €/lună** | **~110–130 €/an** |

---

## 15. Probleme frecvente

| Simptom | Cauză probabilă | Verifică |
| --- | --- | --- |
| 502 Bad Gateway | backend oprit / DB unhealthy / env greșit | `docker compose ps`, `logs backend` |
| Certificat SSL eșuat | DNS greșit, port 80 blocat, proxy Cloudflare | `dig`, `ufw status`, mod SSL |
| Emailuri în spam | SPF/DKIM lipsă, `MAIL_FROM` greșit | DNS records, test provider |
| Admin nu se poate loga | `ADMIN_ACCOUNTS` greșit / cont vechi șters | log backend, `ADMIN_RESET_PASSWORD=1` |
| Upload-urile dispar la redeploy | volumul nu e persistent | `docker volume ls`, compose volumes |
| Deploy eșuează la build | RAM insuficient pe VPS | swap 2 GB sau VPS 4 GB |
| Datele au dispărut | s-a rulat `down -v` | restaurează backup-ul; nu rula `down -v` |

---

## 16. Primele 24 de ore după lansare

- [ ] Monitorizează uptime + logs.
- [ ] Trimite 2–3 comenzi reale/test și verifică emailurile.
- [ ] Verifică Search Console (dacă îl folosești) și sitemap-ul.
- [ ] Confirmă backup-ul de la 03:00.
- [ ] Notează credențialele finale în password manager.
- [ ] Setează o alertă de expirare domeniu și certificat.



