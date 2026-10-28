# Demo site

A plain HTML site. Its **only** widget integration is the script tag in
`<head>` (see `index.html`). To run the live-update proof:

1. Start the API: `node apps/api/src/server.js`
2. Dashboard → Websites → create a site (e.g. "Demo Portal", domain `localhost`)
   → Save draft → Publish. Copy its public site ID.
3. Put that ID in the script tag's `data-site-id` (this one-time install step
   is the *only* edit ever made to this site for the widget).
4. Open `/demo/` and use the floating button.
5. In the dashboard Studio, change the button colour/position/language,
   Publish, reload `/demo/` — the widget changes with **no demo edit**.

In production the demo is deployed on its own host and the script `src` is
the CDN origin (e.g. `https://accessibility.example.gov.in/widget/v1/loader.js`).
