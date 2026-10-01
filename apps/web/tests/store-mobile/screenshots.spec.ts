import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { serveFictionalData } from "../store/serveFictionalData";

/**
 * Store screenshots of the Expo app (react-native-web export) from a session that only sees
 * fictional data: the account comes from supabase/seed_demo.sql on a disposable stack and
 * every solar/weather request is answered from ../store/fixtures. Run by
 * .github/workflows/store-screenshots.yml; never point this at production.
 */

const DEMO_EMAIL = process.env.STORE_DEMO_EMAIL ?? "demo@example.com";
const DEMO_PASSWORD = process.env.STORE_DEMO_PASSWORD ?? "store-demo-local-only";
const OUTPUT_ROOT = path.resolve(__dirname, "../../../../store/screenshots/mobile");

const SHOTS = [
  { name: "01-dashboard", path: "/" },
  { name: "02-solar", path: "/solar" },
  { name: "03-weather", path: "/weather" },
  { name: "04-settings", path: "/settings" },
];

const LOCALES = ["en", "nb"] as const;

async function settled(page: Page): Promise<void> {
  await expect(page.getByRole("progressbar")).toHaveCount(0, { timeout: 30_000 });
  // react-native-web animates mounts with JS timers; give the last frame time to land.
  await page.waitForTimeout(1_500);
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator('input[autocomplete="email"]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /Sign In|Logg inn/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 30_000 });
}

for (const locale of LOCALES) {
  test(`mobile store screenshots (${locale})`, async ({ page }, testInfo) => {
    await page.addInitScript((value) => {
      window.localStorage.setItem("pref.language", value);
    }, locale);
    await serveFictionalData(page);
    await signIn(page);

    for (const shot of SHOTS) {
      await page.goto(shot.path);
      await settled(page);
      await expect(page.locator("body")).not.toContainText("NaN");
      await page.screenshot({
        path: path.join(OUTPUT_ROOT, testInfo.project.name, locale, `${shot.name}.png`),
        animations: "disabled",
      });
    }
  });
}
