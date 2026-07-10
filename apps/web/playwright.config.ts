import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Load apps/web/.env* — dev mode so the gitignored .env.development.local
// (E2E_* secrets) is included.
loadEnvConfig(__dirname, true);

// The E2E test account lives in the hosted Supabase project, while .env.local
// points local dev at the local stack. When E2E_SUPABASE_* are set, only the
// Playwright-managed server builds against the hosted project — `npm run dev`
// is unaffected.
const e2eSupabaseEnv: Record<string, string> =
  process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_ANON_KEY
    ? {
        NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY,
      }
    : {};

/**
 * Playwright config for HMI web.
 * - e2e specs: functional flows (tests/e2e).
 * - visual specs: responsive screenshot regression (tests/visual) at the
 *   breakpoints the plan calls for — mobile 390, tablet 834, desktop 1440, wide 1680 —
 *   plus the large-display targets fhd 1920, qhd 2560, uhd 3840 (fluid root scale).
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
    // Logs in once (when E2E creds are set) and saves storageState for app.spec.ts.
    { name: "setup", testMatch: /tests\/setup\/.*\.setup\.ts/, use: { browserName: "chromium" } },
    ...[
      { name: "mobile", viewport: { width: 390, height: 844 }, device: "Pixel 7" },
      { name: "tablet", viewport: { width: 834, height: 1112 } },
      { name: "desktop", viewport: { width: 1440, height: 900 } },
      { name: "wide", viewport: { width: 1680, height: 1050 } },
      { name: "fhd", viewport: { width: 1920, height: 1080 } },
      { name: "qhd", viewport: { width: 2560, height: 1440 } },
      { name: "uhd", viewport: { width: 3840, height: 2160 } },
    ].map(({ name, viewport, device }) => ({
      name,
      dependencies: ["setup"],
      use: device
        ? { ...devices[device], viewport }
        : { browserName: "chromium" as const, viewport },
    })),
  ],
  webServer: {
    command: "pnpm run build && npx next start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...(process.env as Record<string, string>), ...e2eSupabaseEnv },
  },
});
