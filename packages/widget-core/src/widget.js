/* Accessibility Widget v1.0.0 — framework-free, Shadow-DOM isolated.
   Honest limits (see docs): this widget changes presentation, keyboard
   focus visibility, reading aids and widget language. It does NOT repair
   missing alt text, fix host contrast, or make a site compliant. Settings
   are applied through ONE removable <style> element + reversible attributes;
   host HTML is never rewritten, and settings are never sent to any server. */
(function () {
  if (window.__A11Y_WIDGET_LOADED__) return; window.__A11Y_WIDGET_LOADED__ = true;
  var payload = window.__A11Y_CONFIG__ || {};
  var cfg = Object.assign({ position: "bottom-right", buttonLabel: "Accessibility", buttonColor: "#0b3d91", buttonTextColor: "#ffffff", buttonSize: "medium", borderRadius: 14, offsetX: 20, offsetY: 20, tooltip: "Accessibility options", panelWidth: 340, defaultLanguage: "en", enabledLanguages: ["en", "hi", "mr"], enabledFeatures: ["fontSize", "contrast", "grayscale", "linkStyles", "spacing", "focusHighlight", "readableFont", "readingGuide", "readingMask", "reducedMotion", "highlightHeadings", "highlightInteractive"], enabledProfiles: ["low-vision", "color-vision", "reading", "motor", "reduced-motion", "keyboard", "dyslexia"], persistence: "local", showProfiles: true, showLanguageSelector: true }, payload.config || {});
  var siteId = payload.siteId || "unknown";
  var PROFILES = { "low-vision": { en: "Low vision", settings: { fontScale: 1.25, contrast: "high", focusHighlight: true, linkHighlight: true } }, "color-vision": { en: "Colour-vision differences", settings: { contrast: "high", colorDifferentiation: true, linkUnderline: true } }, "reading": { en: "Reading & cognitive support", settings: { lineHeight: 1.8, paragraphSpacing: true, readableFont: true, highlightHeadings: true } }, "motor": { en: "Motor accessibility", settings: { focusHighlight: true, highlightInteractive: true, reducedMotion: true } }, "reduced-motion": { en: "Reduced motion", settings: { reducedMotion: true } }, "keyboard": { en: "Keyboard navigation", settings: { focusHighlight: true, highlightInteractive: true } }, "dyslexia": { en: "Dyslexia-friendly reading", settings: { readableFont: true, lineHeight: 1.8, paragraphSpacing: true, spacing: true } } };
  // Dictionaries: en/hi/mr are complete for the panel. Other languages ship
  // their title + core actions and fall back to English for the rest — the
  // framework adds a language by adding one dictionary object, no engine change.
  var I18N = {
    en: { title: "Accessibility", open: "Open accessibility options", close: "Close accessibility options", reset: "Reset all settings", profiles: "Profiles", language: "Language", fontSize: "Text size", increase: "Increase text size", decrease: "Decrease text size", resetSize: "Reset text size", contrast: "Contrast", none: "Default", high: "High contrast", dark: "Dark theme", light: "Light theme", grayscale: "Grayscale", colorDiff: "Enhance colour differentiation", underline: "Underline links", highlightLinks: "Highlight links", spacing: "Improve text spacing", lineHeight: "Increase line height", paraSpacing: "Improve paragraph spacing", focus: "Highlight keyboard focus", readable: "Readable font", guide: "Reading guide", mask: "Reading mask", reducedMotion: "Reduce motion", headings: "Highlight headings", interactive: "Highlight interactive elements", applied: "Accessibility setting applied.", resetDone: "All accessibility settings reset." },
    hi: { title: "पहुँच-योग्यता", open: "पहुँच-योग्यता विकल्प खोलें", close: "पहुँच-योग्यता विकल्प बंद करें", reset: "सभी सेटिंग रीसेट करें", profiles: "प्रोफ़ाइल", language: "भाषा", fontSize: "पाठ का आकार", increase: "पाठ बड़ा करें", decrease: "पाठ छोटा करें", resetSize: "पाठ का आकार रीसेट करें", contrast: "कंट्रास्ट", none: "डिफ़ॉल्ट", high: "उच्च कंट्रास्ट", dark: "गहरा थीम", light: "हल्का थीम", grayscale: "ग्रेस्केल", colorDiff: "रंग भेद बढ़ाएँ", underline: "लिंक रेखांकित करें", highlightLinks: "लिंक हाइलाइट करें", spacing: "पाठ का अंतर सुधारें", lineHeight: "पंक्ति की ऊँचाई बढ़ाएँ", paraSpacing: "अनुच्छेद का अंतर सुधारें", focus: "कीबोर्ड फ़ोकस हाइलाइट करें", readable: "पठनीय फ़ॉन्ट", guide: "पठन मार्गदर्शक", mask: "पठन मास्क", reducedMotion: "गति कम करें", headings: "शीर्षक हाइलाइट करें", interactive: "इंटरैक्टिव तत्व हाइलाइट करें", applied: "पहुँच-योग्यता सेटिंग लागू हुई।", resetDone: "सभी पहुँच-योग्यता सेटिंग रीसेट हो गईं।" },
    mr: { title: "प्रवेशयोग्यता", open: "प्रवेशयोग्यता पर्याय उघडा", close: "प्रवेशयोग्यता पर्याय बंद करा", reset: "सर्व सेटिंग्ज रीसेट करा", profiles: "प्रोफाइल", language: "भाषा", fontSize: "मजकूर आकार", increase: "मजकूर मोठा करा", decrease: "मजकूर लहान करा", resetSize: "मजकूर आकार रीसेट करा", contrast: "कॉन्ट्रास्ट", none: "मूळ", high: "उच्च कॉन्ट्रास्ट", dark: "गडद थीम", light: "उजळ थीम", grayscale: "ग्रेस्केल", colorDiff: "रंग फरक वाढवा", underline: "दुवे अधोरेखित करा", highlightLinks: "दुवे हायलाइट करा", spacing: "मजकूर अंतर सुधारा", lineHeight: "ओळीची उंची वाढवा", paraSpacing: "परिच्छेद अंतर सुधारा", focus: "कीबोर्ड फोकस हायलाइट करा", readable: "वाचनीय फॉन्ट", guide: "वाचन मार्गदर्शक", mask: "वाचन मास्क", reducedMotion: "हालचाल कमी करा", headings: "मथळे हायलाइट करा", interactive: "परस्परसंवादी घटक हायलाइट करा", applied: "प्रवेशयोग्यता सेटिंग लागू झाली.", resetDone: "सर्व प्रवेशयोग्यता सेटिंग्ज रीसेट झाल्या." }
  };
  var LANG_META = { en: "English", hi: "हिन्दी", mr: "मराठी", bn: "বাংলা", gu: "ગુજરાતી", ta: "தமிழ்", te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം", pa: "ਪੰਜਾਬੀ", or: "ଓଡ଼ିଆ", as: "অসমীয়া", ur: "اردو" };
  function t(key) { var d = I18N[state.language] || {}; return d[key] || I18N.en[key] || key; }
  function has(f) { return (cfg.enabledFeatures || []).indexOf(f) !== -1; }
  var DEFAULT_SETTINGS = { fontScale: 1, contrast: "none", grayscale: false, colorDifferentiation: false, linkUnderline: false, linkHighlight: false, spacing: false, lineHeight: 1, paragraphSpacing: false, focusHighlight: false, readableFont: false, readingGuide: false, readingMask: false, reducedMotion: false, highlightHeadings: false, highlightInteractive: false, language: cfg.defaultLanguage || "en" };
  var state = Object.assign({}, DEFAULT_SETTINGS);
  var storeKey = "a11y-prefs:" + siteId;
  function storage() { try { return cfg.persistence === "local" ? localStorage : cfg.persistence === "session" ? sessionStorage : null; } catch (e) { return null; } }
  function loadPrefs() { var s = storage(); if (!s) return; try { var v = JSON.parse(s.getItem(storeKey) || "null"); if (v) state = Object.assign({}, DEFAULT_SETTINGS, v); } catch (e) {} }
  function savePrefs() { var s = storage(); if (!s) return; try { s.setItem(storeKey, JSON.stringify(state)); } catch (e) {} }
  loadPrefs();
  // ---- Apply settings: one <style> element, fully removable ----
  var styleEl = null, guideEl = null, maskTop = null, maskBottom = null;
  function css() {
    var s = state, rules = [];
    if (s.fontScale !== 1) rules.push("html{font-size:" + Math.round(s.fontScale * 100) + "% !important}");
    if (s.contrast === "high") rules.push("body,body :not(img):not(video):not(svg):not(canvas){background-color:#000 !important;color:#fff !important;border-color:#fff !important} a{color:#ff0 !important} button,input,select,textarea{background-color:#000 !important;color:#fff !important}");
    if (s.contrast === "dark") rules.push("body,body :not(img):not(video):not(svg):not(canvas){background-color:#121212 !important;color:#e8e8e8 !important} a{color:#8ab4f8 !important}");
    if (s.contrast === "light") rules.push("body,body :not(img):not(video):not(svg):not(canvas){background-color:#fff !important;color:#111 !important} a{color:#0b3d91 !important}");
    if (s.grayscale) rules.push("html{filter:grayscale(1) !important}");
    if (s.colorDifferentiation) rules.push("a{color:#005fcc !important;text-decoration:underline !important} a:visited{color:#6a1b9a !important}");
    if (s.linkUnderline) rules.push("a{text-decoration:underline !important}");
    if (s.linkHighlight) rules.push("a{background:#ffeb3b !important;color:#000 !important;padding:0 2px !important}");
    if (s.spacing) rules.push("body{letter-spacing:0.04em !important;word-spacing:0.12em !important}");
    if (s.lineHeight && s.lineHeight !== 1) rules.push("body{line-height:" + s.lineHeight + " !important}");
    if (s.paragraphSpacing) rules.push("p{margin-bottom:1.5em !important}");
    if (s.focusHighlight) rules.push(":focus{outline:3px solid #ff8c00 !important;outline-offset:2px !important} :focus-visible{outline:3px solid #ff8c00 !important;outline-offset:2px !important}");
    if (s.readableFont) rules.push("body{font-family:'Noto Sans',system-ui,-apple-system,'Segoe UI',sans-serif !important}");
    if (s.reducedMotion) rules.push("*,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;scroll-behavior:auto !important}");
    if (s.highlightHeadings) rules.push("h1,h2,h3,h4,h5,h6{background:#fff176 !important;color:#000 !important;outline:2px solid #f57f17 !important}");
    if (s.highlightInteractive) rules.push("a,button,input,select,textarea,[role='button']{outline:2px dashed #d32f2f !important;outline-offset:2px !important}");
    return rules.join("\n");
  }
  function apply() {
    if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = "a11y-widget-style"; styleEl.setAttribute("data-a11y", "true"); document.head.appendChild(styleEl); }
    styleEl.textContent = css();
    document.documentElement.setAttribute("data-a11y-contrast", state.contrast);
    if (state.readingGuide) ensureGuide(); else removeGuide();
    if (state.readingMask) ensureMask(); else removeMask();
    savePrefs();
  }
  function clearAll() { if (styleEl) { styleEl.remove(); styleEl = null; } document.documentElement.removeAttribute("data-a11y-contrast"); removeGuide(); removeMask(); }
  function ensureGuide() { if (guideEl) return; guideEl = document.createElement("div"); guideEl.id = "a11y-reading-guide"; guideEl.setAttribute("aria-hidden", "true"); Object.assign(guideEl.style, { position: "fixed", left: "0", right: "0", height: "34px", borderTop: "3px solid #0b3d91", borderBottom: "3px solid #0b3d91", background: "rgba(11,61,145,0.08)", pointerEvents: "none", zIndex: "2147483646", top: "40%" }); document.body.appendChild(guideEl); }
  function removeGuide() { if (guideEl) { guideEl.remove(); guideEl = null; } }
  function ensureMask() { if (maskTop) return; var mk = function () { var d = document.createElement("div"); d.setAttribute("aria-hidden", "true"); Object.assign(d.style, { position: "fixed", left: "0", right: "0", background: "rgba(0,0,0,0.72)", pointerEvents: "none", zIndex: "2147483646" }); document.body.appendChild(d); return d; }; maskTop = mk(); maskBottom = mk(); maskTop.style.top = "0"; maskTop.style.height = "38%"; maskBottom.style.bottom = "0"; maskBottom.style.height = "38%"; }
  function removeMask() { if (maskTop) { maskTop.remove(); maskBottom.remove(); maskTop = null; maskBottom = null; } }
  document.addEventListener("mousemove", function (e) {
    if (guideEl) guideEl.style.top = Math.max(0, e.clientY - 17) + "px";
    if (maskTop) { var band = 110; maskTop.style.height = Math.max(0, e.clientY - band / 2) + "px"; maskBottom.style.height = Math.max(0, window.innerHeight - e.clientY - band / 2) + "px"; }
  }, { passive: true });
  // ---- Shadow DOM panel ----
  var host = document.createElement("div"); host.id = "a11y-widget-host"; host.style.cssText = "position:fixed;z-index:2147483647;" + (cfg.position === "bottom-left" ? "left:" + cfg.offsetX + "px;" : "right:" + cfg.offsetX + "px;") + "bottom:" + cfg.offsetY + "px;";
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: "open" });
  var size = cfg.buttonSize === "small" ? 48 : cfg.buttonSize === "large" ? 64 : 56;
  var panelOpen = false, live = null, panelEl = null, btn = null;
  function shadowCSS() { return ":host{font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f172a;line-height:1.45} button,select{font:inherit;cursor:pointer} button:focus-visible,select:focus-visible{outline:3px solid #f59e0b;outline-offset:2px} .a11y-btn{width:" + size + "px;height:" + size + "px;border-radius:" + cfg.borderRadius + "px;background:linear-gradient(135deg," + cfg.buttonColor + ",#4338ca);color:" + cfg.buttonTextColor + ";border:3px solid #fff;box-shadow:0 12px 28px rgba(2,6,23,.35),0 0 0 1px rgba(2,6,23,.08);font-size:26px;display:flex;align-items:center;justify-content:center;transition:transform .15s ease,box-shadow .15s ease} .a11y-btn:hover{transform:scale(1.06);box-shadow:0 16px 32px rgba(2,6,23,.4),0 0 0 1px rgba(2,6,23,.08)} .a11y-btn:focus-visible{outline:3px solid #f59e0b;outline-offset:3px} .a11y-panel{position:fixed;" + (cfg.position === "bottom-left" ? "left:" + cfg.offsetX + "px;" : "right:" + cfg.offsetX + "px;") + "bottom:" + (cfg.offsetY + size + 12) + "px;width:" + cfg.panelWidth + "px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 24px 48px rgba(2,6,23,.28);padding:0;animation:a11y-in .18s ease} @keyframes a11y-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .a11y-panel h2{margin:0 0 8px;padding:20px 22px;background:linear-gradient(135deg,#0b3d91,#4f46e5);color:#fff;font-size:19px;font-weight:750;letter-spacing:-.01em;border-radius:20px 20px 0 0} .a11y-panel h3{margin:16px 20px 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b} .a11y-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 20px;border-top:1px solid #f1f5f9} .a11y-row label{font-size:14px;font-weight:500;color:#334155} .a11y-row select{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#fff;color:#0f172a;max-width:170px} .a11y-chip{border:1px solid #c7d2fe;background:#eef2ff;color:#312e81;border-radius:999px;padding:8px 13px;font-size:13px;font-weight:600;white-space:nowrap} .a11y-chip:hover{background:#e0e7ff} .a11y-chip[aria-pressed='true']{background:#1d4ed8;border-color:#1d4ed8;color:#fff} .a11y-panel > .a11y-chip{margin:4px 0 4px 20px} .a11y-action{display:block;width:calc(100% - 40px);margin:16px 20px 0;padding:12px;border-radius:12px;border:1px solid #e2e8f0;background:#0f172a;color:#fff;font-weight:700} .a11y-panel > .a11y-action:last-child{margin-bottom:20px;background:#f1f5f9;color:#0f172a} @media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}"; }
  function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; }
  function toggleRow(label, key, onChange) {
    var row = el("div", { class: "a11y-row" }); row.appendChild(el("label", {}, label));
    var b = el("button", { type: "button", "aria-pressed": String(!!state[key]) }, state[key] ? "On" : "Off");
    b.className = "a11y-chip"; b.addEventListener("click", function () { state[key] = !state[key]; b.setAttribute("aria-pressed", String(state[key])); b.textContent = state[key] ? "On" : "Off"; apply(); announce(t("applied")); if (onChange) onChange(); });
    row.appendChild(b); return row;
  }
  function renderPanel() {
    shadow.innerHTML = ""; var style = document.createElement("style"); style.textContent = shadowCSS(); shadow.appendChild(style);
    btn = el("button", { type: "button", class: "a11y-btn", "aria-label": t("open"), title: cfg.tooltip || t("open"), "aria-expanded": "false" }, "♿"); shadow.appendChild(btn);
    btn.addEventListener("click", function () { panelOpen ? closePanel() : openPanel(); });
    live = el("div", { "aria-live": "polite", style: "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" }); shadow.appendChild(live);
    if (!panelOpen) return;
    panelEl = el("div", { class: "a11y-panel", role: "dialog", "aria-label": t("title"), lang: state.language, dir: state.language === "ur" ? "rtl" : "ltr" });
    var h = el("h2", { id: "a11y-panel-title" }, t("title")); panelEl.appendChild(h);
    if (cfg.showLanguageSelector && cfg.enabledLanguages.length > 1) {
      var lr = el("div", { class: "a11y-row" }); lr.appendChild(el("label", { for: "a11y-lang" }, t("language")));
      var sel = el("select", { id: "a11y-lang" }); cfg.enabledLanguages.forEach(function (code) { var o = el("option", { value: code }, LANG_META[code] || code); if (code === state.language) o.selected = true; sel.appendChild(o); });
      sel.addEventListener("change", function () { state.language = sel.value; apply(); renderPanel(); announce(t("applied")); });
      lr.appendChild(sel); panelEl.appendChild(lr);
    }
    if (cfg.showProfiles) {
      panelEl.appendChild(el("h3", {}, t("profiles")));
      (cfg.enabledProfiles || []).forEach(function (id) { if (!PROFILES[id]) return; var b = el("button", { type: "button", class: "a11y-chip" }, PROFILES[id].en); b.addEventListener("click", function () { state = Object.assign({}, DEFAULT_SETTINGS, { language: state.language }, PROFILES[id].settings); apply(); renderPanel(); announce(t("applied")); }); panelEl.appendChild(b); panelEl.appendChild(document.createTextNode(" ")); });
    }
    if (has("fontSize")) {
      var fr = el("div", { class: "a11y-row" }); fr.appendChild(el("label", {}, t("fontSize") + " (" + Math.round(state.fontScale * 100) + "%)"));
      var box = el("div", {});
      var dec = el("button", { type: "button", class: "a11y-chip", "aria-label": t("decrease") }, "A−");
      var inc = el("button", { type: "button", class: "a11y-chip", "aria-label": t("increase") }, "A+");
      dec.addEventListener("click", function () { state.fontScale = Math.max(0.8, +(state.fontScale - 0.1).toFixed(2)); apply(); renderPanel(); });
      inc.addEventListener("click", function () { state.fontScale = Math.min(2, +(state.fontScale + 0.1).toFixed(2)); apply(); renderPanel(); });
      box.appendChild(dec); box.appendChild(inc); fr.appendChild(box); panelEl.appendChild(fr);
    }
    if (has("contrast")) {
      var cr = el("div", { class: "a11y-row" }); cr.appendChild(el("label", { for: "a11y-contrast" }, t("contrast")));
      var cs = el("select", { id: "a11y-contrast" }); [["none", t("none")], ["high", t("high")], ["dark", t("dark")], ["light", t("light")]].forEach(function (p) { var o = el("option", { value: p[0] }, p[1]); if (p[0] === state.contrast) o.selected = true; cs.appendChild(o); });
      cs.addEventListener("change", function () { state.contrast = cs.value; apply(); announce(t("applied")); }); cr.appendChild(cs); panelEl.appendChild(cr);
    }
    var toggles = [["grayscale", "grayscale"], ["colorDifferentiation", "colorDiff"], ["linkStyles", "linkUnderline", "underline"], ["linkStyles", "linkHighlight", "highlightLinks"], ["spacing", "spacing"], ["spacing", "lineHeightToggle", "lineHeight"], ["spacing", "paragraphSpacing", "paraSpacing"], ["focusHighlight", "focusHighlight", "focus"], ["readableFont", "readableFont", "readable"], ["readingGuide", "readingGuide", "guide"], ["readingMask", "readingMask", "mask"], ["reducedMotion", "reducedMotion", "reducedMotion"], ["highlightHeadings", "highlightHeadings", "headings"], ["highlightInteractive", "highlightInteractive", "interactive"]];
    toggles.forEach(function (row) { if (!has(row[0])) return; var key = row[1], labelKey = row[2] || row[1];
      if (key === "lineHeightToggle") { var r = el("div", { class: "a11y-row" }); r.appendChild(el("label", {}, t("lineHeight"))); var b = el("button", { type: "button", class: "a11y-chip", "aria-pressed": String(state.lineHeight > 1) }, state.lineHeight > 1 ? "On" : "Off"); b.addEventListener("click", function () { state.lineHeight = state.lineHeight > 1 ? 1 : 1.8; b.setAttribute("aria-pressed", String(state.lineHeight > 1)); b.textContent = state.lineHeight > 1 ? "On" : "Off"; apply(); announce(t("applied")); }); r.appendChild(b); panelEl.appendChild(r); return; }
      panelEl.appendChild(toggleRow(t(labelKey), key)); });
    var reset = el("button", { type: "button", class: "a11y-action" }, t("reset"));
    reset.addEventListener("click", function () { var lang = state.language; state = Object.assign({}, DEFAULT_SETTINGS, { language: lang }); clearAll(); var s = storage(); try { if (s) s.removeItem(storeKey); } catch (e) {} apply(); renderPanel(); announce(t("resetDone")); });
    panelEl.appendChild(reset);
    var close = el("button", { type: "button", class: "a11y-action", style: "margin-top:8px" }, t("close"));
    close.addEventListener("click", closePanel); panelEl.appendChild(close);
    shadow.appendChild(panelEl);
    var first = panelEl.querySelector("button,select"); if (first) first.focus();
    panelEl.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); closePanel(); return; }
      if (e.key !== "Tab") return; var focusables = Array.prototype.slice.call(panelEl.querySelectorAll("button,select")); if (!focusables.length) return;
      var idx = focusables.indexOf(shadow.activeElement); if (e.shiftKey && idx <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); } else if (!e.shiftKey && idx === focusables.length - 1) { e.preventDefault(); focusables[0].focus(); }
    });
  }
  function announce(msg) { if (live) live.textContent = msg; }
  function openPanel() { panelOpen = true; renderPanel(); if (btn) btn.setAttribute("aria-expanded", "true"); }
  function closePanel() { panelOpen = false; renderPanel(); if (btn) { btn.setAttribute("aria-expanded", "false"); btn.focus(); } }
  apply(); renderPanel();
  window.__A11Y__ = { version: "1.0.0", siteId: siteId, configSource: window.__A11Y_CONFIG_SOURCE__ || "unknown", getSettings: function () { return Object.assign({}, state); }, reset: function () { state = Object.assign({}, DEFAULT_SETTINGS); clearAll(); apply(); renderPanel(); } };
})();
