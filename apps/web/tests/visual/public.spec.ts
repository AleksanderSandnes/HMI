import { test, expect } from "@playwright/test";

/**
 * Visual regression for the public (unauthenticated) pages across breakpoints.
 * First run records baselines into tests/visual/public.spec.ts-snapshots/.
 *
 * To compare against the previous (Expo-web) UI, capture references from the live
 * build (https://hmi-seven.vercel.app) and diff manually; authenticated dashboard
 * snapshots require a seeded test session and are added once that fixture exists.
 */
const PAGES = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
];

for (const { name, path } of PAGES) {
  test(`${name} matches snapshot`, async ({ page }) => {
    await page.goto(path);
    // Let fonts/gradients settle; the landing video is masked out below.
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [page.locator("video")],
      animations: "disabled",
    });
  });
}
