import { describe, expect, it } from "vitest";

import { safeLoginRedirect } from "@/lib/auth-redirect";

describe("login redirect boundary", () => {
  it.each([
    null,
    "",
    "dashboard",
    "javascript:alert(document.cookie)",
    "https://example.com/dashboard",
    "//example.com/dashboard",
    "/\\example.com/dashboard",
    "/dashboard\n//example.com",
    "/dashboard\r",
    "/dashboard\t",
    "/dashboard\u007f",
    "/..//example.com",
    "/%2e%2e//example.com",
  ])("falls back for unsafe input %j", (candidate) => {
    expect(safeLoginRedirect(candidate)).toBe("/dashboard");
  });

  it.each(["/dashboard", "/solar?period=week#production", "/weather", "/settings/profile"])(
    "retains an app path %s",
    (candidate) => {
      expect(safeLoginRedirect(candidate)).toBe(candidate);
    },
  );
});
