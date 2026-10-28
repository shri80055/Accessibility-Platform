# Manual accessibility checks (required — automation cannot cover these)

- [ ] Full keyboard walkthrough of the widget panel: Tab order, visible focus, no trap, Escape returns focus to the button.
- [ ] NVDA (Windows) + VoiceOver (macOS/iOS) pass over panel headings, toggles (aria-pressed), live announcements, and language change.
- [ ] 200% browser zoom, 320px viewport, touch targets >= 44px.
- [ ] prefers-reduced-motion on: no panel animation, reducedMotion setting suppresses host animations.
- [ ] Urdu (RTL): panel direction flips, button position still reachable.
- [ ] High-contrast + dark + light modes on a form-heavy page and a data table — note any damaged control, do not ship a mode that breaks forms.
- [ ] Screen-reader + keyboard test on the dashboard itself (it must meet the same bar it sells).
