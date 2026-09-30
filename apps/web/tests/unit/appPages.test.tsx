import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NotificationsPage from "@/app/(app)/notifications/page";
import SolarPage from "@/app/(app)/solar/page";
import WeatherPage from "@/app/(app)/weather/page";
import { NavStatsProvider } from "@/lib/nav-stats";

const fixture = vi.hoisted(() => ({
  growatt: { fetchSolarData: vi.fn() },
  weather: { getHourlyWeatherData: vi.fn(), getWeeklyHourlyWeatherData: vi.fn() },
  notifications: {
    items: [] as unknown[],
    isLoading: false,
    dismiss: vi.fn(),
    clearAll: vi.fn(),
  },
  width: 1280,
}));

vi.mock("@/lib/hooks/useCore", () => ({
  useCore: () => ({ growatt: fixture.growatt, weather: fixture.weather }),
}));
vi.mock("@/lib/hooks/useNotifications", () => ({ useNotifications: () => fixture.notifications }));
vi.mock("@/lib/hooks/useViewportWidth", () => ({ useViewportWidth: () => fixture.width }));
// Charts are covered in charts.test.tsx; keep the page tests about page logic.
vi.mock("@/components/charts/SolarChart", () => ({
  SolarChart: ({ timespan, loading }: { timespan: string; loading: boolean }) => (
    <div data-testid="solar-chart">{`${timespan}:${loading ? "loading" : "ready"}`}</div>
  ),
}));
vi.mock("@/components/charts/WeatherChart", () => ({
  WeatherChart: ({ band, loading }: { band?: unknown; loading: boolean }) => (
    <div data-testid="wx-chart">{`${band ? "band" : "series"}:${loading ? "loading" : "ready"}`}</div>
  ),
}));

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  fixture.width = 1280;
  fixture.notifications.items = [];
  fixture.notifications.isLoading = false;
  fixture.notifications.dismiss.mockReset().mockResolvedValue(undefined);
  fixture.notifications.clearAll.mockReset().mockResolvedValue(undefined);
  fixture.growatt.fetchSolarData.mockReset().mockResolvedValue({
    metrics: { todayGeneration: 12.34, totalGeneration: 100, todayRevenue: 1, totalRevenue: 2 },
    chartData: { labels: ["a", "b", "c"], datasets: [{ data: [0, 500, 200] }] },
  });
  fixture.weather.getHourlyWeatherData.mockReset().mockResolvedValue({
    observations: [{ metric: { temp: 5 }, obsTimeLocal: "2026-09-30 10:00:00" }],
  });
  fixture.weather.getWeeklyHourlyWeatherData.mockReset().mockResolvedValue({ observations: [] });
});
afterEach(() => {
  cleanup();
  client.clear();
});

const wrap = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={client}>
      <NavStatsProvider>{ui}</NavStatsProvider>
    </QueryClientProvider>,
  );

describe("NotificationsPage", () => {
  const item = (id: string, level: string) => ({
    id,
    level,
    title: `Title ${id}`,
    message: id === "a" ? "Body text" : "",
    createdAt: new Date().toISOString(),
  });

  it("shows a loading card", () => {
    fixture.notifications.isLoading = true;
    render(<NotificationsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows the empty state without a clear button", () => {
    render(<NotificationsPage />);
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("lists notifications of every level and dismisses / clears them", () => {
    fixture.notifications.items = [
      item("a", "success"),
      item("b", "error"),
      item("c", "warning"),
      item("d", "info"),
      item("e", "weird"),
    ];
    render(<NotificationsPage />);
    expect(screen.getByText("Title a")).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /dismiss/i })[1]);
    expect(fixture.notifications.dismiss).toHaveBeenCalledWith("b");
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(fixture.notifications.clearAll).toHaveBeenCalled();
  });
});

describe("SolarPage", () => {
  it("loads hourly data, then refetches when the timespan changes", async () => {
    wrap(<SolarPage />);
    await waitFor(() =>
      expect(screen.getByTestId("solar-chart")).toHaveTextContent("hourly:ready"),
    );
    expect(fixture.growatt.fetchSolarData).toHaveBeenCalledWith("hourly", expect.any(String));
    const tabs = screen.getAllByRole("button");
    const weekly = tabs.find((b) => /week/i.test(b.textContent ?? ""));
    expect(weekly).toBeDefined();
    fireEvent.click(weekly!);
    await waitFor(() =>
      expect(fixture.growatt.fetchSolarData).toHaveBeenCalledWith("weekly", expect.any(String)),
    );
  });

  it("copes with an empty chart series", async () => {
    fixture.growatt.fetchSolarData.mockResolvedValue({
      metrics: { todayGeneration: 0, totalGeneration: 0, todayRevenue: 0, totalRevenue: 0 },
      chartData: { labels: [], datasets: [{ data: [] }] },
    });
    wrap(<SolarPage />);
    await waitFor(() =>
      expect(screen.getByTestId("solar-chart")).toHaveTextContent("hourly:ready"),
    );
  });
});

describe("WeatherPage", () => {
  it("renders the series chart on desktop and switches metric", async () => {
    wrap(<WeatherPage />);
    await waitFor(() => expect(screen.getByTestId("wx-chart")).toHaveTextContent("series:ready"));
    expect(fixture.weather.getHourlyWeatherData).toHaveBeenCalled();
    const chips = screen
      .getAllByRole("button")
      .filter((b) => /wind|humid/i.test(b.textContent ?? ""));
    expect(chips.length).toBeGreaterThan(0);
    fireEvent.click(chips[0]);
    await waitFor(() => expect(screen.getByTestId("wx-chart")).toBeInTheDocument());
  });

  it("uses the weekly endpoint and daily bands on phones", async () => {
    fixture.width = 400;
    wrap(<WeatherPage />);
    const weekly = screen.getAllByRole("button").find((b) => /week/i.test(b.textContent ?? ""));
    expect(weekly).toBeDefined();
    fireEvent.click(weekly!);
    await waitFor(() => expect(fixture.weather.getWeeklyHourlyWeatherData).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("wx-chart")).toHaveTextContent("band"));
  });
});
