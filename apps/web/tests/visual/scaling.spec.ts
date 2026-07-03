import { test, expect } from "@playwright/test";

/**
 * Guards the fluid root scale (the html font-size clamp in globals.css):
 * 16px up to 1920px-wide viewports, growing linearly to 20.8px (1.3x) at 3840.
 * Also asserts the landing hero tracks the root size, so a regression to px
 * sizing (which would freeze text on large displays) fails fast.
 *
 * Authenticated pages have no seeded session, so their large-display checks are
 * manual: `npm run web`, log in, DevTools responsive mode at 1920x1080 /
 * 2560x1440 / 3840x2160, light + dark — no horizontal scrollbar, nav aligns
 * with content, dashboard fills the viewport height, chart axis labels
 * unclipped, settings list/detail proportions balanced.
 */
const EXPECTED_ROOT_PX: Record<string, number> = {
  mobile: 16,
  tablet: 16,
  desktop: 16,
  wide: 16,
  fhd: 16,
  qhd: 17.6,
  uhd: 20.8,
};

// Landing h1 is text-[2.625rem] md:text-[4.25rem]; every project here is >=768px wide.
const HERO_REM = 4.25;

test("root font-size follows the fluid scale", async ({ page }, testInfo) => {
  const expected = EXPECTED_ROOT_PX[testInfo.project.name];
  test.skip(expected === undefined, "no expectation for this project");
  await page.goto("/");
  const rootPx = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  expect(rootPx).toBeCloseTo(expected, 1);
});

test("landing hero scales with the root font-size", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "hero uses the smaller sub-md size on mobile");
  await page.goto("/");
  const { rootPx, heroPx } = await page.evaluate(() => ({
    rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
    heroPx: parseFloat(getComputedStyle(document.querySelector("h1")!).fontSize),
  }));
  expect(heroPx / rootPx).toBeCloseTo(HERO_REM, 1);
});
