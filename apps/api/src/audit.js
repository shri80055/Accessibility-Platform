// Server-side automated audit. Pure HTML checks from packages/accessibility-rules.
// IMPORTANT LIMIT: these checks find missing patterns only. They cannot judge
// meaning, colour contrast in context, keyboard behaviour, or content quality.
// Every report carries this limit, and the dashboard states it on screen.
import { RULES } from "../../../packages/accessibility-rules/index.mjs";

function count(re, html) { return (html.match(re) || []).length; }
function attr(tag, name) { const m = tag.match(new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', "i")); return m ? m[1] : null; }

export function runAudit(html, url) {
  const findings = [];
  const add = (rule, element, evidence) => findings.push({
    ruleId: rule.id, wcag: rule.wcag, gigw: rule.gigw, severity: rule.severity,
    title: rule.title, element, evidence: String(evidence || "").slice(0, 300),
    guidance: rule.check, limit: rule.limit,
  });
  const rule = (id) => RULES.find((r) => r.id === id);
  // img-alt
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const alt = attr(tag, "alt");
    if (alt === null) add(rule("img-alt"), "img", tag.slice(0, 200));
  }
  // html-lang
  const htmlTag = (html.match(/<html\b[^>]*>/i) || [])[0] || "";
  if (!attr(htmlTag, "lang")) add(rule("html-lang"), "html", htmlTag || "<html> (no lang)");
  // page-title
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title || !title.trim()) add(rule("page-title"), "head > title", "missing or empty <title>");
  // button-name
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (!text && !attr(m[0], "aria-label") && !attr(m[0], "aria-labelledby"))
      add(rule("button-name"), "button", m[0].slice(0, 200));
  }
  // labels
  const labelFors = new Set([...html.matchAll(/<label\b[^>]*for\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const attrs = m[2] || ""; const type = (attr(m[0], "type") || "").toLowerCase();
    if (type === "hidden" || type === "submit" || type === "button") continue;
    const id = attr(m[0], "id");
    if (!attr(m[0], "aria-label") && !attr(m[0], "aria-labelledby") && !(id && labelFors.has(id)) && !attr(m[0], "title"))
      add(rule("label"), m[1], m[0].slice(0, 200));
  }
  // heading order
  let last = 0;
  for (const m of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const lvl = Number(m[1]);
    if (last && lvl > last + 1) add(rule("heading-order"), `h${lvl}`, m[0].replace(/<[^>]+>/g, "").trim().slice(0, 120));
    last = lvl;
  }
  // link text
  for (const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = m[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (!text || ["click here", "read more", "here", "link"].includes(text))
      add(rule("link-text"), "a", m[0].slice(0, 200));
  }
  // duplicate ids
  const seen = new Map();
  for (const m of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) {
    if (seen.has(m[1])) add(rule("duplicate-id"), `#${m[1]}`, `duplicate id="${m[1]}"`);
    seen.set(m[1], true);
  }
  // viewport
  const vp = (html.match(/<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/i) || [])[0] || "";
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?/i.test(vp)) add(rule("viewport"), "meta viewport", vp);
  const summary = {
    total: findings.length,
    bySeverity: ["critical", "serious", "moderate", "minor"].reduce((o, s) => ({ ...o, [s]: findings.filter((f) => f.severity === s).length }), {}),
    automatedOnly: true,
    disclaimer: "Automated findings only. This is NOT a WCAG, GIGW or STQC compliance certification. Manual evaluation is still required.",
  };
  return { findings, summary, checkedRules: RULES.length };
}
