import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AppNav } from "@/components/AppNav";
import { HeroDashboard } from "@/components/dashboard/HeroDashboard";
import { TileDashboard } from "@/components/dashboard/TileDashboard";
import { WeatherSummaryCard } from "@/components/dashboard/WeatherSummaryCard";
import type { DashboardModel } from "@/lib/hooks/useDashboardData";
import { NavStatsProvider, useNavStats } from "@/lib/nav-stats";

const fixture = vi.hoisted(() => ({
  pathname: "/dashboard",
  core: {
    weather: { getCurrentWeatherData: vi.fn() },
    account: { getUserProfile: vi.fn() },
  },
  notifications: {
    items: [] as unknown[],
    count: 0,
    clearAll: vi.fn(),
    dismiss: vi.fn(),
    isLoading: false,
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => fixture.pathname }));
vi.mock("@/lib/hooks/useCore", () => ({ useCore: () => fixture.core }));
vi.mock("@/lib/hooks/useNotifications", () => ({ useNotifications: () => fixture.notifications }));

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  fixture.pathname = "/dashboard";
  fixture.core.weather.getCurrentWeatherData.mockResolvedValue({
    observations: [{ metric: { temp: 12.4 }, neighborhood: "Testville" }],
  });
  fixture.core.account.getUserProfile.mockResolvedValue({ username: "Demo User", avatarUrl: null });
  fixture.notifications.items = [];
  fixture.notifications.count = 0;
  fixture.notifications.clearAll.mockReset().mockResolvedValue(undefined);
  fixture.notifications.dismiss.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  client.clear();
});

function wrap(ui: React.ReactElement) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const model = (over: Record<string, unknown> = {}): DashboardModel =>
  ({
    device: { plantName: "Roof", model: "MIN 5000", online: true },
    capacityKw: 5,
    todayGen: 12.3,
    weekGen: 80,
    lifetime: 12345,
    currentPower: 3200,
    peak: { value: 4100 },
    utilisation: 64,
    sparkline: [0, 2, 3],
    solarLoading: false,
    wxLoading: false,
    obs: {
      winddir: 45,
      humidity: 70,
      uv: 3,
      solarRadiation: 250,
      obsTimeLocal: "2026-09-30 12:30:00",
    },
    m: {
      temp: 11,
      windSpeed: 8,
      windGust: 14,
      pressure: 1008,
      precipRate: 0.2,
      precipTotal: 1.4,
      windChill: 9,
    },
    feelsLike: 10,
    wkAvg: { temp: 10, humidity: 65, pressure: 1010, solar: 200, uv: 2 },
    ...over,
  }) as unknown as DashboardModel;

describe("TileDashboard", () => {
  it("renders the solar and weather sections with the online badge", () => {
    render(<TileDashboard model={model()} />);
    expect(screen.getByText("MIN 5000", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("12:30:00", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("kWh").length).toBeGreaterThan(0);
  });

  it("handles an offline, data-less model", () => {
    render(
      <TileDashboard
        model={model({
          device: { online: false },
          capacityKw: null,
          utilisation: null,
          peak: null,
          obs: null,
        })}
      />,
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("omits the status badge when online state is unknown", () => {
    render(<TileDashboard model={model({ device: null })} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});

describe("WeatherSummaryCard", () => {
  it("renders all metric groups", () => {
    render(<WeatherSummaryCard model={model()} />);
    expect(screen.getByText("hPa")).toBeInTheDocument();
    expect(screen.getByText("mm/h")).toBeInTheDocument();
  });

  it("copes with missing observations", () => {
    render(<WeatherSummaryCard model={model({ obs: null })} />);
    expect(screen.getByText(/Direction n\/a/)).toBeInTheDocument();
  });
});

describe("HeroDashboard", () => {
  it("shows the profile initials, notification badge and opens the overlay", async () => {
    fixture.notifications.count = 2;
    fixture.notifications.items = [
      { id: "n1", level: "info", title: "Hello", message: "", createdAt: new Date().toISOString() },
    ];
    wrap(<HeroDashboard model={model()} />);
    await waitFor(() => expect(screen.getByText("DU")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(fixture.notifications.clearAll).toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /dismiss/i })[0]);
    expect(fixture.notifications.dismiss).toHaveBeenCalledWith("n1");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders without observations or device", () => {
    wrap(<HeroDashboard model={model({ obs: null, device: null, capacityKw: null })} />);
    expect(screen.getByTestId("hero-solar-col")).toBeInTheDocument();
    expect(screen.getByTestId("hero-weather-col")).toBeInTheDocument();
  });
});

function PublishStats() {
  const { setSolarStats } = useNavStats();
  return (
    <button
      onClick={() =>
        setSolarStats({ generation: "9.1", genUnit: "kWh", peak: "4.2", peakUnit: "kW" })
      }
    >
      publish
    </button>
  );
}

describe("AppNav", () => {
  it("shows the weather chip and highlights the active link", async () => {
    wrap(
      <NavStatsProvider>
        <AppNav />
      </NavStatsProvider>,
    );
    await waitFor(() => expect(screen.getByText("12° · Testville")).toBeInTheDocument());
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(5);
  });

  it("falls back to a dash and the default place", async () => {
    fixture.core.weather.getCurrentWeatherData.mockResolvedValue({ observations: [] });
    wrap(
      <NavStatsProvider>
        <AppNav />
      </NavStatsProvider>,
    );
    await waitFor(() => expect(fixture.core.weather.getCurrentWeatherData).toHaveBeenCalled());
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows only the temperature when a reading has no neighbourhood", async () => {
    fixture.core.weather.getCurrentWeatherData.mockResolvedValue({
      observations: [{ metric: { temp: 3 } }],
    });
    wrap(
      <NavStatsProvider>
        <AppNav />
      </NavStatsProvider>,
    );
    await waitFor(() => expect(screen.getByText("3°")).toBeInTheDocument());
  });

  it("shows solar stats published by a page", async () => {
    fixture.pathname = "/solar";
    wrap(
      <NavStatsProvider>
        <PublishStats />
        <AppNav />
      </NavStatsProvider>,
    );
    fireEvent.click(screen.getByText("publish"));
    expect(await screen.findByText("9.1")).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();
  });
});
