# Troubleshooting

| Symptom | Most likely cause | Fix |
|---|---|---|
| No floating button | Site disabled / not published / hostname not allowlisted / wrong `data-site-id` | Dashboard → Websites: enable, Publish, add the hostname (including `localhost` for local testing). Check the browser console — the loader logs the exact reason. |
| Button appears, settings do nothing | Host CSS with `!important` overrides, or the feature is disabled in the published config | Enable the feature in the Studio and Publish; test on a plain page (`/demo/`) to isolate host CSS. |
| Config change not visible | Stale proxy cache on the config endpoint, or draft not published | Config is `no-store` — a proxy caching it is misconfigured (see CDN guide). Confirm the published version in Studio → history. |
| CSP errors in console | Host CSP missing the widget origin | Add `script-src` + `connect-src` for the CDN origin (see installation guide). Do not use `'unsafe-inline'` in `script-src`. |
| Widget blocked by ad/script blocker | Third-party script blocking | Self-host on your own domain/subdomain (recommended) — blockers rarely block first-party origins. |
| Audit fetch fails | Private URL blocked in production, or target unreachable | In dev, set `ALLOW_PRIVATE_AUDIT=true`. In production, scan only public, authorized URLs. |
| Login fails after deploy | Admin seeded with a different `ADMIN_PASSWORD`, or DB path changed | The seed runs only when the users table is empty. Check `DATABASE_PATH` and the env file actually loaded. |
| Dashboard shows the "build not present" page | Dashboard not built | `cd apps/dashboard && npm install && npm run build`, then restart the API. |
| Duplicate buttons | Script tag included twice, or loader + bundle both embedded manually | Include the loader once. The widget guards against double-init, but two tags still waste a request — remove the duplicate. |

## Diagnostics

The dashboard Overview lists failed widget loads reported by loaders
(kind + message + origin, no preference data). The browser console on the host
site is the first place to look; the loader's messages are written for admins,
not visitors.
