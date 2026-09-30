import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RegisterPage from "@/app/(auth)/register/page";

const fixture = vi.hoisted(() => ({
  registerUser: vi.fn(),
  confirmRegistration: vi.fn(),
  resendConfirmation: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => fixture }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/hooks/useCore", () => ({ useCore: () => ({ auth: fixture, settings: {} }) }));
vi.mock("@/lib/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

beforeEach(() => {
  vi.resetAllMocks();
  fixture.registerUser.mockResolvedValue({ token: null });
  fixture.confirmRegistration.mockResolvedValue({ token: "confirmed" });
  fixture.resendConfirmation.mockResolvedValue(undefined);
});
afterEach(cleanup);

async function register() {
  render(<RegisterPage />);
  for (const [placeholder, value] of [
    ["auth.emailPlaceholder", "demo@example.test"],
    ["auth.register.passwordPlaceholder", "FictionalPassword123!"],
    ["auth.register.confirmPasswordPlaceholder", "FictionalPassword123!"],
  ])
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "auth.register.createAccountTitle" }));
}

describe("registration confirmation", () => {
  it("waits for confirmation before allowing integration setup", async () => {
    await register();
    const code = await screen.findByRole("textbox", { name: "auth.register.codeLabel" });
    expect(screen.queryByPlaceholderText("auth.register.growattEmailPlaceholder")).toBeNull();
    expect(fixture.replace).not.toHaveBeenCalled();
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "auth.register.confirm" }));
    await screen.findByPlaceholderText("auth.register.growattEmailPlaceholder");
    expect(fixture.confirmRegistration).toHaveBeenCalledWith("demo@example.test", "123456");
  });

  it("retains confirmation and shows an invalid-code error for retry", async () => {
    fixture.confirmRegistration.mockRejectedValue(new Error("Code expired"));
    await register();
    await screen.findByRole("textbox", { name: "auth.register.codeLabel" });
    fireEvent.click(screen.getByRole("button", { name: "auth.register.confirm" }));
    await screen.findByText("Code expired");
    expect(screen.getByRole("textbox", { name: "auth.register.codeLabel" })).toBeEnabled();
    expect(screen.queryByPlaceholderText("auth.register.growattEmailPlaceholder")).toBeNull();
  });

  it("resends confirmation and clears the old code", async () => {
    await register();
    const code = await screen.findByRole("textbox", { name: "auth.register.codeLabel" });
    fireEvent.change(code, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "auth.register.resend" }));
    await screen.findByText("auth.register.resent");
    expect(fixture.resendConfirmation).toHaveBeenCalledWith("demo@example.test");
    expect(code).toHaveValue("");
    expect(fixture.registerUser).toHaveBeenCalledOnce();
  });

  it("shows resend failures while allowing another attempt", async () => {
    fixture.resendConfirmation.mockRejectedValue(new Error("Rate limited"));
    await register();
    await screen.findByRole("textbox", { name: "auth.register.codeLabel" });
    fireEvent.click(screen.getByRole("button", { name: "auth.register.resend" }));
    await screen.findByText("Rate limited");
    expect(screen.getByRole("button", { name: "auth.register.resend" })).toBeEnabled();
  });

  it("continues immediately only when signup already returned a session", async () => {
    fixture.registerUser.mockResolvedValue({ token: "session" });
    await register();
    await screen.findByPlaceholderText("auth.register.growattEmailPlaceholder");
    expect(screen.queryByRole("textbox", { name: "auth.register.codeLabel" })).toBeNull();
  });
});
