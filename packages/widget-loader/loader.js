/* Accessibility Widget Loader v1 — tiny, async, non-blocking.
   Usage: <script src="https://<host>/widget/v1/loader.js" data-site-id="site_..." defer></script>
   It fetches ONLY the published public config for this site, then loads the
   versioned widget bundle. The public site ID is not a secret. No credentials
   are ever embedded here. If the config service is unavailable, the loader
   falls back to a previously cached config, or to safe defaults — and it
   never blocks the host page. */
(function () {
  if (window.__A11Y_LOADER_LOADED__) return; window.__A11Y_LOADER_LOADED__ = true;
  var script = document.currentScript;
  var siteId = script && script.getAttribute("data-site-id");
  if (!siteId) { console.warn("[a11y] Missing data-site-id on the widget script tag. See the installation guide."); return; }
  var apiBase = (script && script.getAttribute("data-api-base")) || script.src.replace(/\/widget\/.*$/, "");
  var version = (script && script.getAttribute("data-version")) || "v1";
  var bundlePath = version === "1.0.0" ? "/widget/v1.0.0/widget.js" : "/widget/v1/widget.js";
  function loadWidget(config, source) {
    window.__A11Y_CONFIG__ = config; window.__A11Y_CONFIG_SOURCE__ = source;
    var s = document.createElement("script"); s.src = apiBase + bundlePath; s.defer = true;
    s.onerror = function () { console.warn("[a11y] Widget bundle failed to load. Check network/CSP (see installation guide)."); };
    document.head.appendChild(s);
  }
  function report(kind, message) {
    try { fetch(apiBase + "/api/public/diagnostics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteId: siteId, kind: kind, message: String(message).slice(0, 300) }), keepalive: true }); } catch (e) {}
  }
  fetch(apiBase + "/api/public/config?siteId=" + encodeURIComponent(siteId), { headers: { Accept: "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error("config_http_" + r.status); return r.json(); })
    .then(function (data) {
      try { localStorage.setItem("a11y-config-cache:" + siteId, JSON.stringify(data)); } catch (e) {}
      loadWidget(data, "live");
    })
    .catch(function (err) {
      // Authorisation / not-published: do NOT render a button that promises
      // features that are not configured. Tell the admin, not the visitor.
      if (/config_http_(403|404)/.test(String(err && err.message))) {
        console.warn("[a11y] Widget not loaded for this site: the site is disabled, the hostname is not allowlisted, or no configuration is published yet. Fix it in the Accessibility Platform dashboard, then reload.");
        report("config_unavailable", err.message); return;
      }
      var cached = null; try { cached = JSON.parse(localStorage.getItem("a11y-config-cache:" + siteId) || "null"); } catch (e) {}
      if (cached && cached.config) { console.warn("[a11y] Config service unreachable — using last cached configuration."); loadWidget(cached, "cache"); }
      else { console.warn("[a11y] Config service unreachable — loading with safe defaults."); loadWidget({ siteId: siteId, config: {} }, "defaults"); }
      report("config_fetch_failed", err && err.message);
    });
})();
