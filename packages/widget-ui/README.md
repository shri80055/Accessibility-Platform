# widget-ui

Widget styles are intentionally **not** a separate CSS file. They live inside
the Shadow DOM in `packages/widget-core/src/widget.js` (`shadowCSS()`), so
host CSS cannot override them and they cannot leak into the host page.

The only host-document styles the widget writes are the visitor's chosen
presentation settings, through the single removable `<style id="a11y-widget-style">`
element. See `docs/architecture/architecture.md` for the isolation rationale
and its limits (especially contrast modes).
