// Installation test — verifies script loading, site authorization,
// configuration retrieval, and widget initialization markers.
// Usage: node tests/e2e/install-check.mjs [baseUrl]
// If SITE_ID is not set, it logs in as the dev admin and creates + publishes
// a test site first. Exit code is non-zero if any check fails.
import { execSync } from "node:child_process";
const BASE = (process.argv[2] || process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const checks = [];
const check = (name, pass, detail) => { checks.push({ name, pass, detail }); console.log(`${pass ? "PASS" : "FAIL"}  ${name} — ${detail}`); };
const adminEmail = process.env.ADMIN_EMAIL || "admin@accessibility.local";
const adminPass = process.env.ADMIN_PASSWORD || "Admin123!";
let siteId = process.env.SITE_ID || "";
let token = "";
try {
  const login = await (await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: adminEmail, password: adminPass }) })).json();
  token = login.token;
  if (!siteId) {
    const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };
    const s = await (await fetch(`${BASE}/api/sites`, { method: "POST", headers: H, body: JSON.stringify({ name: "Install-check site", baseDomain: "localhost" }) })).json();
    siteId = s.site.public_id;
    await fetch(`${BASE}/api/sites/${s.site.id}/publish`, { method: "POST", headers: H, body: "{}" });
  }
} catch (e) { console.log("WARN  admin setup skipped:", e.message); }
check("API health", (await (await fetch(`${BASE}/api/health`)).json()).ok === true, `${BASE}/api/health`);
const loader = await (await fetch(`${BASE}/widget/v1/loader.js`)).text();
check("Loader script loads", loader.includes("data-site-id") && loader.includes("/api/public/config"), `${loader.length} bytes`);
const widget = await (await fetch(`${BASE}/widget/v1/widget.js`)).text();
check("Widget bundle loads", widget.includes("__A11Y_WIDGET_LOADED__") && widget.includes("attachShadow"), `${widget.length} bytes, Shadow DOM present`);
const cfgRes = await fetch(`${BASE}/api/public/config?siteId=${siteId}`);
const cfg = await cfgRes.json().catch(() => ({}));
check("Configuration retrieval (authorized)", cfgRes.ok && !!cfg.config, cfgRes.ok ? `config v${cfg.configVersion}` : (cfg.error || cfgRes.status));
const blocked = await fetch(`${BASE}/api/public/config?siteId=${siteId}`, { headers: { Origin: "https://not-allowlisted.example" } });
check("Unauthorized origin blocked", blocked.status === 403, `HTTP ${blocked.status}`);
const demo = await (await fetch(`${BASE}/demo/`)).text();
const scripts = (demo.match(/<script\b/g) || []).length;
check("Demo site uses only the script tag", scripts === 1 && demo.includes("/widget/v1/loader.js"), `${scripts} script tag(s) in demo page`);
check("Widget initialization markers present", widget.includes("aria-expanded") && widget.includes("aria-live") && widget.includes("Escape"), "dialog, live region, Escape handling in bundle");
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\n${failed.length} check(s) FAILED` : "\nAll installation checks passed.");
process.exit(failed.length ? 1 : 0);
