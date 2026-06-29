import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for HMI web.
 * - e2e specs: functional flows (tests/e2e).
 * - visual specs: responsive screenshot regression (tests/visual) at the
 *   breakpoints the plan calls for — mobile 390, tablet 834, desktop 1440, wide 1680.
 *
 * Browsers: if not installed locally run `npx playwright install chromium`.
 * In CI/cloud with a preinstalled browser set PLAYWRIGHT_BROWSERS_PATH.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: {
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "tablet", use: { browserName: "chromium", viewport: { width: 834, height: 1112 } } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "wide", use: { browserName: "chromium", viewport: { width: 1680, height: 1050 } } },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
