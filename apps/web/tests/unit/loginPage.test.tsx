import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/(auth)/login/page";

const fixture = vi.hoisted(() => ({
  redirect: "",
  replace: vi.fn(),
  refresh: vi.fn(),
  loginUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: fixture.replace, refresh: fixture.refresh }),
  useSearchParams: () => new URLSearchParams({ redirectTo: fixture.redirect }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/hooks/useCore", () => ({ useCore: () => ({ auth: fixture }) }));
vi.mock("@/lib/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

beforeEach(() => {
  vi.resetAllMocks();
  fixture.loginUser.mockResolvedValue(undefined);
});
afterEach(cleanup);

async function submitLogin() {
  render(<LoginPage />);
  fireEvent.change(screen.getByPlaceholderText("auth.emailPlaceholder"), {
    target: { value: "demo@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("auth.passwordPlaceholder"), {
    target: { value: "FictionalPassword123!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "auth.login.signIn" }));
  await waitFor(() => expect(fixture.loginUser).toHaveBeenCalledOnce());
}

describe("login navigation", () => {
  it.each(["javascript:alert(1)", "https://example.com", "//example.com"])(
    "uses the dashboard after successful login with unsafe redirect %s",
    async (redirect) => {
      fixture.redirect = redirect;
      await submitLogin();
      await waitFor(() => expect(fixture.replace).toHaveBeenCalledWith("/dashboard"));
      expect(fixture.refresh).toHaveBeenCalledOnce();
    },
  );

  it("returns to the requested app path after login", async () => {
    fixture.redirect = "/solar?period=week#production";
    await submitLogin();
    await waitFor(() => expect(fixture.replace).toHaveBeenCalledWith(fixture.redirect));
  });

  it("does not navigate when authentication fails", async () => {
    fixture.redirect = "/settings";
    fixture.loginUser.mockRejectedValue(new Error("Login denied"));
    await submitLogin();
    await waitFor(() => expect(screen.getByText("Login denied")).toBeTruthy());
    expect(fixture.replace).not.toHaveBeenCalled();
    expect(fixture.refresh).not.toHaveBeenCalled();
  });
});
