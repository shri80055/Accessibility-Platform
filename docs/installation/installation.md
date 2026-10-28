# Installation Instructions

## 1. Install the platform (see deployment guides for production)

```bash
cp .env.example .env   # set PUBLIC_BASE_URL, ADMIN_PASSWORD, PORT
node apps/api/src/server.js
# Dashboard: http://localhost:3000/  ·  Demo: http://localhost:3000/demo/
```

## 2. Register a website

Dashboard → Websites → Register → name + base domain → the platform generates
a public site ID and a draft configuration.

## 3. Configure and publish

Studio → adjust button, panel, features, languages, profiles, persistence →
Save draft → **Publish**. Only published configs are served to visitors.

## 4. Add one script tag to the host site

```html
<script src="https://accessibility.example.gov.in/widget/v1/loader.js"
        data-site-id="SITE_PUBLIC_ID" defer></script>
```

Replace the domain with your `PUBLIC_BASE_URL` and the ID with the site's real
public ID. That is the entire integration.

### Plain HTML / Bootstrap

Paste the tag in your shared `<head>` (or just before `</body>` — `defer`
keeps it non-blocking either way).

### React

`public/index.html`, inside `<head>`. No package, no component.

### Angular

`src/index.html`, inside `<head>`. No module import.

### Vue

`index.html`, inside `<head>`.

### ASP.NET

`Views/Shared/_Layout.cshtml`, inside `<head>`.

### PHP

Your shared header include (e.g. `header.php`), inside `<head>`.

## 5. Verify

Dashboard → Install & Verify → Run installation test, or from a terminal:

```bash
node tests/e2e/install-check.mjs http://localhost:3000
```

Then open the host site: the floating button must appear, the panel must open
with keyboard (Tab to the button, Enter/Space), and a setting (e.g. text size)
must visibly change the page. Change a setting in the Studio, Publish, reload
the host site — the change appears with no host edit.

## 6. CSP

Add the directives in `docs/architecture/architecture.md` (script-src +
connect-src for your origin; style-src `'unsafe-inline'` for the widget's
host-document presentation rules only). Test in a browser with the CSP active;
the console names any blocked directive.

## Version pinning

```html
<script src="https://…/widget/v1/loader.js" data-site-id="…" data-version="1.0.0" defer></script>
```

Pinned sites keep loading that bundle until the tag changes. Unpinned sites
follow the current release. See `docs/deployment/versioning-rollback.md`.
