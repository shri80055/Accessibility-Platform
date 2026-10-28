# Windows / IIS Deployment Guide

## Supported shape

The API is a Node.js service; IIS acts as a reverse proxy (URL Rewrite +
Application Request Routing), not as the Node host. Static widget assets can
also be served directly by IIS from `apps/api/public/widget/` (see
`infrastructure/iis/web.config`).

## Steps

1. Install Node.js 20+ (LTS) and IIS with URL Rewrite + ARR.
2. Build the dashboard: `cd apps\dashboard && npm ci && npm run build`.
3. Run the API as a Windows Service (e.g. via NSSM):
   `nssm install AccessibilityPlatform "C:\Program Files\nodejs\node.exe" "C:\srv\accessibility-platform\apps\api\src\server.js"`
   Set its working directory to the platform root and its environment from a
   secured `.env` (same keys as the Linux guide; `ALLOW_PRIVATE_AUDIT=false`).
4. In IIS, create a site bound to your HTTPS host, import
   `infrastructure/iis/web.config` (rewrite → `http://127.0.0.1:3000`, preserve
   host header off, TLS via your certificate), and confirm:
   - `https://<host>/api/health` → `{"ok":true,…}`
   - `https://<host>/widget/v1/loader.js` → 200 with immutable cache headers
   - `https://<host>/api/public/config?siteId=…` → `no-store`
5. Backups: SQL Server/PostgreSQL dumps per your DB choice + `.env` in a
   secrets store. Rollback: see `versioning-rollback.md`.

## Limits

IIS static compression and ARR proxying must not strip the API's
`Cache-Control` headers. If ARR rewrites them, serve `/widget/*` as static IIS
content (immutable) and proxy only `/api/*` and `/`.
