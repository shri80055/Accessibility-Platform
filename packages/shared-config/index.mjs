// Shared, framework-free configuration truth: defaults, profiles, validation.
// Used by the API (server) and the widget (browser). No DOM, no Node APIs,
// so it is unit-testable in plain node:test.
export const WIDGET_VERSION = "1.0.0";
export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "mr", label: "मराठी", dir: "ltr" },
  { code: "bn", label: "বাংলা", dir: "ltr" },
  { code: "gu", label: "ગુજરાતી", dir: "ltr" },
  { code: "ta", label: "தமிழ்", dir: "ltr" },
  { code: "te", label: "తెలుగు", dir: "ltr" },
  { code: "kn", label: "ಕನ್ನಡ", dir: "ltr" },
  { code: "ml", label: "മലയാളം", dir: "ltr" },
  { code: "pa", label: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "or", label: "ଓଡ଼ିଆ", dir: "ltr" },
  { code: "as", label: "অসমীয়া", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
];
export const DEFAULT_CONFIG = {
  position: "bottom-right",
  buttonLabel: "Accessibility",
  buttonColor: "#0b3d91",
  buttonTextColor: "#ffffff",
  buttonSize: "medium",
  borderRadius: 14,
  offsetX: 20,
  offsetY: 20,
  tooltip: "Accessibility options",
  panelWidth: 340,
  defaultLanguage: "en",
  enabledLanguages: ["en", "hi", "mr"],
  enabledFeatures: [
    "fontSize", "contrast", "grayscale", "linkStyles", "spacing",
    "focusHighlight", "readableFont", "readingGuide", "readingMask",
    "reducedMotion", "highlightHeadings", "highlightInteractive",
  ],
  enabledProfiles: ["low-vision", "color-vision", "reading", "motor", "reduced-motion", "keyboard", "dyslexia"],
  persistence: "local",
  showProfiles: true,
  showLanguageSelector: true,
};
export const PROFILES = {
  "low-vision": { label: "Low vision", settings: { fontScale: 1.25, contrast: "high", focusHighlight: true, linkHighlight: true } },
  "color-vision": { label: "Colour-vision differences", settings: { contrast: "high", colorDifferentiation: true, linkUnderline: true } },
  "reading": { label: "Reading & cognitive support", settings: { lineHeight: 1.8, paragraphSpacing: true, readableFont: true, highlightHeadings: true } },
  "motor": { label: "Motor accessibility", settings: { focusHighlight: true, highlightInteractive: true, reducedMotion: true } },
  "reduced-motion": { label: "Reduced motion", settings: { reducedMotion: true } },
  "keyboard": { label: "Keyboard navigation", settings: { focusHighlight: true, highlightInteractive: true } },
  "dyslexia": { label: "Dyslexia-friendly reading", settings: { readableFont: true, lineHeight: 1.8, paragraphSpacing: true, spacing: true } },
};
export const FEATURES = [
  "fontSize", "contrast", "grayscale", "colorDifferentiation", "linkStyles",
  "spacing", "focusHighlight", "readableFont", "readingGuide", "readingMask",
  "reducedMotion", "highlightHeadings", "highlightInteractive",
];
export function sanitizeConfig(input = {}) {
  const c = { ...DEFAULT_CONFIG, ...input };
  if (!["bottom-right", "bottom-left"].includes(c.position)) c.position = "bottom-right";
  if (!["small", "medium", "large"].includes(c.buttonSize)) c.buttonSize = "medium";
  c.borderRadius = Math.min(28, Math.max(0, Number(c.borderRadius) || 14));
  c.offsetX = Math.min(80, Math.max(0, Number(c.offsetX) || 20));
  c.offsetY = Math.min(80, Math.max(0, Number(c.offsetY) || 20));
  c.panelWidth = Math.min(420, Math.max(280, Number(c.panelWidth) || 340));
  if (!LANGUAGES.some((l) => l.code === c.defaultLanguage)) c.defaultLanguage = "en";
  c.enabledLanguages = (Array.isArray(c.enabledLanguages) ? c.enabledLanguages : ["en"])
    .filter((x) => LANGUAGES.some((l) => l.code === x));
  if (!c.enabledLanguages.includes(c.defaultLanguage)) c.enabledLanguages.unshift(c.defaultLanguage);
  c.enabledFeatures = (Array.isArray(c.enabledFeatures) ? c.enabledFeatures : []).filter((x) => FEATURES.includes(x));
  c.enabledProfiles = (Array.isArray(c.enabledProfiles) ? c.enabledProfiles : []).filter((x) => x in PROFILES);
  if (!["local", "session", "none"].includes(c.persistence)) c.persistence = "local";
  return c;
}
export function profileSettings(id) { return PROFILES[id] ? { ...PROFILES[id].settings } : {}; }
export function validateHostname(h) {
  return typeof h === "string" && /^[a-z0-9.-]+(:[0-9]{1,5})?$/.test(h.trim().toLowerCase()) && h.length <= 253;
}
