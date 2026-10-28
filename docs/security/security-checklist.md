# Security Checklist (review before production)

- [ ] `.env` is not in Git; `ADMIN_PASSWORD` is strong and unique; seeded admin password changed.
- [ ] TLS everywhere (dashboard, API, widget origin). No HTTP in production URLs.
- [ ] PostgreSQL in production (SQLite file is demo-only, with file permissions 0600 if ever used outside dev).
- [ ] `ALLOW_PRIVATE_AUDIT=false` in production (prevents SSRF-style scans of internal URLs).
- [ ] Rate limiting on (login 20/min, diagnostics 30/min, general 120/min) — tune, don't disable.
- [ ] Sessions: scrypt passwords, SHA-256 token hashes, 12h TTL (configurable), logout deletes the session.
- [ ] RBAC enforced server-side on every write (auditor = read-only; releases = Super Admin only). Never rely on hiding dashboard buttons.
- [ ] Public config returns presentation settings only — no secrets, no internal IDs, no admin data.
- [ ] Public site ID treated as public (it is in HTML). Authorization = server-side origin/hostname allowlist.
- [ ] Input validation: hostnames, config fields (sanitized server-side), URLs (http/https only), body size cap (1 MB).
- [ ] Output: JSON only, no stack traces in errors, security headers on API/dashboard responses.
- [ ] Audit logs reviewed regularly (admin logins, site creation, publishes, rollbacks, release changes).
- [ ] Backups encrypted + restore-tested; `.env` stored in a secrets manager, not in backups.
- [ ] Dependencies: dashboard `npm audit` on every build; API has zero runtime dependencies by design.
- [ ] CSP on host sites reviewed (script-src/connect-src for the widget origin only; no `unsafe-inline` in script-src).
- [ ] No visitor preference data sent to the API by default; diagnostics contain errors only.
- [ ] Incident plan: disable a site (one click) stops its widget; roll back a release (one click) reverts the bundle.
