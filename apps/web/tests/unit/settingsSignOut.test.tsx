import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/(app)/settings/page";

const fixture = vi.hoisted(() => ({
  logout: vi.fn(),
  router: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
  account: { getUserProfile: vi.fn() },
  settings: { getApiSettings: vi.fn(), subscribeSettings: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => fixture.router,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light", setTheme: vi.fn() }) }));
vi.mock("@/lib/hooks/useCore", () => ({
  useCore: () => ({
    account: fixture.account,
    settings: fixture.settings,
    auth: { logout: fixture.logout },
  }),
}));

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  fixture.account.getUserProfile.mockResolvedValue({ username: "Demo", email: "demo@example.com" });
  fixture.settings.getApiSettings.mockResolvedValue(null);
  fixture.settings.subscribeSettings.mockReturnValue(vi.fn());
  fixture.logout.mockResolvedValue(undefined);
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

describe("settings sign-out", () => {
  it("navigates to login and refreshes after sign-out succeeds", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(fixture.router.replace).toHaveBeenCalledWith("/login"));
    expect(fixture.router.refresh).toHaveBeenCalledOnce();
  });

  it("shows a failure and retains the current screen instead of navigating", async () => {
    fixture.logout.mockRejectedValue(new Error("Sign-out unavailable"));
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText("Sign-out unavailable");
    expect(fixture.router.replace).not.toHaveBeenCalled();
    expect(fixture.router.refresh).not.toHaveBeenCalled();
  });

  it("shows the localized fallback for a non-Error rejection", async () => {
    fixture.logout.mockRejectedValue(null);
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText("Could not sign out. Please try again.");
    expect(fixture.router.replace).not.toHaveBeenCalled();
  });
});
