import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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
  fixture.account.getUserProfile.mockResolvedValue({
    id: "profile-1",
    username: "Emma Nordmann",
    email: "demo@example.com",
    avatarUrl: null,
  });
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

describe("settings profile form", () => {
  it("seeds the form from the profile once the query resolves after mount", async () => {
    mount();
    expect(await screen.findByDisplayValue("Emma Nordmann")).toBeInTheDocument();
    expect(screen.getByDisplayValue("demo@example.com")).toBeInTheDocument();
  });
});
