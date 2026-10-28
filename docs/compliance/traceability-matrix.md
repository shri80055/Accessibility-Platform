# GIGW 3.0 & DBIM Traceability Matrix

**Basis:** the GIGW 3.0 and DBIM v3 (January 2025) documents supplied as project
references, plus WCAG 2.1 AA success criteria (the baseline the brief names).
**Warning — read this first:** guideline identifiers below use WCAG numbers
(which are stable public identifiers) and GIGW/DBIM *section names*. Where the
supplied documents' internal clause numbering differs from this draft, the
supplied documents govern — confirm clause numbers against your copy before
citing this matrix in an official submission. No row in this matrix is a
certification, and no row claims STQC certification.

**Support categories:** (1) Widget-supported · (2) Host-website change required ·
(3) Content-editor action · (4) Manual evaluation required · (5) Cannot be verified by this platform.

| Requirement (WCAG / GIGW 3.0 / DBIM principle) | User need | Widget support | Host / content / manual work | Automated test | Manual verification | Evidence status | Limits |
|---|---|---|---|---|---|---|---|
| 1.1.1 Non-text Content — GIGW Accessibility — DBIM Perceivable | Screen-reader users need text alternatives | (5) Widget does not write alt text | (2)(3) Host + editors must provide meaningful alt | img-alt rule (presence only) | Review alt quality, decorative vs informative | Automated presence only | Cannot judge meaning |
| 1.3.1 Info & Relationships — Perceivable | Structure must be programmatic, not visual-only | (5) | (2) Semantic host HTML | heading-order, label, duplicate-id rules | Inspect landmarks, tables, forms | Partial | Semantics need review |
| 1.4.3 Contrast (Minimum) — Perceivable | Low-vision users need readable contrast | (1) Partial: high/dark/light presentation modes | (2) Host must meet 4.5:1 in its own design | None (filter ≠ compliance) | Measure real contrast with a checker | Not verified | **A contrast filter never guarantees WCAG contrast** |
| 1.4.4 Resize Text — Perceivable | Users need 200% text resize | (1) Font-size controls (80–200%) | (2) Host layout must not break at 200% | viewport rule (zoom not disabled) | Browser zoom to 200%, check overflow | Widget + browser test | Host layout may still break |
| 1.4.10 Reflow — Perceivable | 320px viewport without horizontal scrolling | (1) Panel is responsive; button repositions | (2) Host must reflow | None | 320px test | Manual only | — |
| 2.1.1 Keyboard — DBIM Operable | Full keyboard operation | (1) Panel: Tab order, Esc, focus return, no trap | (2) Host must be keyboard-operable | None | Keyboard walkthrough | Manual checklist | Widget cannot fix host traps |
| 2.4.7 Focus Visible — Operable | Keyboard users must see focus | (1) Focus-highlight mode + panel focus styles | (2) Host must not suppress focus outlines | None | Tab through host + panel | Manual | — |
| 2.2.2 Pause, Stop, Hide — Operable | Users must control moving content | (1) Reduced-motion mode suppresses animations | (2) Host must expose pause for carousels/video | None | Test with animations on | Manual | Only CSS animations suppressed; media players need host controls |
| 2.4.2 Page Titled — Operable | Orientation, bookmarks | (5) | (2)(3) Descriptive titles | page-title rule (presence) | Read titles | Partial | Cannot judge descriptiveness |
| 3.1.1 Language of Page — Understandable | AT must pronounce content correctly | (1) Widget panel declares its own lang/dir (incl. RTL Urdu) | (2) Host must declare its page language | html-lang rule | Check lang correctness | Partial | Widget lang ≠ host content lang |
| 3.1.2 Language of Parts — Understandable | Mixed-language passages | (1) Widget UI language selector (13-language framework) | (3) Editors mark language changes in content | None | Manual | Manual | Widget translation does **not** translate host content |
| 3.2.3 Consistent Navigation, 3.3.2 Labels — Understandable | Predictability, form guidance | (1) Predictable panel behaviour, labelled controls | (2)(3) Host navigation + labels | label, button-name rules | Task walkthrough | Partial | — |
| 4.1.2 Name, Role, Value — DBIM Robust | AT must understand controls | (1) Panel uses semantic HTML, aria-pressed/expanded, live region | (2) Host controls need names/roles/states | button-name rule | NVDA/VoiceOver pass | Manual checklist | — |
| 4.1.3 Status Messages — Robust | Users must hear results | (1) aria-live announcements for applies/resets/errors | (2) Host status messages | None | AT pass | Manual | — |
| DBIM: multilingual, Noto Sans regional fonts — Perceivable/Understandable | Indian-language users | (1) 13-language framework, Noto Sans readable-font option, Unicode, RTL | (3) Host content in the user's language | None | Render check per language | Framework + en/hi/mr complete; other languages fall back to English where a string is untranslated (see widget i18n note) | Translation quality needs native review |
| GIGW: responsive, mobile, multilingual government services (general) | Citizens on phones, in regional languages | (1) Responsive button/panel, touch targets, language selector | (2) Host responsive design + language content | None | Device testing | Manual | — |
| STQC / formal certification | Official assurance | (5) **Cannot be verified by this platform** | (4) Independent audit + certification process | None — automated scans are explicitly not certification | Formal evaluation | Not claimed | Never cite a widget install or an automated scan as certification |

## How to use this matrix in a submission

Cite it as a *mapping of what the widget supports vs. what remains host work*.
For each shipped site, attach: the audit report (with its disclaimer), the
manual checklist results, and the list of host fixes still open. That trio —
not the widget alone — is the honest compliance story.
