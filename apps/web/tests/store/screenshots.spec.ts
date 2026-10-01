import path from "node:path";

import { expect, test, type Page, type Route } from "@playwright/test";

import {
  DEMO_DEVICE,
  DEMO_TOTALS,
  WEEK_DAYS,
  currentConditions,
  dailyEnergy,
  dayPowerSamples,
  hourlyObservations,
  monthlyEnergy,
} from "./fixtures";

/**
 * Regenerates store screenshots from a logged-in session that only ever sees fictional
 * data: the account comes from supabase/seed_demo.sql on a disposable local stack and every
 * solar/weather request is answered from ./fixtures. Run via `npm run store:screenshots`
 * (see store/README.md); never point this at production.
 */

const DEMO_EMAIL = process.env.STORE_DEMO_EMAIL ?? "demo@example.com";
const DEMO_PASSWORD = process.env.STORE_DEMO_PASSWORD ?? "store-demo-local-only";
const OUTPUT_ROOT = path.resolve(__dirname, "../../../../store/screenshots");

const SHOTS = [
  { name: "01-dashboard", path: "/dashboard" },
  { name: "02-solar", path: "/solar" },
  { name: "03-weather", path: "/weather" },
  { name: "04-settings", path: "/settings" },
];

const LOCALES = ["en", "nb"] as const;

// Same readiness probe as tests/visual/app.spec.ts: tablets have no visible dashboard h1.
const READY = 'h1:visible, [data-testid="hero-solar-col"]:visible';

function json(route: Route, body: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function requestDate(route: Route): string {
  const body = route.request().postDataJSON() as { date?: string } | null;
  return body?.date ?? "";
}

/** Answers every Growatt-backend and weather call with fictional fixtures. */
async function serveFictionalData(page: Page): Promise<void> {
  await page.route("**/api/growatt/dayChart", (route) =>
    json(route, { result: 1, obj: { pac: dayPowerSamples() } }),
  );
  await page.route("**/api/growatt/weekChart", (route) =>
    json(route, { result: 1, obj: { energy: dailyEnergy(7), days: WEEK_DAYS } }),
  );
  await page.route("**/api/growatt/monthChart", (route) =>
    json(route, { result: 1, obj: { energy: dailyEnergy(30, 3) } }),
  );
  await page.route("**/api/growatt/yearChart", (route) =>
    json(route, { result: 1, obj: { energy: monthlyEnergy() } }),
  );
  await page.route("**/api/growatt/totalChart", (route) =>
    json(route, { result: 1, obj: { energy: [4_120, 6_380, 6_910, 7_230, 3_890] } }),
  );
  await page.route("**/api/growatt/totalData", (route) =>
    json(route, { result: 1, obj: { ...DEMO_DEVICE, ...DEMO_TOTALS } }),
  );
  await page.route("**/api/growatt/health", (route) => json(route, { status: "UP" }));
  await page.route("**/functions/v1/weather-history", (route) =>
    json(route, { observations: hourlyObservations(requestDate(route)) }),
  );
  await page.route("**/functions/v1/weather-current", (route) =>
    json(route, currentConditions(new Date())),
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator('input[autocomplete="email"]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}

/** Charts draw in with CSS/Web Animations; capture only once every one has finished. */
async function animationsSettled(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
}

/** The settings detail form fills after its profile query; phones show only the list. */
async function profileFormReady(page: Page): Promise<void> {
  const email = page.locator('main input[inputmode="email"]').first();
  if (await email.isVisible()) await expect(email).toHaveValue(DEMO_EMAIL);
}

for (const locale of LOCALES) {
  test(`store screenshots (${locale})`, async ({ page, context }, testInfo) => {
    const base = new URL(testInfo.project.use.baseURL ?? "http://localhost:3210");
    await context.addCookies([
      { name: "hmi.locale", value: locale, domain: base.hostname, path: "/" },
    ]);
    await serveFictionalData(page);
    await signIn(page);

    for (const shot of SHOTS) {
      await page.goto(shot.path);
      await page.locator(READY).first().waitFor();
      await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 30_000 });
      if (shot.path === "/settings") await profileFormReady(page);
      await animationsSettled(page);
      await expect(page.locator("body")).not.toContainText("NaN");
      await page.screenshot({
        path: path.join(OUTPUT_ROOT, testInfo.project.name, locale, `${shot.name}.png`),
        animations: "disabled",
      });
    }
  });
}
