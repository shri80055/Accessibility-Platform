// Storage layer — the ONLY module that touches the database.
// Demo/dev: SQLite via node:sqlite (file persisted, real rows, real queries).
// Production: PostgreSQL via database/migrations/001_init.sql + Prisma schema.
// The tables/columns are intentionally identical so the swap is mechanical.
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const dbPath = process.env.DATABASE_PATH || path.join(root, "data", "accessibility.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', role TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sites (id TEXT PRIMARY KEY, public_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, base_domain TEXT NOT NULL, allowed_hostnames TEXT NOT NULL DEFAULT '[]', enabled INTEGER NOT NULL DEFAULT 1, verified INTEGER NOT NULL DEFAULT 0, verification_token TEXT NOT NULL, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS site_configs (id TEXT PRIMARY KEY, site_id TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, config TEXT NOT NULL, published_by TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS releases (id TEXT PRIMARY KEY, widget_version TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', rollout_percent INTEGER NOT NULL DEFAULT 100, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audits (id TEXT PRIMARY KEY, site_id TEXT, url TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'done', findings TEXT NOT NULL DEFAULT '[]', summary TEXT NOT NULL DEFAULT '{}', created_by TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS diagnostics (id TEXT PRIMARY KEY, site_id TEXT, kind TEXT NOT NULL, message TEXT NOT NULL DEFAULT '', origin TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, entity TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_configs_site_status ON site_configs(site_id, status);
`);
export const now = () => new Date().toISOString();
export const uuid = () => randomUUID();
export function parseJSON(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }
export function rowSite(r) {
  if (!r) return null;
  return { ...r, enabled: !!r.enabled, verified: !!r.verified, allowed_hostnames: parseJSON(r.allowed_hostnames, []) };
}
export function logAction(userId, action, entity, detail) {
  db.prepare("INSERT INTO audit_logs (id,user_id,action,entity,detail,created_at) VALUES (?,?,?,?,?,?)")
    .run(uuid(), userId || null, action, entity || "", String(detail || "").slice(0, 500), now());
}
