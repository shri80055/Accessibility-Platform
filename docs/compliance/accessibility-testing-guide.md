# Accessibility Testing Guide

## Automated (supporting evidence only)

- `npm test` — unit + API integration.
- `node tests/e2e/install-check.mjs` — script loading, authorization, config, widget markers.
- Dashboard → Audit — automated HTML rules (axe-core is the recommended next
  engine for a fuller rule set; the v1 engine is a transparent, reviewable
  rule set in `apps/api/src/audit.js` + `packages/accessibility-rules/`).
- Playwright spec `tests/e2e/widget.spec.ts` — button, keyboard, persistence.

Automated tests can prove a pattern is *present or absent*. They cannot prove
meaning, usability, or compliance. Every automated report in this platform
carries that disclaimer on screen and in its data.

## Manual (required before any compliance claim)

1. **Keyboard:** Tab/Shift-Tab through the whole panel and the host page;
   Enter/Space activate; Esc closes and returns focus; no trap; focus visible.
2. **Screen readers:** NVDA + Firefox/Chrome (Windows), VoiceOver + Safari
   (macOS/iOS), TalkBack (Android) where practical. Check panel headings,
   toggle states, live announcements, language switching.
3. **Zoom & reflow:** 200% zoom, 320px width, 400% zoom spot-check.
4. **Contrast:** measure host text contrast with a checker — never trust a filter.
5. **Motion:** `prefers-reduced-motion` on; reduced-motion mode on; carousels/video paused.
6. **Languages:** render each enabled language; check Urdu RTL; check Noto Sans fallback.
7. **Persistence:** set preferences, reload, new tab, clear storage, reset — each behaves per the published policy (local/session/none).
8. **Failure modes:** API down (cached/defaults), CSP blocking, duplicate script tags, disabled site, unpublished config, unauthorized domain — each must fail gracefully with an admin-readable diagnostic and no broken host page.
9. **Dashboard itself:** the admin UI must pass the same keyboard + screen-reader bar it helps sell.

## Reporting

Record: tool + version, browser + AT + version, page URL, findings with WCAG
criterion, severity, element, evidence, remediation, and retest result.
Distinguish: automated finding / manual finding / verified fix / unverified
requirement. Never close a requirement on an automated pass alone.
