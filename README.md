# Association Platform (Docker)

Modern, secure, Dockerized stack for a non-profit association:
- Drupal 10 for website and member area
- Payment API microservice for online payments and subscriptions (Stripe ready; Flutterwave/GoCardless supported)
- Traefik reverse proxy with automatic HTTPS (Let's Encrypt)
- Keycloak for SSO (optional)

## Architecture
- `drupal` (PHP-FPM) + `drupal-nginx` (Nginx) serve the site at `https://$DRUPAL_DOMAIN`
- `drupal-db` (Postgres) stores Drupal data
- `payment-api` provides REST endpoints at `https://$API_DOMAIN`
- `payments-db` (Postgres) stores payment/subscription data
- `pgadmin` web interface for database management at `https://$PGADMIN_DOMAIN`
- `mailserver` Axigen mail server with SMTP/IMAP/POP3 and webmail at `https://$WEBMAIL_DOMAIN`
- `traefik` terminates TLS and routes to services
- `keycloak` for authentication at `https://$AUTH_DOMAIN` (dev mode)

## Prerequisites
- Docker Desktop (Windows)
- A domain with DNS A records pointing to your host/public IP:
  - `$DRUPAL_DOMAIN`, `$API_DOMAIN`, `$AUTH_DOMAIN`
- Outbound connectivity for Let's Encrypt (ports 80/443 open)

## Quick Start
1. Copy env template and fill values
```powershell
Copy-Item .env.example .env
# Edit .env to set domains, emails, DB passwords, provider keys
```
2. **Local Development (HTTP, no certificates)**
```powershell
# Use *.localhost subdomains (no DNS needed)
Set domains in .env:
  DRUPAL_DOMAIN=drupal.localhost
  API_DOMAIN=api.localhost
  AUTH_DOMAIN=auth.localhost
  PGADMIN_DOMAIN=pgadmin.localhost
  WEBMAIL_DOMAIN=webmail.localhost
  MAILADMIN_DOMAIN=mailadmin.localhost

# Start services
docker compose up -d --build

# Access via Traefik HTTP routing:
# - Drupal: http://drupal.localhost
# - Payment API: http://api.localhost/health
# - Keycloak: http://auth.localhost
# - pgAdmin: http://pgadmin.localhost (admin@association.dev / admin123)
# - Webmail: http://webmail.localhost
# - Mail Admin: http://mailadmin.localhost (admin / admin123)
# - Traefik Dashboard: http://localhost:8888/dashboard/

# Or direct ports:
# - Drupal: http://localhost:8080
# - Payment API: http://localhost:3000
# - Keycloak: http://localhost:8081
# - pgAdmin: http://localhost:5050
# - Mail Admin: http://localhost:9000
```

3. **Production (HTTPS with Let's Encrypt)**
```powershell
# Prerequisites:
# - Public server with ports 80/443 open
# - DNS A records: drupal.example.com, api.example.com, auth.example.com → server IP

# Set real domains in .env:
  ACME_EMAIL=admin@example.com
  DRUPAL_DOMAIN=www.example.com
  API_DOMAIN=api.example.com
  AUTH_DOMAIN=auth.example.com
  PGADMIN_DOMAIN=pgadmin.example.com
  WEBMAIL_DOMAIN=webmail.example.com
  MAILADMIN_DOMAIN=mailadmin.example.com
  MAIL_DOMAIN=example.com

# Switch to production Traefik config:
# Comment out local dev overrides in docker-compose.yml:
# - Remove ports 8080, 3000, 8081, 8888 exposure
# - Change router entrypoints from 'web' to 'websecure'
# - Add back TLS cert resolver labels
# - Set --api.dashboard=false or secure it

# Fix acme.json permissions (Linux/Mac):
chmod 600 ./traefik/acme.json

# Start
docker compose up -d --build
```

## Drupal Setup (Members Area + Dues)

### Thème personnalisé: Association Solidaire

Un thème moderne et responsive spécialement conçu pour les associations à but non lucratif est inclus.

**Activation rapide :**
```powershell
# Activer le thème via Drush
docker compose exec drupal bash /var/www/html/modules/custom/association_theme/install.sh

# Ou manuellement
docker compose exec drupal drush theme:enable association_theme -y
docker compose exec drupal drush config:set system.theme default association_theme -y
docker compose exec drupal drush cr
```

**Caractéristiques :**
- Design solidaire avec palette de couleurs dédiée (bleu, orange, vert)
- Responsive mobile-first
- Composants : Hero section, cards, statistiques d'impact, formulaires de don
- Régions configurables : header, hero, sidebar, footer (3 colonnes)
- Animations au scroll et transitions fluides
- Templates optimisés pour actualités, projets, témoignages

**Documentation complète :**
- `drupal-modules/custom/association_theme/README.md` - Guide d'utilisation
- `drupal-modules/custom/association_theme/EXAMPLES.md` - Exemples de contenu HTML

### Modules recommandés
Install modules (via UI or Composer inside the container):
- JSON:API, REST, User, Pathauto, Redirect
- Group or Organic Groups (for members-only content)
- Webform (for onboarding), or Drupal Commerce if you need rich e-commerce
- Keycloak or OpenID Connect (if using Keycloak SSO)

### Custom module: Association Payments
- Path: `drupal-modules/custom/association_payments`
- Provides:
  - `/association/checkout` – starts checkout with configured provider (Stripe/Flutterwave/GoCardless)
  - `/association/checkout/success` and `/association/checkout/cancel` – return pages
  - `/association/webhook` – receives activation payload from Payment API and grants role `member`
  - Block: `Association: Pay membership dues` – shows a "Payer ma cotisation" button only to logged-in non-members

Enable it in Drupal UI (Extend), then configure at `Administration > Configuration > Association > Association Payments`:
- Payment API base URL: e.g. `https://$API_DOMAIN`
- Default provider, amount (cents) and currency
- Webhook Shared Token: arbitrary secret; set the same header `X-Association-Token` on the Payment API callback if you use it

Usage:
- Add a menu/link to `/association/checkout` for members.
- For GoCardless, the module completes the redirect flow automatically on the success page.
 - Place the block at `Structure > Block layout` and assign it to a region visible to authenticated users.

Basic flow:
- Create roles: `member`, `admin`
- Protect a section `Members` with role-based access
- For payments: show a button "Payer la cotisation" that calls the Payment API to create a subscription checkout, then redirects the user
- Handle webhooks from Stripe to mark members as active upon successful payment (via a simple custom module or Webhooks -> Drupal route)

## Payment API
- Base URL: `https://$API_DOMAIN`
- Endpoints:
  - `GET /health` – readiness probe
  - `POST /v1/checkout/subscription` – create a subscription checkout URL
    - Body: `{ provider: "stripe"|"flutterwave"|"gocardless", email, name?, amount_cents, currency, success_url, cancel_url }`
    - Response:
      - Stripe/Flutterwave: `{ url, subscription_id }`
      - GoCardless: `{ url, subscription_id, redirect_flow_id, session_token }` (call completion endpoint after redirect)
  - `POST /v1/webhooks/stripe` – Stripe webhook endpoint (set this in Stripe dashboard)
  - `POST /v1/webhooks/flutterwave` – Flutterwave webhook endpoint (set `verif-hash`)
  - `POST /v1/webhooks/gocardless` – GoCardless webhook endpoint (signature verification recommended)
  - `POST /v1/gocardless/complete` – Complete redirect flow and create subscription after user returns
  - `GET /v1/subscriptions?email=...` – list subscriptions for a member

Stripe notes:
- Set `STRIPE_SECRET_KEY` in `.env`
- Optionally set `STRIPE_WEBHOOK_SECRET` for signature verification
Flutterwave notes:
- Set `FLW_SECRET_KEY` and `FLW_WEBHOOK_SECRET` (dashboard > webhook secret)
- Hosted payment is created with a monthly `payment_plan`

GoCardless notes:
- Set `GOCARDLESS_ACCESS_TOKEN`, `GOCARDLESS_ENV` (`sandbox` or `live`), and webhook secret
- Flow: create redirect via `/v1/checkout/subscription` (provider `gocardless`) → user approves → frontend calls `/v1/gocardless/complete` with `redirect_flow_id`, `session_token`, `subscription_id`, `amount_cents`, `currency`

## Security
- Traefik enforces HTTPS, redirects HTTP->HTTPS
- Security headers via Traefik `secureHeaders` middleware + Nginx config
- Separate Postgres instances for Drupal and payments
- Use strong passwords and rotate provider API keys
- Keycloak runs in dev mode; for production, run `start` and configure a real database
- pgAdmin should be restricted in production (disable public access or add IP whitelisting)

## Database Management (pgAdmin)
- Access: `http://pgadmin.localhost` or `http://localhost:5050`
- Default credentials: `admin@association.dev` / `admin123` (change in `.env`)

**Adding database connections:**
1. Login to pgAdmin
2. Right-click `Servers` → `Register` → `Server`

**Drupal Database:**
- General → Name: `Drupal DB`
- Connection:
  - Host: `drupal-db`
  - Port: `5432`
  - Database: `association_db`
  - Username: `association`
  - Password: `association_pass` (from `.env`)

**Payments Database:**
- General → Name: `Payments DB`
- Connection:
  - Host: `payments-db`
  - Port: `5432` (internal; externally 5433)
  - Database: `payments_db`
  - Username: `payments`
  - Password: `payments_pass` (from `.env`)

## Email Server (Axigen)
Complete mail server with SMTP/IMAP/POP3 support for sending and receiving emails.

**Access:**
- WebAdmin: `http://mailadmin.localhost` or `http://localhost:9000`
- Webmail: `http://webmail.localhost` (after configuration)
- Default admin password: `admin123` (change in `.env`)

**Initial Setup:**
1. Access WebAdmin at http://localhost:9000
2. Follow installation wizard:
   - Accept license agreement
   - Set admin password (or use `MAIL_ADMIN_PASSWORD` from `.env`)
   - Configure domain (use `MAIL_DOMAIN` value, e.g., `association.local`)
   - Create initial mailboxes

**SMTP/IMAP Configuration for Drupal:**
- SMTP Host: `mailserver`
- SMTP Port: `587` (submission) or `25` (standard)
- IMAP Host: `mailserver`
- IMAP Port: `143` (standard) or `993` (SSL)
- Authentication: Use created mailbox credentials

**Protocols Available:**
- SMTP: ports 25, 587 (submission), 465 (SMTPS)
- IMAP: ports 143, 993 (IMAPS)
- POP3: ports 110, 995 (POP3S)

**Production Notes:**
- Configure SPF, DKIM, and DMARC records in DNS
- Set MX record: `mail.example.com` pointing to server IP
- Enable SSL/TLS certificates for mail protocols
- Configure proper reverse DNS (PTR record)

## Backups
- Schedule volume snapshots or database dumps using `pg_dump` for `drupal-db` and `payments-db`

## Useful Commands
```powershell
# Logs
docker compose logs -f traefik
docker compose logs -f drupal-nginx
docker compose logs -f payment-api

# Restart a service
docker compose restart payment-api

# Exec into containers
docker compose exec drupal bash
docker compose exec payment-api sh

# Check Traefik detected routes
curl http://localhost:8888/api/http/routers | ConvertFrom-Json | Format-Table name, rule, status

# Database backups
docker compose exec drupal-db pg_dump -U association association_db > drupal-backup.sql
docker compose exec payments-db pg_dump -U payments payments_db > payments-backup.sql

# Restore database
Get-Content drupal-backup.sql | docker compose exec -T drupal-db psql -U association association_db
```

## Traefik Configuration
- **Local dev**: HTTP routing on *.localhost subdomains (no certificates)
- **Production**: HTTPS with Let's Encrypt auto-renewal
- Dashboard accessible at http://localhost:8888/dashboard/ (local only)
- For production, disable dashboard or add authentication via `traefik/dynamic.yml`

To secure Traefik dashboard in production, add to `traefik/dynamic.yml`:
```yaml
http:
  middlewares:
    auth:
      basicAuth:
        users:
          - "admin:$apr1$..."  # Use htpasswd to generate
  routers:
    dashboard:
      rule: "Host(`traefik.example.com`)"
      service: api@internal
      middlewares:
        - auth
```

## Roadmap / Next steps
- ~~Implement Flutterwave and GoCardless providers~~ ✅
- ~~Add Drupal module to automate member activation based on webhooks~~ ✅
- ~~Add pgAdmin for database management~~ ✅
- Add queue/worker with Redis for robust retries
- Harden Keycloak for production (DB, HTTPS, realms/clients provisioning)
- Add automated testing (unit tests for Payment API, Drupal module tests)
- Implement backup automation with cron jobs
