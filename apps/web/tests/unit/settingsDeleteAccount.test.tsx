import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/(app)/settings/page";

const fixture = vi.hoisted(() => ({
  router: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
  account: { getUserProfile: vi.fn(), deleteAccount: vi.fn() },
  settings: { getApiSettings: vi.fn(), subscribeSettings: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => fixture.router,
  useSearchParams: () => new URLSearchParams("section=delete"),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light", setTheme: vi.fn() }) }));
vi.mock("@/lib/hooks/useCore", () => ({
  useCore: () => ({
    account: fixture.account,
    settings: fixture.settings,
    auth: { logout: vi.fn() },
  }),
}));

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  fixture.account.getUserProfile.mockResolvedValue({
    username: "Demo",
    email: "demo@example.test",
  });
  fixture.settings.getApiSettings.mockResolvedValue(null);
  fixture.settings.subscribeSettings.mockReturnValue(vi.fn());
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});

function mount() {
  render(
    <QueryClientProvider client={client}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

function panelButton(name: string) {
  const buttons = screen.getAllByRole("button", { name });
  return buttons[buttons.length - 1];
}

describe("settings account deletion", () => {
  it("requires a second confirmation and can be cancelled without deleting", () => {
    mount();
    fireEvent.click(panelButton("Delete account"));
    expect(screen.getByText("Delete your account?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete your account?")).toBeNull();
    expect(fixture.account.deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes the account, clears cached data and returns to login", async () => {
    fixture.account.deleteAccount.mockResolvedValue(undefined);
    mount();
    fireEvent.click(panelButton("Delete account"));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    await waitFor(() => expect(fixture.router.replace).toHaveBeenCalledWith("/login"));
    expect(fixture.account.deleteAccount).toHaveBeenCalledOnce();
    expect(fixture.router.refresh).toHaveBeenCalledOnce();
  });

  it("shows the failure and stays on the page when deletion fails", async () => {
    fixture.account.deleteAccount.mockRejectedValue(null);
    mount();
    fireEvent.click(panelButton("Delete account"));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    await screen.findByText("Could not delete your account. Please try again.");
    expect(fixture.router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeTruthy();
  });

  it("links to the public legal pages", () => {
    mount();
    expect(screen.getByRole("link", { name: "Privacy policy" }).getAttribute("href")).toBe(
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms of service" }).getAttribute("href")).toBe(
      "/terms",
    );
    expect(screen.getByRole("link", { name: "Support" }).getAttribute("href")).toBe("/support");
  });
});
