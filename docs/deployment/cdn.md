# CDN Configuration Guide — and an honest distinction

## What this platform is

A **self-hosted origin**: one (or a few) HTTPS servers behind Nginx/IIS
serving versioned widget assets and the config API. That is not, by itself,
a globally distributed edge CDN.

## Cache rules (origin — already set by the API; the proxy must preserve them)

| Path | Header | Why |
|---|---|---|
| `/widget/v1/*`, `/widget/v1.0.0/*` | `public, max-age=31536000, immutable` | Versioned assets never change; a new version gets a new path. Safe to cache everywhere, forever. |
| `/api/public/config` | `no-store` | Published config must be fresh on every page load, or "publish and reload" breaks. Never cache this. |
| Dashboard `/assets/*` | Hashed filenames from Vite; long cache is safe. | Filenames change on rebuild. |
| `/`, `/demo/` | `no-cache` | HTML entry points; always revalidate. |

Add `gzip`/`brotli` compression at the proxy for `.js`/`.css`/`.html`.
Enable HTTP/2. Put the widget origin on its own subdomain
(e.g. `accessibility.example.gov.in`) so host-site cookies are never sent to
it (the widget needs no cookies at all).

## If you need global edge distribution

Put a real CDN (e.g. CloudFront, Cloudflare, Azure CDN, or your government's
approved CDN) in front of the origin with these rules:
- Cache `/widget/*` at the edge with the immutable headers above.
- **Bypass cache entirely** for `/api/public/config` (and all `/api/*`).
- Purge is never needed for versioned assets; if you must purge, purge by
  version path only.
Document the CDN provider, its cache rules, and its purge procedure in your
runbook — do not claim "CDN" from a single origin server alone.

## Cache invalidation

There is nothing to invalidate: versioned paths are immutable, and the only
mutable response (`/api/public/config`) is `no-store`. If a proxy or CDN
caches it anyway, that layer is misconfigured — fix the layer, not the widget.
