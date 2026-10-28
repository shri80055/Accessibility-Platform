# Testing on Your Own PC (Windows / Mac / Linux)

No database, no cloud account, no paid service is needed. The demo uses a
local file database that the server creates on first run.

## 1. Get the code

Download the zip from the chat and unzip it anywhere, e.g.
`accessibility-platform/`. (The zip already contains the built dashboard,
so you do **not** need to run `npm install` just to try it.)

## 2. Install Node.js 20 or newer

From https://nodejs.org (LTS). Check it in a terminal / command prompt:

```bash
node --version   # should print v20.x or newer
```

## 3. Start the server

```bash
cd accessibility-platform
node apps/api/src/server.js
```

Leave that terminal running. You should see:
`Accessibility Platform on http://127.0.0.1:3000`.

## 4. Wire up the demo site (one command, new terminal)

```bash
cd accessibility-platform
node scripts/setup-local-demo.mjs
```

It logs in as the seeded admin, creates (or reuses) a "Demo Portal" site,
publishes its config, points the demo's script tag at it, and prints the
install snippet + an install-test result.

## 5. Test in your browser

- Dashboard: http://localhost:3000/ — sign in with
  `admin@accessibility.local` / `Admin123!` (dev only — change it before any
  real deployment).
- Demo site: http://localhost:3000/demo/ — you should see the floating
  accessibility button. Click it, try A+ (text size), contrast, and the
  language selector.
- Live-update proof: in the dashboard Studio, change the button colour or
  position, press **Save & Publish**, reload the demo page — the widget
  changes with **no edit to the demo site**.

## 6. Run the automated checks (optional)

```bash
npm test                                   # 9 unit + integration tests
node tests/e2e/install-check.mjs http://localhost:3000
```

## Troubleshooting on a local PC

| Problem | Fix |
|---|---|
| `node` not recognised | Node.js is not installed, or the terminal was opened before installing it — open a new terminal after install. |
| Port 3000 already in use | Stop the other program, or start with `PORT=3001 node apps/api/src/server.js` and use http://localhost:3001/ everywhere (set `PUBLIC_BASE_URL=http://localhost:3001` too). On Windows PowerShell: `$env:PORT=3001; node apps/api/src/server.js`. |
| Dashboard shows "build not present" | You are running from a source checkout without the build — run `cd apps/dashboard && npm install && npm run build`, then restart the server. (Not needed with the chat zip, which includes the build.) |
| Demo shows no button | Run step 4 again, then hard-reload the demo (Ctrl+Shift+R). Check the browser console — the loader logs the exact reason (disabled site, unpublished config, or wrong site ID). |
| Login fails | On a fresh copy the admin is seeded on first server start. If you changed `ADMIN_PASSWORD` in `.env` after the first start, the old password still applies — delete the `data/` folder to re-seed, or keep the original password. |
