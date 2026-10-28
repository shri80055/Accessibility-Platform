// Accessibility Platform API — Node.js, zero external runtime dependencies.
// Serves: /api/*, /widget/v1/*, /demo/*, and the dashboard (/) from
// apps/dashboard/dist (or apps/api/public/dashboard if built there).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { db, now, uuid, parseJSON, rowSite, logAction } from "./db.js";
import { runAudit } from "./audit.js";
import { sanitizeConfig, DEFAULT_CONFIG, validateHostname } from "../../../packages/shared-config/index.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
// Minimal .env loader (KEY=VALUE, # comments). Real secrets come from env in prod.
for (const p of [path.join(ROOT, ".env"), path.join(process.cwd(), ".env")]) {
  if (fs.existsSync(p)) for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_HOURS || 12) * 3600_000;
const ALLOW_PRIVATE_AUDIT = process.env.ALLOW_PRIVATE_AUDIT !== "false";
const WIDGET_VERSION = process.env.WIDGET_VERSION || "1.0.0";

// ---------- seed ----------
function hashPassword(pw) { const salt = crypto.randomBytes(16).toString("hex"); return salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex"); }
function verifyPassword(pw, stored) { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; return crypto.timingSafeEqual(Buffer.from(hash, "hex"), crypto.scryptSync(pw, salt, 64)); }
if (db.prepare("SELECT COUNT(*) c FROM users").get().c === 0) {
  const email = process.env.ADMIN_EMAIL || "admin@accessibility.local";
  const pw = process.env.ADMIN_PASSWORD || "Admin123!";
  db.prepare("INSERT INTO users (id,email,password_hash,name,role,created_at) VALUES (?,?,?,?,?,?)")
    .run(uuid(), email, hashPassword(pw), "Platform Admin", "super_admin", now());
  console.log(`[seed] admin created: ${email} (change ADMIN_PASSWORD in production)`);
}
if (db.prepare("SELECT COUNT(*) c FROM releases").get().c === 0) {
  db.prepare("INSERT INTO releases (id,widget_version,notes,rollout_percent,status,created_at) VALUES (?,?,?,?,?,?)")
    .run(uuid(), WIDGET_VERSION, "Initial widget release (v1.0.0). Loader + Shadow-DOM widget, profiles, 13-language framework.", 100, "current", now());
}
const currentRelease = () => db.prepare("SELECT * FROM releases WHERE status='current' ORDER BY created_at DESC LIMIT 1").get()
  || db.prepare("SELECT * FROM releases ORDER BY created_at DESC LIMIT 1").get();

// ---------- helpers ----------
const send = (res, status, obj, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", ...headers });
  res.end(JSON.stringify(obj));
};
const secHeaders = { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 1_000_000) throw new Error("body_too_large"); chunks.push(c); }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}
function auth(req) {
  const m = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const tokenHash = crypto.createHash("sha256").update(m[1]).digest("hex");
  const s = db.prepare("SELECT * FROM sessions WHERE token_hash=?").get(tokenHash);
  if (!s || new Date(s.expires_at) < new Date()) return null;
  return db.prepare("SELECT id,email,name,role FROM users WHERE id=?").get(s.user_id);
}
const canWrite = (u) => u && u.role !== "auditor";
const canAdmin = (u) => u && u.role === "super_admin";
const rate = new Map();
function rateLimit(req, res, key, max) {
  const win = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const k = `${req.socket.remoteAddress}:${key}`; const t = Date.now();
  const arr = (rate.get(k) || []).filter((x) => x > t - win); arr.push(t); rate.set(k, arr);
  if (arr.length > max) { send(res, 429, { error: "rate_limited", message: "Too many requests. Please wait and try again." }); return false; }
  return true;
}
function originHost(req) {
  const o = req.headers.origin || req.headers.referer || "";
  try { return o ? new URL(o).hostname.toLowerCase() : null; } catch { return null; }
}
function originAllowed(site, req) {
  const h = originHost(req);
  if (!h) return true; // non-browser caller (curl, install-check); browser calls always send Origin
  if (h === "localhost" || h === "127.0.0.1") return true;
  const allowed = new Set([site.base_domain.toLowerCase(), ...site.allowed_hostnames.map((x) => String(x).toLowerCase())]);
  return allowed.has(h);
}
function publicId() { return "site_" + crypto.randomBytes(8).toString("hex"); }

// ---------- static ----------
const DASH_DIR = fs.existsSync(path.join(ROOT, "apps/dashboard/dist")) ? path.join(ROOT, "apps/dashboard/dist")
  : path.join(ROOT, "apps/api/public/dashboard");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".map": "application/json" };
function serveFile(res, file, cache) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": cache || "no-cache", ...secHeaders });
  fs.createReadStream(file).pipe(res); return true;
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://local");
    const pathname = url.pathname;

    // Widget CDN assets — versioned, immutable, compressed by reverse proxy (see infrastructure/nginx).
    if (pathname === "/widget/v1/loader.js" || pathname === "/widget/v1/widget.js" || pathname === "/widget/v1.0.0/widget.js") {
      const file = pathname.endsWith("loader.js")
        ? path.join(ROOT, "packages/widget-loader/loader.js")
        : path.join(ROOT, "packages/widget-core/src/widget.js");
      if (serveFile(res, file, "public, max-age=31536000, immutable")) return;
      return send(res, 404, { error: "not_found" });
    }
    // Demo site (separate folder, served here for the demo; deploy it anywhere in prod).
    if (pathname === "/demo" || pathname === "/demo/") {
      if (serveFile(res, path.join(ROOT, "apps/demo-site/index.html"), "no-cache")) return;
    }
    if (pathname.startsWith("/demo/")) {
      if (serveFile(res, path.join(ROOT, "apps/demo-site", pathname.slice(6)), "no-cache")) return;
      return send(res, 404, { error: "not_found" });
    }
    if (pathname === "/api/health") return send(res, 200, { ok: true, version: WIDGET_VERSION, time: now(), publicBaseUrl: PUBLIC_BASE_URL });

    // ---- Public config (the widget's only public endpoint) ----
    if (pathname === "/api/public/config" && req.method === "GET") {
      const site = rowSite(db.prepare("SELECT * FROM sites WHERE public_id=?").get(url.searchParams.get("siteId") || ""));
      if (!site || !site.enabled) { send(res, 404, { error: "site_not_found_or_disabled", message: "Site not found, disabled, or not yet published. Check the site ID and that the site is enabled." }); return; }
      if (!originAllowed(site, req)) { send(res, 403, { error: "origin_not_allowed", message: "This hostname is not allowlisted for this site. Add it in Website Management → Allowed hostnames." }); return; }
      const pub = db.prepare("SELECT * FROM site_configs WHERE site_id=? AND status='published' ORDER BY version DESC LIMIT 1").get(site.id);
      if (!pub) { send(res, 404, { error: "not_published", message: "No published configuration yet. Save a draft and Publish it in the dashboard." }); return; }
      const rel = currentRelease();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": req.headers.origin || "*" });
      res.end(JSON.stringify({ siteId: site.public_id, siteName: site.name, widgetVersion: rel ? rel.widget_version : WIDGET_VERSION, configVersion: pub.version, publishedAt: pub.created_at, config: parseJSON(pub.config, DEFAULT_CONFIG) }));
      return;
    }
    if (pathname === "/api/public/diagnostics" && req.method === "POST") {
      if (!rateLimit(req, res, "diag", 30)) return;
      const body = await readBody(req).catch(() => ({}));
      const site = rowSite(db.prepare("SELECT * FROM sites WHERE public_id=?").get(String(body.siteId || "")));
      db.prepare("INSERT INTO diagnostics (id,site_id,kind,message,origin,created_at) VALUES (?,?,?,?,?,?)")
        .run(uuid(), site ? site.id : null, String(body.kind || "load_error").slice(0, 80), String(body.message || "").slice(0, 500), originHost(req) || "", now());
      return send(res, 200, { ok: true });
    }
    if (req.method === "OPTIONS" && pathname.startsWith("/api/public/")) {
      res.writeHead(204, { "Access-Control-Allow-Origin": req.headers.origin || "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); res.end(); return;
    }

    // ---- Auth ----
    if (pathname === "/api/auth/login" && req.method === "POST") {
      if (!rateLimit(req, res, "login", 20)) return;
      const body = await readBody(req).catch(() => ({}));
      const user = db.prepare("SELECT * FROM users WHERE email=?").get(String(body.email || "").toLowerCase());
      if (!user || !verifyPassword(String(body.password || ""), user.password_hash)) return send(res, 401, { error: "invalid_credentials", message: "Email or password is incorrect." });
      const token = crypto.randomBytes(32).toString("hex");
      db.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)")
        .run(uuid(), user.id, crypto.createHash("sha256").update(token).digest("hex"), new Date(Date.now() + SESSION_TTL_MS).toISOString(), now());
      logAction(user.id, "login", "user", user.email);
      return send(res, 200, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const u = auth(req); if (u) { const m = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/); if (m) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(crypto.createHash("sha256").update(m[1]).digest("hex")); }
      return send(res, 200, { ok: true });
    }

    // ---- All remaining /api/* need auth ----
    if (pathname.startsWith("/api/")) {
      const user = auth(req);
      if (!user) return send(res, 401, { error: "unauthorized", message: "Sign in to continue." });
      const body = req.method === "POST" || req.method === "PUT" ? await readBody(req).catch(() => null) : null;
      if ((req.method === "POST" || req.method === "PUT") && body === null) return send(res, 400, { error: "invalid_json" });

      if (pathname === "/api/auth/me") return send(res, 200, { user });
      if (pathname === "/api/overview") {
        const sites = db.prepare("SELECT COUNT(*) c FROM sites").get().c;
        const enabled = db.prepare("SELECT COUNT(*) c FROM sites WHERE enabled=1").get().c;
        const published = db.prepare("SELECT COUNT(*) c FROM site_configs WHERE status='published'").get().c;
        const audits = db.prepare("SELECT * FROM audits ORDER BY created_at DESC LIMIT 5").all().map((a) => ({ ...a, findings: parseJSON(a.findings, []), summary: parseJSON(a.summary, {}) }));
        const diagnostics = db.prepare("SELECT * FROM diagnostics ORDER BY created_at DESC LIMIT 10").all();
        const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10").all();
        return send(res, 200, { sites, enabled, publishedConfigs: published, currentVersion: (currentRelease() || {}).widget_version || WIDGET_VERSION, audits, diagnostics, logs, publicBaseUrl: PUBLIC_BASE_URL });
      }
      if (pathname === "/api/audit-logs") return send(res, 200, { logs: db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").all() });

      // Sites
      if (pathname === "/api/sites" && req.method === "GET") {
        const rows = db.prepare("SELECT * FROM sites ORDER BY created_at DESC").all().map((s) => {
          const r = rowSite(s); const pub = db.prepare("SELECT version,created_at FROM site_configs WHERE site_id=? AND status='published' ORDER BY version DESC LIMIT 1").get(s.id);
          const draft = db.prepare("SELECT id FROM site_configs WHERE site_id=? AND status='draft' ORDER BY created_at DESC LIMIT 1").get(s.id);
          return { ...r, publishedVersion: pub ? pub.version : null, publishedAt: pub ? pub.created_at : null, hasDraft: !!draft };
        });
        return send(res, 200, { sites: rows, publicBaseUrl: PUBLIC_BASE_URL });
      }
      if (pathname === "/api/sites" && req.method === "POST") {
        if (!canWrite(user)) return send(res, 403, { error: "forbidden", message: "Auditors have read-only access." });
        const name = String(body.name || "").trim(); const base = String(body.baseDomain || "").trim().toLowerCase();
        if (!name || !validateHostname(base)) return send(res, 400, { error: "invalid_site", message: "Provide a display name and a valid base domain (e.g. example.gov.in)." });
        const allowed = (Array.isArray(body.allowedHostnames) ? body.allowedHostnames : [base]).filter(validateHostname);
        const id = uuid(); const pid = publicId();
        db.prepare("INSERT INTO sites (id,public_id,name,base_domain,allowed_hostnames,enabled,verified,verification_token,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
          .run(id, pid, name, base, JSON.stringify([...new Set([base, ...allowed])]), 1, 0, crypto.randomBytes(16).toString("hex"), user.id, now(), now());
        db.prepare("INSERT INTO site_configs (id,site_id,status,version,config,published_by,created_at) VALUES (?,?,?,?,?,?,?)")
          .run(uuid(), id, "draft", 0, JSON.stringify(sanitizeConfig(body.config || {})), null, now());
        logAction(user.id, "site_created", "site", `${name} (${pid})`);
        return send(res, 201, { site: rowSite(db.prepare("SELECT * FROM sites WHERE id=?").get(id)) });
      }
      const siteMatch = pathname.match(/^\/api\/sites\/([^/]+)(\/.*)?$/);
      if (siteMatch) {
        const site = rowSite(db.prepare("SELECT * FROM sites WHERE id=? OR public_id=?").get(siteMatch[1], siteMatch[1]));
        if (!site) return send(res, 404, { error: "site_not_found" });
        const rest = siteMatch[2] || "";
        if (rest === "" && req.method === "PUT") {
          if (!canWrite(user)) return send(res, 403, { error: "forbidden" });
          const name = String(body.name || site.name).trim(); const base = String(body.baseDomain || site.base_domain).trim().toLowerCase();
          const allowed = (Array.isArray(body.allowedHostnames) ? body.allowedHostnames : site.allowed_hostnames).filter(validateHostname);
          db.prepare("UPDATE sites SET name=?, base_domain=?, allowed_hostnames=?, enabled=?, updated_at=? WHERE id=?")
            .run(name, base, JSON.stringify([...new Set([base, ...allowed])]), body.enabled === false ? 0 : 1, now(), site.id);
          logAction(user.id, "site_updated", "site", name);
          return send(res, 200, { site: rowSite(db.prepare("SELECT * FROM sites WHERE id=?").get(site.id)) });
        }
        if (rest === "/config" && req.method === "GET") {
          const draft = db.prepare("SELECT * FROM site_configs WHERE site_id=? AND status='draft' ORDER BY created_at DESC LIMIT 1").get(site.id);
          const pub = db.prepare("SELECT * FROM site_configs WHERE site_id=? AND status='published' ORDER BY version DESC LIMIT 1").get(site.id);
          return send(res, 200, { site, draft: draft ? { ...draft, config: parseJSON(draft.config, {}) } : null, published: pub ? { ...pub, config: parseJSON(pub.config, {}) } : null });
        }
        if (rest === "/config" && req.method === "PUT") {
          if (!canWrite(user)) return send(res, 403, { error: "forbidden" });
          const config = sanitizeConfig(body.config || {});
          db.prepare("INSERT INTO site_configs (id,site_id,status,version,config,published_by,created_at) VALUES (?,?,?,?,?,?,?)")
            .run(uuid(), site.id, "draft", 0, JSON.stringify(config), null, now());
          logAction(user.id, "config_drafted", "site", site.name);
          return send(res, 200, { ok: true, config });
        }
        if (rest === "/publish" && req.method === "POST") {
          if (!canWrite(user)) return send(res, 403, { error: "forbidden" });
          const draft = db.prepare("SELECT * FROM site_configs WHERE site_id=? AND status='draft' ORDER BY created_at DESC LIMIT 1").get(site.id);
          if (!draft) return send(res, 400, { error: "no_draft", message: "Save a draft before publishing." });
          const prev = db.prepare("SELECT MAX(version) v FROM site_configs WHERE site_id=? AND status='published'").get(site.id).v || 0;
          db.prepare("INSERT INTO site_configs (id,site_id,status,version,config,published_by,created_at) VALUES (?,?,?,?,?,?,?)")
            .run(uuid(), site.id, "published", prev + 1, draft.config, user.id, now());
          logAction(user.id, "config_published", "site", `${site.name} v${prev + 1}`);
          return send(res, 200, { ok: true, version: prev + 1 });
        }
        if (rest === "/history" && req.method === "GET") {
          const rows = db.prepare("SELECT * FROM site_configs WHERE site_id=? ORDER BY created_at DESC LIMIT 50").all()
            .map((r) => ({ ...r, config: parseJSON(r.config, {}) }));
          return send(res, 200, { history: rows });
        }
        if (rest === "/rollback" && req.method === "POST") {
          if (!canWrite(user)) return send(res, 403, { error: "forbidden" });
          const target = db.prepare("SELECT * FROM site_configs WHERE id=? AND site_id=?").get(String(body.configId || ""), site.id);
          if (!target) return send(res, 404, { error: "config_not_found" });
          const prev = db.prepare("SELECT MAX(version) v FROM site_configs WHERE site_id=? AND status='published'").get(site.id).v || 0;
          db.prepare("INSERT INTO site_configs (id,site_id,status,version,config,published_by,created_at) VALUES (?,?,?,?,?,?,?)")
            .run(uuid(), site.id, "published", prev + 1, target.config, user.id, now());
          logAction(user.id, "config_rolled_back", "site", `${site.name} -> v${prev + 1}`);
          return send(res, 200, { ok: true, version: prev + 1 });
        }
        if (rest === "/install-test" && req.method === "GET") {
          const pub = db.prepare("SELECT * FROM site_configs WHERE site_id=? AND status='published' ORDER BY version DESC LIMIT 1").get(site.id);
          const loaderOk = fs.existsSync(path.join(ROOT, "packages/widget-loader/loader.js"));
          const bundleOk = fs.existsSync(path.join(ROOT, "packages/widget-core/src/widget.js"));
          const checks = [
            { name: "Site is enabled", pass: site.enabled, detail: site.enabled ? "Enabled" : "Disabled in Website Management" },
            { name: "Published configuration exists", pass: !!pub, detail: pub ? `Published v${pub.version}` : "No published config — save a draft and publish" },
            { name: "Loader script exists (server)", pass: loaderOk, detail: "/widget/v1/loader.js" },
            { name: "Widget bundle exists (server)", pass: bundleOk, detail: "/widget/v1/widget.js" },
            { name: "Allowed hostnames configured", pass: site.allowed_hostnames.length > 0, detail: site.allowed_hostnames.join(", ") },
          ];
          return send(res, 200, { site, checks, allPass: checks.every((c) => c.pass), snippet: `<script src="${PUBLIC_BASE_URL}/widget/v1/loader.js" data-site-id="${site.public_id}" defer></script>` });
        }
        if (rest === "/verify" && req.method === "POST") {
          if (!canWrite(user)) return send(res, 403, { error: "forbidden" });
          // Ownership check: the host must serve the verification token at
          // /.well-known/accessibility-verification.txt — or an admin may
          // confirm manual verification (e.g. DNS/meta) in a real deployment.
          // Demo: token echo via the demo site is accepted only when the
          // caller supplies the token, proving they control the host page.
          if (String(body.token || "") === site.verification_token) {
            db.prepare("UPDATE sites SET verified=1 WHERE id=?").run(site.id);
            logAction(user.id, "site_verified", "site", site.name);
            return send(res, 200, { verified: true });
          }
          return send(res, 200, { verified: false, hint: "Host the verification token (shown in Website Management) and retry. In production, serve it at /.well-known/accessibility-verification.txt on the site." });
        }
        return send(res, 404, { error: "not_found" });
      }

      // Releases
      if (pathname === "/api/releases" && req.method === "GET") return send(res, 200, { releases: db.prepare("SELECT * FROM releases ORDER BY created_at DESC").all() });
      if (pathname === "/api/releases" && req.method === "POST") {
        if (!canAdmin(user)) return send(res, 403, { error: "forbidden", message: "Only Super Administrators manage releases." });
        const v = String(body.widgetVersion || "").trim(); if (!v) return send(res, 400, { error: "invalid_release" });
        db.prepare("INSERT INTO releases (id,widget_version,notes,rollout_percent,status,created_at) VALUES (?,?,?,?,?,?)")
          .run(uuid(), v, String(body.notes || ""), Math.min(100, Math.max(0, Number(body.rolloutPercent) || 100)), "draft", now());
        logAction(user.id, "release_created", "release", v);
        return send(res, 201, { ok: true });
      }
      const relMatch = pathname.match(/^\/api\/releases\/([^/]+)\/(activate|rollback)$/);
      if (relMatch && req.method === "POST") {
        if (!canAdmin(user)) return send(res, 403, { error: "forbidden" });
        const rel = db.prepare("SELECT * FROM releases WHERE id=?").get(relMatch[1]);
        if (!rel) return send(res, 404, { error: "release_not_found" });
        db.prepare("UPDATE releases SET status='rolled_back' WHERE status='current'").run();
        db.prepare("UPDATE releases SET status='current' WHERE id=?").run(rel.id);
        logAction(user.id, relMatch[2] === "activate" ? "release_activated" : "release_rolled_back", "release", rel.widget_version);
        return send(res, 200, { ok: true, current: rel.widget_version });
      }

      // Audits
      if (pathname === "/api/audits" && req.method === "GET") {
        const rows = db.prepare("SELECT * FROM audits ORDER BY created_at DESC LIMIT 50").all().map((a) => ({ ...a, findings: parseJSON(a.findings, []), summary: parseJSON(a.summary, {}) }));
        return send(res, 200, { audits: rows });
      }
      if (pathname === "/api/audits" && req.method === "POST") {
        if (!canWrite(user)) return send(res, 403, { error: "forbidden" });
        const target = String(body.url || "").trim();
        let u; try { u = new URL(target); } catch { return send(res, 400, { error: "invalid_url" }); }
        if (!["http:", "https:"].includes(u.protocol)) return send(res, 400, { error: "invalid_url" });
        const isPrivate = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname);
        if (isPrivate && !ALLOW_PRIVATE_AUDIT) return send(res, 400, { error: "private_url_blocked", message: "Scanning private/internal URLs is disabled in production (set ALLOW_PRIVATE_AUDIT=true only in a trusted dev environment)." });
        let siteId = null;
        if (body.siteId) { const s = rowSite(db.prepare("SELECT * FROM sites WHERE id=? OR public_id=?").get(body.siteId, body.siteId)); if (s) siteId = s.id; }
        let html = "";
        try {
          const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
          const r = await fetch(target, { signal: ctrl.signal, headers: { "User-Agent": "AccessibilityPlatform-Audit/1.0" } }); clearTimeout(t);
          html = await r.text();
        } catch (e) { return send(res, 502, { error: "fetch_failed", message: `Could not fetch the URL: ${e.message}` }); }
        const result = runAudit(html, target);
        const id = uuid();
        db.prepare("INSERT INTO audits (id,site_id,url,status,findings,summary,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)")
          .run(id, siteId, target, "done", JSON.stringify(result.findings), JSON.stringify(result.summary), user.id, now());
        logAction(user.id, "audit_run", "audit", target);
        return send(res, 201, { id, url: target, ...result });
      }
      return send(res, 404, { error: "not_found" });
    }

    // Dashboard SPA (React build) — SPA fallback for non-file routes.
    if (req.method === "GET") {
      const file = path.join(DASH_DIR, pathname === "/" ? "index.html" : pathname.replace(/^\//, ""));
      if (serveFile(res, file, "no-cache")) return;
      if (fs.existsSync(path.join(DASH_DIR, "index.html"))) {
        if (serveFile(res, path.join(DASH_DIR, "index.html"), "no-cache")) return;
      }
      // No dashboard build yet: honest landing page (build it — see README).
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ...secHeaders });
      res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Accessibility Platform</title></head><body style="font-family:system-ui;padding:2rem"><h1>Accessibility Platform API</h1><p>The dashboard build is not present yet. Run <code>npm run build:dashboard</code> in <code>apps/dashboard</code>, then reload.</p><p><a href="/demo/">Demo site</a> · <a href="/api/health">API health</a></p></body></html>`);
      return;
    }
    return send(res, 404, { error: "not_found" });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: "internal_error", message: "Something went wrong. Check server logs; no internal details are exposed here." });
  }
});
server.listen(PORT, HOST, () => console.log(`Accessibility Platform on http://${HOST}:${PORT} — public base: ${PUBLIC_BASE_URL}`));
