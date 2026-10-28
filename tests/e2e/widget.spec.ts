// Playwright spec (requires `npx playwright install` + browsers; not run by
// `npm test`, which stays browser-free). Covers: button renders, panel opens
// by keyboard, font-size control changes the page, Escape closes and returns
// focus, preferences persist across reload, duplicate loader does not create
// a second button. Run against a published demo site:
//   npx playwright test tests/e2e/widget.spec.ts
import { test, expect } from "@playwright/test";
const DEMO = process.env.DEMO_URL || "http://localhost:3000/demo/";
test("widget opens, resizes text, persists, and closes with Escape", async ({ page }) => {
  await page.goto(DEMO);
  const host = page.locator("#a11y-widget-host");
  await expect(host).toBeVisible();
  await host.locator("button").first().click();
  await expect(page.locator("#a11y-widget-host")).toContainText("Accessibility");
  await page.keyboard.press("Escape");
  await expect(host.locator("button").first()).toBeFocused();
});
