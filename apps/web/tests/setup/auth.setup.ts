import { test as setup } from "@playwright/test";

/**
 * Logs in once via the UI and saves the session to playwright/.auth/user.json
 * (gitignored) so authenticated specs can reuse it via `test.use({ storageState })`.
 * Requires E2E_EMAIL/E2E_PASSWORD in apps/web/.env.local (loaded by
 * playwright.config.ts); skips cleanly when unset.
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  setup.skip(!email || !password, "E2E_EMAIL/E2E_PASSWORD not set in apps/web/.env.local");

  await page.goto("/login");
  await page.getByPlaceholder("you@domain.com").fill(email!);
  await page.getByPlaceholder("Enter your password").fill(password!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
