// Audit rule catalogue. Each rule maps to WCAG 2.1 + GIGW 3.0, states what it
// can and cannot prove, and is implemented (server-side HTML checks) in
// apps/api/src/audit.js. Automated checks NEVER prove full compliance.
export const RULES = [
  { id: "img-alt", wcag: "1.1.1", gigw: "Accessibility — Non-text Content", severity: "serious", title: "Images must have alt text", check: "Every <img> has a non-empty alt (or explicit role=presentation/alt='')", limit: "Cannot judge whether alt text is meaningful." },
  { id: "html-lang", wcag: "3.1.1", gigw: "Accessibility — Language of Page", severity: "serious", title: "Page declares its language", check: "<html lang> present and non-empty", limit: "Cannot verify the declared language is correct." },
  { id: "page-title", wcag: "2.4.2", gigw: "Accessibility — Page Titled", severity: "moderate", title: "Page has a descriptive title", check: "<title> present and non-empty", limit: "Cannot judge descriptiveness." },
  { id: "button-name", wcag: "4.1.2", gigw: "Accessibility — Name, Role, Value", severity: "serious", title: "Buttons have accessible names", check: "<button> has text, aria-label or aria-labelledby", limit: "Icon-only buttons need manual review." },
  { id: "label", wcag: "1.3.1 / 3.3.2", gigw: "Accessibility — Labels or Instructions", severity: "serious", title: "Form controls have labels", check: "input/select/textarea has <label for>, aria-label or title", limit: "Cannot judge label clarity." },
  { id: "heading-order", wcag: "1.3.1 / 2.4.6", gigw: "Accessibility — Headings and Labels", severity: "moderate", title: "Headings do not skip levels", check: "h1→h2→h3 order, no skipped level", limit: "Heading meaning needs manual review." },
  { id: "link-text", wcag: "2.4.4", gigw: "Accessibility — Link Purpose", severity: "moderate", title: "Links have descriptive text", check: "No bare 'click here' / 'read more' / empty links", limit: "Context-dependent purpose needs manual review." },
  { id: "duplicate-id", wcag: "4.1.1", gigw: "Robust — Parsing", severity: "minor", title: "No duplicate element IDs", check: "id attributes are unique in the document", limit: "Parsing is necessary, not sufficient, for robustness." },
  { id: "viewport", wcag: "1.4.4", gigw: "Accessibility — Resize Text", severity: "moderate", title: "Viewport does not disable zoom", check: "No user-scalable=no / maximum-scale=1", limit: "Zoom behaviour needs browser testing." },
];
