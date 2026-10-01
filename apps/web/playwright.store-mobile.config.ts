import { defineConfig } from "@playwright/test";

/**
 * Store screenshots of the Expo app's react-native-web export (tests/store-mobile).
 *
 * Expects `apps/mobile/dist` exported against a disposable Supabase stack seeded with
 * supabase/seed_demo.sql — see .github/workflows/store-screenshots.yml. Viewport x scale
 * produce the pixel sizes Google Play accepts.
 */
export default defineConfig({
  testDir: "./tests/store-mobile",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 180_000,
  use: {
    baseURL: "http://localhost:8090",
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
  ],
  webServer: {
    command: "npx expo serve --port 8090",
    cwd: "../mobile",
    url: "http://localhost:8090",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
