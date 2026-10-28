# Accessibility Platform — Self-Hosted Widget CDN

A complete, production-oriented, self-hosted accessibility platform.
One script tag adds a floating accessibility button to any website.
No npm install, no framework rewrite, no host-site redeploy for config changes.

> **Honest scope note:** Installing this widget does **not** make a website
> WCAG-compliant, GIGW-compliant, or STQC-certified. It adds presentation,
> keyboard, reading and language controls on top of the host site. Real
> compliance still requires host-site fixes, content work, and manual
> evaluation. See `docs/compliance/traceability-matrix.md`.

## Architecture (short version)

```
apps/dashboard/   React + TypeScript + Vite + Tailwind (admin UI)
apps/api/         Node.js API, zero external runtime deps, node:sqlite
                  (demo/dev). Production: PostgreSQL — see database/.
apps/demo-site/   Plain HTML site using ONLY the script tag.
packages/widget-loader/  Small async loader (data-site-id)
packages/widget-core/    Framework-free widget bundle (Shadow DOM)
packages/widget-ui/      Isolated widget styles (shadow-scoped)
packages/shared-config/  Defaults, profiles, validation, i18n keys
packages/accessibility-rules/  Audit rule catalogue (WCAG/GIGW mapping)
infrastructure/   Nginx, IIS, deployment, CDN cache rules
database/         PostgreSQL DDL + migrations + Prisma schema + seed
tests/            node:test unit/integration + install check + Playwright spec
docs/             Architecture, install, deployment, security, compliance,
                  accessibility testing, troubleshooting, rollback
```

### Key decisions (full reasoning in docs/architecture/architecture.md)

1. **Widget runtime is framework-free vanilla JS.** React/Angular/Vue/ASP.NET/
   PHP sites all load it the same way. The dashboard is React, the widget is not.
2. **Loader + bundle split.** `loader.js` (~3 KB) fetches the published config,
   then loads the versioned bundle. Config changes publish centrally; host sites
   never redeploy.
3. **Shadow DOM for the button + panel.** Host CSS cannot break the widget and
   the widget cannot leak styles into the host. Settings are applied to the host
   document only through a single, removable `<style>` element and reversible
   attributes — never by rewriting host HTML.
4. **Public site ID is NOT a secret.** Authorization is origin/hostname
   allowlisting, validated server-side on every public-config request.
5. **SQLite for the runnable demo, PostgreSQL for production.** The demo must
   run with zero external services. The schema, migrations and Prisma model in
   `database/` are the production target; the API's storage layer is isolated
   in `apps/api/src/db.js` so the swap is a config change, not a rewrite.
   The demo database is a real persisted database — nothing is hardcoded in
   the dashboard.
6. **No analytics by default.** Preferences live in the visitor's browser
   (local/session, per published policy). Nothing about a visitor's settings
   is sent to the API unless an admin explicitly enables diagnostics, and
   diagnostics never contain preference values.
7. **No invented metrics.** The dashboard shows real counts from the database
   and honest empty states. Audit results are automated findings only, with
   their limits stated on screen.

## Quick start (demo, 2 minutes)

```bash
cd accessibility-platform
cp .env.example .env
# Optional: set ADMIN_PASSWORD, PORT, PUBLIC_BASE_URL
node apps/api/src/server.js
# API + dashboard + demo at http://localhost:3000
# Dashboard: http://localhost:3000/        (login below)
# Demo site: http://localhost:3000/demo/
```

Seed admin (created on first run, change it immediately in production):

- Email: `admin@accessibility.local`
- Password: value of `ADMIN_PASSWORD`, or `Admin123!` if unset (dev only)

Then: Dashboard → Websites → New website → Save draft → Publish →
copy the script → open `/demo/` (it already uses that flow once you set the
demo site's public ID — see `apps/demo-site/README.md`) → change a setting in
the Studio, Publish again, reload the demo — **no demo source change**.

## Install snippet (production shape)

```html
<script src="https://accessibility.example.gov.in/widget/v1/loader.js"
        data-site-id="SITE_PUBLIC_ID" defer></script>
```

Replace the domain with your `PUBLIC_BASE_URL`. See
`docs/installation/installation.md` for React, Angular, plain HTML, Bootstrap,
ASP.NET and PHP examples, and the exact CSP directives.

## Production build

```bash
cd apps/dashboard && npm install && npm run build   # outputs to ../api/public/dashboard
node apps/api/src/server.js                          # serves dashboard + widget
```

Widget bundle: `packages/widget-core/src/widget.js` is the source of truth;
`apps/api/public/widget/v1/widget.js` is the versioned, served copy.
`npm run build:widget` (root) copies it and writes a size report — budgets in
`docs/architecture/architecture.md` (loader < 5 KB, bundle < 60 KB gzipped
target; actual sizes are printed by the build, not claimed here).

## Tests

```bash
npm test                    # unit + integration (node:test, no browser needed)
node tests/e2e/install-check.mjs   # script loading, auth, config, widget init
# Playwright spec (needs browsers): tests/e2e/widget.spec.ts — see its header
```

## Docs map

- Architecture & decisions: `docs/architecture/architecture.md`
- API: `docs/architecture/api.md`
- Install: `docs/installation/installation.md`
- Linux/Nginx: `docs/deployment/linux-nginx.md`
- Windows/IIS: `docs/deployment/windows-iis.md`
- CDN/cache: `docs/deployment/cdn.md`
- Security checklist: `docs/security/security-checklist.md`
- GIGW 3.0 / DBIM traceability: `docs/compliance/traceability-matrix.md`
- Accessibility testing guide: `docs/compliance/accessibility-testing-guide.md`
- Troubleshooting: `docs/installation/troubleshooting.md`
- Versioning & rollback: `docs/deployment/versioning-rollback.md`
