export function token() { return localStorage.getItem("a11y-token") || ""; }
export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(token() ? { Authorization: "Bearer " + token() } : {}), ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).message || (data as any).error || ("Request failed (" + res.status + ")"));
  return data;
}
export const LANGUAGES = [["en","English"],["hi","हिन्दी"],["mr","मराठी"],["bn","বাংলা"],["gu","ગુજરાતી"],["ta","தமிழ்"],["te","తెలుగు"],["kn","ಕನ್ನಡ"],["ml","മലയാളം"],["pa","ਪੰਜਾਬੀ"],["or","ଓଡ଼ିଆ"],["as","অসমীয়া"],["ur","اردو (RTL)"]];
export const FEATURES = ["fontSize","contrast","grayscale","colorDifferentiation","linkStyles","spacing","focusHighlight","readableFont","readingGuide","readingMask","reducedMotion","highlightHeadings","highlightInteractive"];
export const PROFILES = ["low-vision","color-vision","reading","motor","reduced-motion","keyboard","dyslexia"];
