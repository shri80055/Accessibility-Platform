# Linux / Nginx Deployment Guide

## Prerequisites

Ubuntu 22.04+ (or equivalent), Node.js 20+, a domain + TLS certificate
(Let's Encrypt via certbot is fine), PostgreSQL 15+ for production.

## 1. Production database

```bash
createdb accessibility
psql "$DATABASE_URL" -f database/migrations/001_init.sql
```

Set `DATABASE_URL` and point the storage layer at PostgreSQL (see
`apps/api/src/db.js` — the single swap point; the Prisma schema in
`database/prisma/` mirrors the tables). The SQLite file is for demo/dev only.

## 2. Build

```bash
cd apps/dashboard && npm ci && npm run build
node packages/widget-core/build.mjs   # prints real bundle sizes
```

## 3. Environment (never commit `.env`)

```
PORT=3000
HOST=127.0.0.1
PUBLIC_BASE_URL=https://accessibility.example.gov.in
ADMIN_EMAIL=admin@your-domain.gov.in
ADMIN_PASSWORD=<strong, unique>
SESSION_TTL_HOURS=12
ALLOW_PRIVATE_AUDIT=false
```

Change the seeded admin password on first login. Rotate it via the API's
password-hash function (there is deliberately no "reset by email" in v1 —
provision admins out-of-band).

## 4. Process (systemd)

```ini
[Unit]
Description=Accessibility Platform API
After=network.target
[Service]
WorkingDirectory=/srv/accessibility-platform
ExecStart=/usr/bin/node apps/api/src/server.js
Restart=always
EnvironmentFile=/srv/accessibility-platform/.env
[Install]
WantedBy=multi-user.target
```

`systemctl enable --now accessibility-platform`

## 5. Nginx (see infrastructure/nginx/accessibility.conf)

Reverse-proxy to `127.0.0.1:3000`, TLS via certbot, `gzip` on, immutable
cache for `/widget/v1/*` and `/widget/v1.0.0/*`, `no-store` for
`/api/public/config` (the API already sends these headers; Nginx must not
override them). Health check: `GET /api/health`.

## 6. Backups

Nightly `pg_dump` + a copy of `.env` (in a secrets store, not in the backup
bucket) + the `releases` table. Test restores quarterly. Rollback: see
`versioning-rollback.md`.
