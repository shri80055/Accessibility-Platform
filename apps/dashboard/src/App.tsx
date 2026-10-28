import { useEffect, useState } from "react";
import { api, LANGUAGES, FEATURES, PROFILES } from "./api";

type View = "overview" | "sites" | "studio" | "install" | "releases" | "audit";
const emptyConfig: any = { position: "bottom-right", buttonLabel: "Accessibility", buttonColor: "#0b3d91", buttonTextColor: "#ffffff", buttonSize: "medium", borderRadius: 14, offsetX: 20, offsetY: 20, tooltip: "Accessibility options", panelWidth: 340, defaultLanguage: "en", enabledLanguages: ["en", "hi", "mr"], enabledFeatures: FEATURES, enabledProfiles: PROFILES, persistence: "local", showProfiles: true, showLanguageSelector: true };
const NAV: [View, string, string][] = [["overview", "Overview", "◉"], ["sites", "Websites", "▦"], ["studio", "Studio", "✦"], ["install", "Install & Verify", "⌘"], ["releases", "Releases", "↺"], ["audit", "Audit", "✓"]];
const VIEW_TITLE: Record<View, string> = { overview: "Overview", sites: "Website Management", studio: "Customization Studio", install: "Installation & Verification", releases: "Version & Releases", audit: "Accessibility Audit" };
const VIEW_SUB: Record<View, string> = { overview: "Real data from your platform — nothing here is fabricated.", sites: "Register, verify and control every website that uses the widget.", studio: "Design the widget, then publish. Only published configs reach live sites.", install: "One script tag, framework guides, CSP and a real installation test.", releases: "Widget version and site configuration version, kept separate.", audit: "Automated findings only — never a compliance certification." };
function Badge({ tone, children }: any) {
  const tones: any = { green: "bg-emerald-50 text-emerald-700 ring-emerald-200", blue: "bg-blue-50 text-blue-700 ring-blue-200", amber: "bg-amber-50 text-amber-700 ring-amber-200", rose: "bg-rose-50 text-rose-700 ring-rose-200", slate: "bg-slate-100 text-slate-600 ring-slate-200", indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200" };
  return <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 " + (tones[tone] || tones.slate)}>{children}</span>;
}
function Card({ children, className }: any) { return <div className={"rounded-2xl border border-slate-200 bg-white shadow-sm " + (className || "")}>{children}</div>; }
function Field({ label, children }: any) { return <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1.5">{children}</div></label>; }
const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const btnPrimary = "rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/20 hover:from-blue-800 hover:to-indigo-700";
const btnSecondary = "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800";
const btnGhost = "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<View>("overview");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [overview, setOverview] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [config, setConfig] = useState<any>(emptyConfig);
  const [published, setPublished] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [install, setInstall] = useState<any>(null);
  const [auditUrl, setAuditUrl] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [login, setLogin] = useState({ email: "admin@accessibility.local", password: "Admin123!" });
  const [newSite, setNewSite] = useState({ name: "", baseDomain: "" });
  const [relForm, setRelForm] = useState({ widgetVersion: "", notes: "", rolloutPercent: 100 });

  async function loadAll() {
    try {
      const me = await api("/api/auth/me"); setUser(me.user);
      const ov = await api("/api/overview"); setOverview(ov);
      const s = await api("/api/sites"); setSites(s.sites); setBaseUrl(s.publicBaseUrl);
      const a = await api("/api/audits"); setAudits(a.audits);
      const r = await api("/api/releases"); setReleases(r.releases);
      if (s.sites[0] && !selected) selectSite(s.sites[0]);
    } catch (e: any) { setErr(e.message); }
  }
  async function selectSite(site: any) {
    setSelected(site);
    try { const c = await api("/api/sites/" + site.id + "/config"); setConfig(c.draft ? c.draft.config : emptyConfig); setPublished(c.published); const h = await api("/api/sites/" + site.id + "/history"); setHistory(h.history); } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { if (localStorage.getItem("a11y-token")) loadAll(); }, []);
  async function doLogin(e: any) { e.preventDefault(); setErr(""); try { const r = await api("/api/auth/login", { method: "POST", body: JSON.stringify(login) }); localStorage.setItem("a11y-token", r.token); setUser(r.user); loadAll(); } catch (e: any) { setErr(e.message); } }
  function logout() { api("/api/auth/logout", { method: "POST" }).catch(() => {}); localStorage.removeItem("a11y-token"); setUser(null); }
  async function act(fn: () => Promise<any>, okMsg: string) { setErr(""); setMsg(""); try { const r = await fn(); setMsg(okMsg); if (r) return r; } catch (e: any) { setErr(e.message); } }
  const snippet = selected ? '<script src="' + baseUrl + '/widget/v1/loader.js" data-site-id="' + selected.public_id + '" defer></script>' : "";
  const navBtn = (v: View, label: string, icon: string, vertical: boolean) => (
    <button key={v} onClick={() => setView(v)} aria-current={view === v ? "page" : undefined}
      className={vertical
        ? "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition " + (view === v ? "bg-white/10 text-white ring-1 ring-white/20" : "text-slate-300 hover:bg-white/5 hover:text-white")
        : "shrink-0 rounded-full px-4 py-2 text-sm font-medium " + (view === v ? "bg-white text-slate-900" : "text-slate-300 hover:text-white")}>
      <span aria-hidden="true" className={vertical ? "flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm" : ""}>{icon}</span>{label}
      {view === v && vertical && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />}
    </button>
  );

  if (!user) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.35),transparent_60%)] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-600 px-8 py-8 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/30" aria-hidden="true">♿</div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Accessibility Platform</h1>
          <p className="mt-1 text-sm text-blue-100">Self-hosted widget CDN · GIGW 3.0 / DBIM aligned</p>
        </div>
        <form onSubmit={doLogin} className="space-y-4 px-8 py-8">
          <Field label="Email"><input className={inputCls} value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></Field>
          <Field label="Password"><input type="password" className={inputCls} value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></Field>
          <button className={btnPrimary + " w-full py-3"}>Sign in securely →</button>
          {err && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{err}</p>}
          <p className="text-center text-xs leading-relaxed text-slate-500">Dev admin: admin@accessibility.local / Admin123!<br />Change ADMIN_PASSWORD before any real deployment.</p>
        </form>
      </div>
    </main>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-[#0a2540] p-5 text-white md:flex">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-2xl shadow-lg shadow-blue-900/40" aria-hidden="true">♿</div>
          <div><p className="text-base font-bold leading-tight tracking-tight">Accessibility<br />Platform</p><p className="text-[11px] uppercase tracking-widest text-slate-400">Self-hosted CDN</p></div>
        </div>
        <nav aria-label="Dashboard" className="mt-8 flex flex-col gap-1.5">{NAV.map(([v, l, i]) => navBtn(v, l, i, true))}</nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-widest text-slate-400">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email} · {user.role}</p>
            <button onClick={logout} className="mt-3 w-full rounded-full bg-white/10 py-2 text-sm font-semibold hover:bg-white/20">Sign out</button>
          </div>
          <p className="px-1 text-[11px] leading-relaxed text-slate-500">Installing this widget does not make a website compliant or certified. It provides presentation, keyboard, reading and language controls.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav aria-label="Dashboard" className="flex gap-2 overflow-x-auto bg-[#0a2540] px-4 py-3 md:hidden">{NAV.map(([v, l, i]) => navBtn(v, l, i, false))}</nav>
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div><h1 className="text-xl font-bold tracking-tight">{VIEW_TITLE[view]}</h1><p className="text-sm text-slate-500">{VIEW_SUB[view]}</p></div>
            <div className="flex items-center gap-2"><Badge tone="indigo">● Self-hosted</Badge><Badge tone="green">{overview ? "v" + overview.currentVersion : "v1.0.0"} live</Badge><button onClick={logout} className="md:hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold">Sign out</button></div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-7">
          {msg && <p role="status" className="mb-5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">✓ {msg}</p>}
          {err && <p role="alert" className="mb-5 rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 ring-1 ring-rose-200">{err}</p>}

          {view === "overview" && overview && (
            <section>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[[overview.sites, "Registered websites", "All sites in the database", "from-blue-600 to-indigo-600", "▦"], [overview.enabled, "Enabled sites", "Widgets allowed to load", "from-emerald-500 to-teal-600", "●"], [overview.publishedConfigs, "Published configs", "Live configurations served", "from-violet-500 to-purple-600", "✦"], [overview.currentVersion, "Widget version", "Current SDK release", "from-amber-500 to-orange-500", "↺"]].map(([n, l, s, g, ic]: any) => (
                  <Card key={l} className="p-5"><div className={"flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white shadow-md " + g} aria-hidden="true">{ic}</div><p className="mt-4 text-3xl font-bold tracking-tight">{n}</p><p className="text-sm font-semibold">{l}</p><p className="text-xs text-slate-500">{s}</p></Card>
                ))}
              </div>
              {overview.sites === 0 && <Card className="mt-5 border-amber-200 bg-amber-50 p-5"><p className="font-semibold text-amber-900">No websites yet — and nothing here is made up.</p><p className="mt-1 text-sm text-amber-800">Go to Websites and register your first site. Counts, scans and diagnostics below only appear once real activity exists.</p></Card>}
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <Card className="p-5"><h2 className="font-bold">Latest accessibility scans</h2><p className="text-sm text-slate-500">Automated findings only.</p>
                  <div className="mt-4 space-y-3">{overview.audits.length === 0 ? <p className="text-sm text-slate-500">No scans yet. Run one from the Audit tab.</p> : overview.audits.map((a: any) => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{a.url}</p><p className="text-xs text-slate-500">{a.summary.total} findings</p></div><Badge tone={a.summary.total === 0 ? "green" : "amber"}>{a.summary.total === 0 ? "Clean scan" : (a.summary.bySeverity?.serious || 0) + " serious"}</Badge></div>)}</div>
                </Card>
                <Card className="p-5"><h2 className="font-bold">Failed widget loads &amp; diagnostics</h2><p className="text-sm text-slate-500">Reported by loaders — errors only, never visitor preferences.</p>
                  <div className="mt-4 space-y-3">{overview.diagnostics.length === 0 ? <p className="text-sm text-slate-500">No failed loads reported. That's a good sign.</p> : overview.diagnostics.map((d: any) => <div key={d.id} className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-sm font-medium">{d.kind}</p><p className="truncate text-xs text-slate-500">{d.message} · {d.origin || "unknown origin"}</p></div>)}</div>
                </Card>
              </div>
              <Card className="mt-5 p-5"><h2 className="font-bold">Recent admin activity</h2>
                <div className="mt-3 divide-y divide-slate-100">{overview.logs.length === 0 ? <p className="text-sm text-slate-500">No admin activity yet.</p> : overview.logs.map((l: any) => <p key={l.id} className="py-2 text-sm"><span className="font-semibold">{l.action}</span> <span className="text-slate-500">— {l.detail}</span></p>)}</div>
              </Card>
            </section>
          )}

          {view === "sites" && (
            <section>
              <Card className="p-5">
                <h2 className="font-bold">Register a new website</h2><p className="text-sm text-slate-500">A draft configuration is created automatically.</p>
                <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={async (e) => { e.preventDefault(); await act(async () => { const r = await api("/api/sites", { method: "POST", body: JSON.stringify(newSite) }); const s = await api("/api/sites"); setSites(s.sites); setNewSite({ name: "", baseDomain: "" }); return r; }, "Website registered. A draft configuration was created automatically."); }}>
                  <Field label="Display name"><input className={inputCls} value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} required placeholder="e.g. District Portal" /></Field>
                  <Field label="Base domain"><input className={inputCls} placeholder="example.gov.in" value={newSite.baseDomain} onChange={(e) => setNewSite({ ...newSite, baseDomain: e.target.value })} required /></Field>
                  <button className={btnPrimary}>+ Register website</button>
                </form>
              </Card>
              {sites.length === 0 && <p className="mt-6 text-sm text-slate-500">No websites registered yet.</p>}
              <div className="mt-5 grid gap-4">
                {sites.map((s: any) => (
                  <Card key={s.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="text-lg font-bold tracking-tight">{s.name}</h3><p className="text-sm text-slate-500">{s.base_domain}</p></div>
                      <div className="flex flex-wrap gap-2"><Badge tone={s.enabled ? "green" : "rose"}>{s.enabled ? "Enabled" : "Disabled"}</Badge><Badge tone={s.publishedVersion ? "blue" : "amber"}>{s.publishedVersion ? "Published v" + s.publishedVersion : "Not published"}</Badge><Badge tone={s.verified ? "green" : "slate"}>{s.verified ? "Verified" : "Unverified"}</Badge></div>
                    </div>
                    <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                      <p>Public site ID<br /><code className="mt-1 inline-block rounded-lg bg-white px-2 py-1 font-mono text-xs ring-1 ring-slate-200">{s.public_id}</code></p>
                      <p>Allowed hostnames<br /><span className="text-slate-600">{s.allowed_hostnames.join(", ")}</span></p>
                      <p className="sm:col-span-2">Verification token <span className="text-slate-500">(proves host control — keep it private)</span><br /><code className="mt-1 inline-block rounded-lg bg-white px-2 py-1 font-mono text-xs ring-1 ring-slate-200">{s.verification_token}</code></p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className={btnSecondary} onClick={() => { selectSite(s); setView("studio"); }}>Configure →</button>
                      <button className={btnGhost} onClick={() => { selectSite(s); setView("install"); }}>Install code</button>
                      <button className={btnGhost} onClick={() => act(async () => { await api("/api/sites/" + s.id + "/verify", { method: "POST", body: JSON.stringify({ token: s.verification_token }) }); const x = await api("/api/sites"); setSites(x.sites); }, "Site verified (demo token check).")}>Verify (demo)</button>
                      <button className={btnGhost} onClick={() => act(async () => { await api("/api/sites/" + s.id, { method: "PUT", body: JSON.stringify({ enabled: !s.enabled }) }); const x = await api("/api/sites"); setSites(x.sites); }, s.enabled ? "Site disabled — its widget will no longer load." : "Site enabled.")}>{s.enabled ? "Disable" : "Enable"}</button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {view === "studio" && (
            <section>
              <Field label="Website"><select className={inputCls} value={selected?.id || ""} onChange={(e) => { const s = sites.find((x: any) => x.id === e.target.value); if (s) selectSite(s); }}>{sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              {selected && (
                <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_380px]">
                  <div className="space-y-5">
                    <Card className="p-5"><h2 className="font-bold">Appearance</h2><p className="text-sm text-slate-500">Button, colour and position on the host site.</p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Button label"><input className={inputCls} value={config.buttonLabel} onChange={(e) => setConfig({ ...config, buttonLabel: e.target.value })} /></Field>
                        <Field label="Tooltip"><input className={inputCls} value={config.tooltip} onChange={(e) => setConfig({ ...config, tooltip: e.target.value })} /></Field>
                        <Field label="Button colour"><input type="color" className="h-11 w-full rounded-xl border border-slate-200 p-1" value={config.buttonColor} onChange={(e) => setConfig({ ...config, buttonColor: e.target.value })} /></Field>
                        <Field label="Text colour"><input type="color" className="h-11 w-full rounded-xl border border-slate-200 p-1" value={config.buttonTextColor} onChange={(e) => setConfig({ ...config, buttonTextColor: e.target.value })} /></Field>
                        <Field label="Position"><select className={inputCls} value={config.position} onChange={(e) => setConfig({ ...config, position: e.target.value })}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option></select></Field>
                        <Field label="Size"><select className={inputCls} value={config.buttonSize} onChange={(e) => setConfig({ ...config, buttonSize: e.target.value })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></Field>
                        <Field label={"Corner radius — " + config.borderRadius + "px"}><input type="range" min="0" max="28" className="w-full" value={config.borderRadius} onChange={(e) => setConfig({ ...config, borderRadius: Number(e.target.value) })} /></Field>
                        <Field label={"Panel width — " + config.panelWidth + "px"}><input type="range" min="280" max="420" className="w-full" value={config.panelWidth} onChange={(e) => setConfig({ ...config, panelWidth: Number(e.target.value) })} /></Field>
                        <Field label={"Edge offset X — " + config.offsetX + "px"}><input type="range" min="0" max="80" className="w-full" value={config.offsetX} onChange={(e) => setConfig({ ...config, offsetX: Number(e.target.value) })} /></Field>
                        <Field label={"Edge offset Y — " + config.offsetY + "px"}><input type="range" min="0" max="80" className="w-full" value={config.offsetY} onChange={(e) => setConfig({ ...config, offsetY: Number(e.target.value) })} /></Field>
                      </div>
                    </Card>
                    <Card className="p-5"><h2 className="font-bold">Language &amp; persistence</h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Default language"><select className={inputCls} value={config.defaultLanguage} onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value })}>{LANGUAGES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></Field>
                        <Field label="Persistence"><select className={inputCls} value={config.persistence} onChange={(e) => setConfig({ ...config, persistence: e.target.value })}><option value="local">Local (across visits)</option><option value="session">Session only</option><option value="none">No persistence</option></select></Field>
                      </div>
                      <label className="mt-4 flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={config.showProfiles} onChange={(e) => setConfig({ ...config, showProfiles: e.target.checked })} /> Show profiles</label>
                      <label className="mt-2 flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={config.showLanguageSelector} onChange={(e) => setConfig({ ...config, showLanguageSelector: e.target.checked })} /> Show language selector</label>
                      <fieldset className="mt-4"><legend className="text-sm font-semibold">Enabled languages</legend><div className="mt-2 flex flex-wrap gap-2">{LANGUAGES.map(([c, l]) => <label key={c} className={"cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 " + (config.enabledLanguages.includes(c) ? "bg-indigo-600 text-white ring-indigo-600" : "bg-slate-100 text-slate-700 ring-slate-200")}><input type="checkbox" className="sr-only" checked={config.enabledLanguages.includes(c)} onChange={(e) => setConfig({ ...config, enabledLanguages: e.target.checked ? [...config.enabledLanguages, c] : config.enabledLanguages.filter((x: string) => x !== c) })} />{l}</label>)}</div></fieldset>
                    </Card>
                    <Card className="p-5"><h2 className="font-bold">Features &amp; profiles</h2>
                      <fieldset className="mt-3"><legend className="text-sm font-semibold">Enabled features</legend><div className="mt-2 flex flex-wrap gap-2">{FEATURES.map((f) => <label key={f} className={"cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 " + (config.enabledFeatures.includes(f) ? "bg-blue-700 text-white ring-blue-700" : "bg-slate-100 text-slate-700 ring-slate-200")}><input type="checkbox" className="sr-only" checked={config.enabledFeatures.includes(f)} onChange={(e) => setConfig({ ...config, enabledFeatures: e.target.checked ? [...config.enabledFeatures, f] : config.enabledFeatures.filter((x: string) => x !== f) })} />{f}</label>)}</div></fieldset>
                      <fieldset className="mt-4"><legend className="text-sm font-semibold">Enabled profiles</legend><div className="mt-2 flex flex-wrap gap-2">{PROFILES.map((f) => <label key={f} className={"cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 " + (config.enabledProfiles.includes(f) ? "bg-emerald-600 text-white ring-emerald-600" : "bg-slate-100 text-slate-700 ring-slate-200")}><input type="checkbox" className="sr-only" checked={config.enabledProfiles.includes(f)} onChange={(e) => setConfig({ ...config, enabledProfiles: e.target.checked ? [...config.enabledProfiles, f] : config.enabledProfiles.filter((x: string) => x !== f) })} />{f}</label>)}</div></fieldset>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button className={btnGhost} onClick={() => act(async () => { await api("/api/sites/" + selected.id + "/config", { method: "PUT", body: JSON.stringify({ config }) }); }, "Draft saved. Live sites are unchanged until you Publish.")}>Save draft</button>
                        <button className={btnPrimary} onClick={() => act(async () => { await api("/api/sites/" + selected.id + "/config", { method: "PUT", body: JSON.stringify({ config }) }); const r = await api("/api/sites/" + selected.id + "/publish", { method: "POST", body: JSON.stringify({}) }); selectSite(selected); return r; }, "Published. Reload any site using this widget — no host redeploy needed.")}>Save &amp; Publish →</button>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">Currently published: {published ? "v" + published.version + " (" + published.created_at + ")" : "none yet"}</p>
                    </Card>
                  </div>
                  <div className="lg:sticky lg:top-24">
                    <Card className="overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"><span className="h-3 w-3 rounded-full bg-rose-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" /><span className="ml-2 flex-1 truncate rounded-lg bg-white px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200">your-website.example · Live preview</span></div>
                      <div className="relative h-[420px] overflow-hidden bg-white" style={{ direction: config.defaultLanguage === "ur" ? "rtl" : "ltr" }}>
                        <div className="bg-gradient-to-r from-blue-800 to-indigo-600 px-5 py-4 text-white"><p className="font-bold">Sample host page</p><p className="text-xs text-blue-100">This preview is visual only — the real widget is on /demo/.</p></div>
                        <div className="space-y-3 p-5 text-sm text-slate-600"><div className="h-3 w-3/4 rounded bg-slate-200" /><div className="h-3 w-full rounded bg-slate-100" /><div className="h-3 w-5/6 rounded bg-slate-100" /><p>Enabled features:</p><div className="flex flex-wrap gap-1.5">{config.enabledFeatures.map((f: string) => <span key={f} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-100">{f}</span>)}</div></div>
                        <button aria-label={config.tooltip} title={config.tooltip} style={{ position: "absolute", background: `linear-gradient(135deg, ${config.buttonColor}, #4f46e5)`, color: config.buttonTextColor, borderRadius: config.borderRadius, width: config.buttonSize === "small" ? 48 : config.buttonSize === "large" ? 64 : 56, height: config.buttonSize === "small" ? 48 : config.buttonSize === "large" ? 64 : 56, [config.position === "bottom-left" ? "left" : "right"]: config.offsetX, bottom: config.offsetY, fontSize: 24, border: "2px solid #fff", boxShadow: "0 10px 24px rgba(0,0,0,.35)" }}>♿</button>
                      </div>
                    </Card>
                    <Card className="mt-5 p-5"><h2 className="font-bold">History &amp; rollback</h2>
                      <div className="mt-3 space-y-2">{history.length === 0 ? <p className="text-sm text-slate-500">No history yet.</p> : history.map((h: any) => <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{h.status} · v{h.version} · {h.created_at}</span>{h.status !== "published" && <button className="font-semibold text-indigo-700 underline" onClick={() => act(async () => { await api("/api/sites/" + selected.id + "/rollback", { method: "POST", body: JSON.stringify({ configId: h.id }) }); selectSite(selected); }, "Rolled back — a new published version now carries that configuration.")}>Restore</button>}</div>)}</div>
                      <p className="mt-4 text-sm"><a className="font-semibold text-indigo-700 underline" href="/demo/" target="_blank" rel="noreferrer">Open the demo site in a new tab →</a></p>
                    </Card>
                  </div>
                </div>
              )}
            </section>
          )}

          {view === "install" && (
            <section>
              <Field label="Website"><select className={inputCls} value={selected?.id || ""} onChange={(e) => { const s = sites.find((x: any) => x.id === e.target.value); if (s) selectSite(s); }}>{sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              {selected && (<>
                <Card className="mt-5 overflow-hidden"><div className="flex items-center justify-between bg-slate-900 px-5 py-3"><p className="text-sm font-semibold text-white">Installation snippet — add to the host HTML &lt;head&gt;</p><button className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-900" onClick={() => { navigator.clipboard.writeText(snippet); setMsg("Snippet copied to clipboard."); }}>Copy</button></div><pre className="overflow-auto bg-slate-950 p-5 font-mono text-sm leading-relaxed text-emerald-300">{snippet}</pre></Card>
                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[["React", "public/index.html, inside <head>. No package, no component."], ["Angular", "src/index.html, inside <head>. No module import."], ["Vue", "index.html, inside <head>."], ["Bootstrap", "Your shared layout <head>. The widget is framework-free."], ["ASP.NET", "Views/Shared/_Layout.cshtml, inside <head>."], ["PHP", "Your shared header include (e.g. header.php), inside <head>."]].map(([t, d]) => <Card key={t} className="p-5"><p className="font-bold">{t}</p><p className="mt-1 text-sm text-slate-500">{d}</p></Card>)}
                </div>
                <Card className="mt-5 overflow-hidden"><div className="bg-slate-900 px-5 py-3"><p className="text-sm font-semibold text-white">Required Content Security Policy (host site)</p></div><pre className="overflow-auto bg-slate-950 p-5 font-mono text-xs leading-relaxed text-slate-200">{`script-src 'self' ${baseUrl};\nconnect-src 'self' ${baseUrl};\nstyle-src 'self' 'unsafe-inline';\n# style-src 'unsafe-inline' covers the widget's own host-document\n# presentation rules only. Never add 'unsafe-inline' to script-src.`}</pre></Card>
                <Card className="mt-5 p-5"><h2 className="font-bold">Troubleshooting</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600"><li>Button missing? Check: site enabled, configuration published, hostname allowlisted, correct <code>data-site-id</code>, and the browser console — the loader logs the exact reason.</li><li>Config change not visible? Reload — the config endpoint is <code>no-store</code>. A proxy caching it is misconfigured (see the CDN guide).</li><li>Ad/script blockers can block third-party scripts. Self-hosting on your own domain avoids most of this.</li></ul></Card>
                <div className="mt-5"><button className={btnPrimary} onClick={async () => { const r = await api("/api/sites/" + selected.id + "/install-test"); setInstall(r); }}>Run installation test</button>
                  {install && (<Card className="mt-4 p-5"><p className="font-bold">{install.allPass ? "✓ All checks passed" : "Some checks failed — fix the items below"}</p>{install.checks.map((c: any, i: number) => <p key={i} className="py-1 text-sm">{c.pass ? "✓" : "✗"} {c.name} — {c.detail}</p>)}</Card>)}
                </div>
              </>)}
            </section>
          )}

          {view === "releases" && (
            <section>
              <Card className="p-5"><h2 className="font-bold">Create a release</h2><p className="text-sm text-slate-500">Super Admin only. Widget SDK version is separate from each site's configuration version.</p>
                <form className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr_120px_auto] md:items-end" onSubmit={async (e) => { e.preventDefault(); await act(async () => { await api("/api/releases", { method: "POST", body: JSON.stringify(relForm) }); const r = await api("/api/releases"); setReleases(r.releases); setRelForm({ widgetVersion: "", notes: "", rolloutPercent: 100 }); }, "Release draft created (Super Admin only)."); }}>
                  <Field label="Version"><input className={inputCls} placeholder="1.1.0" value={relForm.widgetVersion} onChange={(e) => setRelForm({ ...relForm, widgetVersion: e.target.value })} required /></Field>
                  <Field label="Notes"><input className={inputCls} value={relForm.notes} onChange={(e) => setRelForm({ ...relForm, notes: e.target.value })} /></Field>
                  <Field label="Rollout %"><input type="number" min="0" max="100" className={inputCls} value={relForm.rolloutPercent} onChange={(e) => setRelForm({ ...relForm, rolloutPercent: Number(e.target.value) })} /></Field>
                  <button className={btnPrimary}>Create release</button>
                </form>
              </Card>
              <div className="mt-5 grid gap-4">{releases.map((r: any) => <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-bold">{r.widget_version} <Badge tone={r.status === "current" ? "green" : r.status === "rolled_back" ? "rose" : "slate"}>{r.status}</Badge> <Badge tone="indigo">{r.rollout_percent}% rollout</Badge></p><p className="mt-1 text-sm text-slate-500">{r.notes} · {r.created_at}</p></div><div className="flex gap-2"><button className={btnGhost} onClick={() => act(async () => { await api("/api/releases/" + r.id + "/activate", { method: "POST", body: JSON.stringify({}) }); const x = await api("/api/releases"); setReleases(x.releases); }, "Release activated.")}>Activate</button><button className={btnGhost} onClick={() => act(async () => { await api("/api/releases/" + r.id + "/rollback", { method: "POST", body: JSON.stringify({}) }); const x = await api("/api/releases"); setReleases(x.releases); }, "Rolled back to this release.")}>Rollback to this</button></div></Card>)}</div>
            </section>
          )}

          {view === "audit" && (
            <section>
              <Card className="border-amber-200 bg-amber-50 p-5"><p className="font-semibold text-amber-900">Automated findings only — never a certification.</p><p className="mt-1 text-sm text-amber-800">This module never certifies a site as WCAG-, GIGW- or STQC-compliant. Manual evaluation, keyboard testing and content review are still required.</p></Card>
              <Card className="mt-5 p-5">
                <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); await act(async () => { const r = await api("/api/audits", { method: "POST", body: JSON.stringify({ url: auditUrl, siteId: selected?.id }) }); setAuditResult(r); const a = await api("/api/audits"); setAudits(a.audits); return r; }, "Scan complete."); }}>
                  <div className="min-w-[280px] flex-1"><Field label="URL to scan"><input className={inputCls} placeholder="http://localhost:3000/demo/" value={auditUrl} onChange={(e) => setAuditUrl(e.target.value)} required /></Field></div>
                  <button className={btnPrimary}>Run scan →</button>
                </form>
              </Card>
              {auditResult && (<Card className="mt-5 p-5"><p className="text-lg font-bold">{auditResult.summary.total} findings across {auditResult.checkedRules} automated rules</p><p className="text-sm text-slate-500">{auditResult.summary.disclaimer}</p>{auditResult.findings.map((f: any, i: number) => <div key={i} className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><p><Badge tone={f.severity === "serious" ? "rose" : f.severity === "moderate" ? "amber" : "slate"}>{f.severity}</Badge> <strong className="ml-2">{f.title}</strong> <span className="text-slate-500">(WCAG {f.wcag})</span></p><p className="mt-2">Element: <code className="rounded bg-white px-1 ring-1 ring-slate-200">{f.element}</code></p><p>Guidance: {f.guidance}</p><p className="text-slate-500">Limit: {f.limit}</p></div>)}{auditResult.findings.length === 0 && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">No automated findings on this page. That is not a compliance verdict — manual checks still apply.</p>}</Card>)}
              <Card className="mt-5 p-5"><h2 className="font-bold">Scan history</h2>
                <div className="mt-3 space-y-2">{audits.length === 0 ? <p className="text-sm text-slate-500">No scans yet.</p> : audits.map((a: any) => <p key={a.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="font-medium">{a.url}</span><span className="text-slate-500">{a.summary.total} findings · {a.created_at}</span></p>)}</div>
              </Card>
            </section>
          )}
        </main>
        <footer className="mx-auto max-w-6xl px-6 pb-8 text-xs leading-relaxed text-slate-400">Accessibility Platform · Self-hosted widget CDN · Installing this widget does not make a website compliant or certified. It provides presentation, keyboard, reading and language controls. Host-site fixes and manual evaluation remain necessary.</footer>
      </div>
    </div>
  );
}
