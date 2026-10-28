# API Documentation

Base URL: the API origin (dev: `http://localhost:3000`, prod: your API subdomain).
All `/api/*` except `/api/health`, `/api/public/*`, `/api/auth/login` require
`Authorization: Bearer <token>`. Roles: `super_admin`, `website_admin`, `auditor`
(read-only: GET only; writes return 403). Errors are JSON `{error, message}` with
no stack traces. Rate limits: 120/min per IP (general), 20/min (login), 30/min (diagnostics).

## Public (widget) endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/public/config?siteId=…` | Published config for an enabled, allowlisted site. `Cache-Control: no-store`. 403 if Origin/Referer host is not allowlisted; 404 if disabled/unpublished. Returns `{siteId, siteName, widgetVersion, configVersion, publishedAt, config}` — no secrets, ever. |
| POST | `/api/public/diagnostics` | `{siteId, kind, message}` — load-error diagnostics only. Never send preference values here. |

## Auth

| Method | Path | Body / Response |
|---|---|---|
| POST | `/api/auth/login` | `{email, password}` → `{token, user}`. Passwords are scrypt-hashed; tokens are SHA-256-hashed in the DB, TTL 12h (SESSION_TTL_HOURS). |
| POST | `/api/auth/logout` | Deletes the session. |
| GET | `/api/auth/me` | Current user. |

## Admin

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/api/sites` | List / register (creates a draft config automatically). |
| PUT | `/api/sites/:id` | Edit name/domain/hostnames/enabled. |
| GET | `/api/sites/:id/config` | `{site, draft, published}`. |
| PUT | `/api/sites/:id/config` | Save draft (sanitized server-side; unknown fields dropped). |
| POST | `/api/sites/:id/publish` | Draft → new published version (append-only). |
| GET | `/api/sites/:id/history` | All config versions. |
| POST | `/api/sites/:id/rollback` | `{configId}` → republishes that config as a new version. |
| GET | `/api/sites/:id/install-test` | Server-side checks + the exact install snippet. |
| POST | `/api/sites/:id/verify` | `{token}` — ownership token check (production: serve the token at `/.well-known/accessibility-verification.txt`). |
| GET | `/api/overview` | Real counts + latest audits/diagnostics/logs. |
| GET/POST | `/api/releases`, POST `/api/releases/:id/activate|rollback` | Release management (create/activate/rollback: Super Admin only). |
| GET/POST | `/api/audits` | Run/list automated scans (see audit module limits). |
| GET | `/api/audit-logs` | Admin action log. |
| GET | `/api/health` | `{ok, version, time, publicBaseUrl}`. |

## CDN assets

| Path | Cache |
|---|---|
| `/widget/v1/loader.js`, `/widget/v1/widget.js`, `/widget/v1.0.0/widget.js` | `public, max-age=31536000, immutable` (versioned; bump the version to change them). |
| `/demo/` | `no-cache` (demo only). |
