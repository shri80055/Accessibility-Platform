# Versioning & Rollback

## Two versions, kept separate

- **Widget SDK version** (`releases` table): the bundle code. Current release
  is reported in every public-config response.
- **Configuration version** (per site, append-only): each Publish creates a
  new published row. Drafts never overwrite published rows.

## Release process

1. Build + measure (`node packages/widget-core/build.mjs`).
2. Dashboard → Releases → Create (version, notes, rollout %).
3. Validate on staging: install-check + manual checklist (see accessibility
   testing guide) against the staging origin.
4. Activate (Super Admin only). Staged rollout % is recorded and enforced by
   future loader logic; v1 records it and serves the current release to all
   (the rollout gate is a documented next step, not a silent claim).
5. Monitor Overview → diagnostics for failed loads.

## Rollback

- **Config rollback:** Studio → history → "Restore as published" on any older
  version. This publishes it as a *new* version, so forward history stays intact.
- **Release rollback:** Releases → "Rollback to this" on a previous release.
  It becomes `current`; the previous current becomes `rolled_back`.
- **Emergency:** if a bundle is broken, pin affected sites with
  `data-version="<last-good>"` in their script tag, then roll back the release.
  Because versioned paths are immutable, pinned sites are unaffected by a bad
  `current` release.
- **Code rollback:** redeploy the previous Git tag, rebuild the dashboard,
  restart the service. Database migrations are append-only; never rewrite a
  migration that has run in production — add a new one.
