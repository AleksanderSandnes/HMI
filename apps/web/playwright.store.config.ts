import { defineConfig } from "@playwright/test";

/**
 * Store screenshot capture (tests/store) — kept out of playwright.config.ts so the
 * regular E2E/visual runs never depend on the local demo stack.
 *
 * Expects a local Supabase stack seeded with supabase/seed_demo.sql; the runner script
 * (scripts/capture-store-screenshots.mjs) provides the env below. Viewport x scale
 * produce the pixel sizes Google Play and the App Store accept.
 */
export default defineConfig({
  testDir: "./tests/store",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 120_000,
  // Reduced motion: charts render final frames instead of mid-draw-in animation.
  use: {
    baseURL: "http://localhost:3210",
    browserName: "chromium",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    // 1080 x 1920 — Play phone.
    {
      name: "phone",
      use: {
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    // 1200 x 1920 — Play 7-inch tablet.
    {
      name: "tablet-7",
      use: { viewport: { width: 600, height: 960 }, deviceScaleFactor: 2, hasTouch: true },
    },
    // 1600 x 2560 — Play 10-inch tablet.
    {
      name: "tablet-10",
      use: { viewport: { width: 800, height: 1280 }, deviceScaleFactor: 2, hasTouch: true },
    },
    // 2880 x 1800 — web / marketing desktop.
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: false,
    timeout: 300_000,
    env: process.env as Record<string, string>,
  },
});
