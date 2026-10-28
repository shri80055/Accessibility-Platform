# Architecture & Technical Decisions

## System diagram (text)

```
Host website (any stack)
  └─ <script src="https://cdn.example/widget/v1/loader.js" data-site-id="site_…" defer>
       └─ GET /api/public/config?siteId=…   (origin allowlisted, no-store)
            └─ published config (JSON, no secrets)
       └─ loads /widget/v1/widget.js (immutable, versioned)
            └─ Shadow-DOM button + panel; ONE host <style> element for settings
            └─ preferences in local/session storage (per published policy)

Dashboard (React/TS/Vite/Tailwind) ── Bearer token ──► API (Node, zero deps)
  Sites · Studio (draft → publish) · Releases · Audit · Diagnostics · Logs
  └─ SQLite file (demo) / PostgreSQL (production, database/)
```

## Decisions and why

| Decision | Reason | Trade-off / limit |
|---|---|---|
| Widget in vanilla JS, dashboard in React | Widget must load on React, Angular, Vue, ASP.NET, PHP, plain HTML with zero host changes. A React widget would force a runtime on every host. | Widget code is hand-written; no JSX. Kept small and testable. |
| Loader + bundle split | Loader stays tiny and cache-stable; config is fetched live so publishing never needs a host redeploy. | One extra request on first load; loader is `defer` + async so it never blocks rendering. |
| Shadow DOM for button/panel | Host CSS cannot break the panel; panel CSS cannot leak into the host. | Shadow DOM + screen readers: modern browsers expose open shadow content to AT; this is verified in the manual checklist (NVDA/VoiceOver), not assumed. Fallback if a host blocks Shadow DOM: the loader logs a diagnostic and the widget does not render a broken panel — documented, not silently degraded. |
| One removable host `<style>` element | Settings must affect the host page, so some host styling is unavoidable. Confining it to one element (removed on reset) keeps it reversible and debuggable. Contrast modes use broad selectors by necessity — they are labelled as presentation aids, not WCAG guarantees, and can break complex dashboards; the reset button is always one click away. | Broad contrast selectors can affect dashboards/tables. Mitigation: per-site feature enablement (admins can disable contrast for complex apps) + reset + manual testing guide. |
| Public site ID, origin allowlist | A script tag cannot hold a secret. Authorization must be server-side hostname validation, not a token in HTML. | Referer/Origin can be spoofed by non-browser callers; that is why the public config contains only public presentation settings — nothing sensitive is ever returned. |
| SQLite (demo) / PostgreSQL (prod) | The demo must run with no external services, yet persistence must be real. Same tables in both. | Prisma client code is not wired in the demo; the storage layer (`apps/api/src/db.js`) is the single swap point, and `database/prisma/schema.prisma` mirrors the tables. |
| No analytics by default | Accessibility preferences are sensitive-adjacent. They stay in the visitor's browser. Diagnostics contain only load errors, never preference values. | Admins get no usage analytics unless they build an explicit, consented pipeline later. |
| Zero-dep API | Fewer supply-chain risks, faster cold start, no paid SaaS. Node stdlib covers HTTP, crypto (scrypt), SQLite. | No ORM sugar in the demo; SQL is explicit and reviewable. |

## Performance budgets (measured, not claimed)

Run `node packages/widget-core/build.mjs` for actual numbers. At v1.0.0 build time:
loader ≈ 3.2 KB raw; widget bundle ≈ 22.8 KB raw (see build output on your machine).
Targets: loader < 5 KB, widget bundle < 60 KB gzipped, dashboard JS < 200 KB raw.
Baseline measurement method: build output + browser Network panel on `/demo/`
with cache disabled; record loader time, bundle time, and time-to-button in
the release notes. Do not publish a performance score you did not measure.

## Loading pipeline (exact order)

1. Host page parses; `defer` script does not block rendering.
2. Loader reads `data-site-id` (+ optional `data-api-base`, `data-version`).
3. Loader fetches published config (`Cache-Control: no-store`).
4. On 403/404 (disabled / not allowlisted / unpublished): no button, console
   diagnostic for the admin, diagnostic row in the dashboard.
5. On network failure: last cached config if present, else safe defaults.
6. Loader injects the versioned bundle; bundle reads `window.__A11Y_CONFIG__`.
7. Bundle renders the Shadow-DOM button, restores stored preferences, applies
   them through the single style element.
8. Dashboard Publish writes a new published row; the next page load (or reload)
   fetches it. No host change, no cache purge of versioned assets needed —
   only the `no-store` config endpoint changes.

## Staged releases, pinning, rollback

- Widget version lives in `releases` (current/draft/rolled_back). The config
  response reports the current release version.
- A site pins with `data-version="1.0.0"` → loader serves `/widget/v1.0.0/widget.js`.
- Rollback in the dashboard activates a previous release, or restores a previous
  published configuration as a new published version (history is append-only;
  nothing is ever overwritten).

## CSP (host site) — exact directives

```
script-src 'self' https://<your-cdn-origin>;
connect-src 'self' https://<your-cdn-origin>;
style-src 'self' 'unsafe-inline';
```

`'unsafe-inline'` in `style-src` covers the widget's host-document presentation
rules only. Never add `'unsafe-inline'` to `script-src` for this widget. If a
host CSP blocks the widget, the browser console names the directive — fix the
directive; do not attempt to bypass CSP, and do not claim the widget can
bypass a site's CSP or a script blocker.

## Fallback strategy

Config service down → cached config → safe defaults → (if never configured)
no button + diagnostic. Bundle down → loader logs + diagnostic; host page is
unaffected. API down → dashboard shows its error; published widgets keep
working from cache/defaults until the API returns.
