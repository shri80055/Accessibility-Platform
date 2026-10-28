// One-command local demo setup. Run AFTER starting the API:
//   node apps/api/src/server.js          (in another terminal)
//   node scripts/setup-local-demo.mjs
// It logs in as the seeded admin, reuses or creates a "Demo Portal" site
// (domain: localhost), publishes its config, and wires the demo site's
// script tag to that site's public ID. Idempotent — safe to run twice.
// Env: PUBLIC_BASE_URL (default http://localhost:3000),
//      ADMIN_EMAIL, ADMIN_PASSWORD (defaults are the dev seed values).
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const BASE = (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function call(method, p, tok, body) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", ...(tok ? { Authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${data.message || data.error || ""}`);
  return data;
}
const login = await call("POST", "/api/auth/login", null, { email: process.env.ADMIN_EMAIL || "admin@accessibility.local", password: process.env.ADMIN_PASSWORD || "Admin123!" });
const tok = login.token;
const sites = await call("GET", "/api/sites", tok);
let site = sites.sites.find((s) => s.name === "Demo Portal");
if (!site) { site = (await call("POST", "/api/sites", tok, { name: "Demo Portal", baseDomain: "localhost" })).site; console.log("Created Demo Portal:", site.public_id); }
else console.log("Reusing Demo Portal:", site.public_id);
const cfg = await call("GET", `/api/sites/${site.id}/config`, tok);
if (!cfg.published) { await call("POST", `/api/sites/${site.id}/publish`, tok, {}); console.log("Published initial config."); }
else console.log("Already published (v" + cfg.published.version + ").");
const demoPath = path.join(root, "apps/demo-site/index.html");
let html = fs.readFileSync(demoPath, "utf8");
html = html.replace(/data-site-id="[^"]*"/, `data-site-id="${site.public_id}"`);
fs.writeFileSync(demoPath, html);
const test = await call("GET", `/api/sites/${site.id}/install-test`, tok);
console.log("Install test:", test.allPass ? "ALL PASS" : "SOME FAILED");
console.log("\nOpen in your browser:");
console.log("  Dashboard: " + BASE + "/");
console.log("  Demo site: " + BASE + "/demo/");
console.log("  Install snippet:\n  " + test.snippet);
