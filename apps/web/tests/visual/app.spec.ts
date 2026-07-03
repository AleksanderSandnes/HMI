import { expect, test } from "@playwright/test";

/**
 * Layout assertions for the authenticated pages across every viewport project.
 * Live solar/weather data makes pixel snapshots useless here, so these check
 * structure instead: no horizontal overflow, the right nav chrome per size,
 * the settings master-detail collapse, and the weather toolbar stacking.
 *
 * Needs the auth fixture from tests/setup/auth.setup.ts (E2E_EMAIL/E2E_PASSWORD
 * in .env.local); the whole file skips when the fixture is absent.
 */
const AUTH = "playwright/.auth/user.json";
// Gate on the same env vars the setup project uses: when they're set, the
// setup dependency has run and written AUTH before these tests execute.
// (Checking fs.existsSync here would race collection vs. the setup project.)
const HAS_CREDS = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;

test.skip(!HAS_CREDS, "no auth fixture (set E2E_* in apps/web/.env.development.local)");
test.use({ storageState: HAS_CREDS ? AUTH : undefined });

const PAGES = ["/dashboard", "/solar", "/weather", "/settings"];

async function horizontalOverflow(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.scrollingElement;
    return el ? el.scrollWidth - document.documentElement.clientWidth : 0;
  });
}

for (const path of PAGES) {
  test(`${path} has no horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    // :visible — the dashboard renders two h1s (hero brand + desktop header)
    // and only one is shown per breakpoint.
    await page.locator("h1:visible").first().waitFor();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
}

test("nav chrome matches the viewport", async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await page.locator("h1:visible").first().waitFor();
  const topBar = page.locator("header");
  const bottomBar = page.locator("nav.fixed");
  if (testInfo.project.name === "mobile") {
    await expect(bottomBar).toBeVisible();
    await expect(topBar).toBeHidden();
  } else {
    await expect(topBar).toBeVisible();
    await expect(bottomBar).toBeHidden();
  }
});

test("settings master-detail collapses on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only behavior");
  await page.goto("/settings");
  const growattRow = page.getByRole("button", { name: /Growatt/ });
  await expect(growattRow).toBeVisible();

  await growattRow.click();
  await expect(page).toHaveURL(/\?section=growatt/);
  await expect(growattRow).toBeHidden();
  const back = page.getByRole("button", { name: "Settings" });
  await expect(back).toBeVisible();

  await back.click();
  await expect(page).not.toHaveURL(/section=/);
  await expect(growattRow).toBeVisible();
});

test("settings shows list and panel side by side on desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop behavior");
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /Growatt/ })).toBeVisible();
  // Profile panel renders by default alongside the list.
  await expect(page.getByRole("button", { name: "Save profile" })).toBeVisible();
});

test("dashboard hero renders below lg with a working bell overlay", async ({ page }, testInfo) => {
  test.skip(!["mobile", "tablet"].includes(testInfo.project.name), "hero renders below lg only");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "HMI", exact: true })).toBeVisible();

  const bell = page.getByRole("button", { name: "Notifications" });
  await expect(bell).toBeVisible();
  await bell.click();
  const overlay = page.getByRole("dialog", { name: "Notifications" });
  await expect(overlay).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
});

test("dashboard hero sections stack vertically below lg", async ({ page }, testInfo) => {
  test.skip(!["mobile", "tablet"].includes(testInfo.project.name), "hero renders below lg only");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "HMI", exact: true })).toBeVisible();
  // Retry: card heights shift while queries stream in.
  await expect(async () => {
    const solar = await page.getByTestId("hero-solar-col").boundingBox();
    const weather = await page.getByTestId("hero-weather-col").boundingBox();
    expect(solar && weather).toBeTruthy();
    expect(weather!.y).toBeGreaterThan(solar!.y + solar!.height - 1);
  }).toPass({ timeout: 10_000 });
});

test("weather toolbar stacks on mobile and stays inline on desktop", async ({ page }, testInfo) => {
  test.skip(!["mobile", "desktop"].includes(testInfo.project.name), "representative sizes only");
  await page.goto("/weather");
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  const chips = page.getByRole("button", { name: "Temp", exact: true });
  const segmented = page.getByRole("button", { name: "Weekly" });
  const chipBox = await chips.boundingBox();
  const segBox = await segmented.boundingBox();
  expect(chipBox && segBox).toBeTruthy();
  const sameRow = Math.abs(chipBox!.y - segBox!.y) < chipBox!.height;
  expect(sameRow).toBe(testInfo.project.name === "desktop");
});
