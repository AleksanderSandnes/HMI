import { describe, expect, it } from "vitest";

import type { SolarData } from "../types";
import {
  dashboardWeekAverages,
  solarDevice,
  solarMetrics,
  weatherNow,
  type CurrentWeather,
} from "../utils/dashboard";

const makeSolar = (over: Partial<SolarData> = {}): SolarData => ({
  chartData: {
    labels: ["06:00", "12:00", "18:00"],
    datasets: [{ data: [100, 900, 300], color: () => "#fff", strokeWidth: 2 }],
  },
  metrics: { todayGeneration: 5, totalGeneration: 1200, todayRevenue: 0, totalRevenue: 0 },
  ...over,
});

describe("solarMetrics", () => {
  it("derives peak + today/week/lifetime generation", () => {
    const week = makeSolar({
      metrics: { todayGeneration: 30, totalGeneration: 0, todayRevenue: 0, totalRevenue: 0 },
    });
    const m = solarMetrics(makeSolar(), week);
    expect(m.peak).toEqual({ value: 900, label: "12:00", unit: "W" });
    expect(m.todayGen).toBe(5);
    expect(m.weekGen).toBe(30);
    expect(m.lifetime).toBe(1200);
  });

  it("returns nulls when data is missing", () => {
    expect(solarMetrics(undefined, undefined)).toEqual({
      peak: null,
      todayGen: null,
      weekGen: null,
      lifetime: null,
    });
  });
});

describe("solarDevice", () => {
  it("derives capacity (kW) and utilisation (%)", () => {
    const solar = makeSolar({ device: { capacity: 12000, plantName: "Roof" } });
    const d = solarDevice(solar, 6000);
    expect(d.capacityKw).toBe(12);
    expect(d.utilisation).toBe(50);
    expect(d.device?.plantName).toBe("Roof");
  });

  it("omits utilisation when there is no current power", () => {
    const d = solarDevice(makeSolar({ device: { capacity: 12000 } }), 0);
    expect(d.utilisation).toBeNull();
  });

  it("handles a missing device", () => {
    expect(solarDevice(undefined, 5000)).toEqual({
      device: undefined,
      capacityKw: null,
      utilisation: null,
    });
  });
});

describe("weatherNow", () => {
  it("picks the first observation, its metric block, and a feels-like fallback", () => {
    const wx: CurrentWeather = {
      observations: [{ humidity: 60, metric: { heatIndex: 28, temp: 25 } }],
    };
    const r = weatherNow(wx);
    expect(r.obs?.humidity).toBe(60);
    expect(r.m.temp).toBe(25);
    expect(r.feelsLike).toBe(28);
  });

  it("falls back heatIndex → windChill → temp", () => {
    expect(weatherNow({ observations: [{ metric: { windChill: 2, temp: 5 } }] }).feelsLike).toBe(2);
    expect(weatherNow({ observations: [{ metric: { temp: 5 } }] }).feelsLike).toBe(5);
  });

  it("returns an empty metric block for no data", () => {
    const r = weatherNow(undefined);
    expect(r.obs).toBeUndefined();
    expect(r.m).toEqual({});
    expect(r.feelsLike).toBeUndefined();
  });
});

describe("dashboardWeekAverages", () => {
  const obs = [
    { obsTimeLocal: "2026-06-10 12:00:00", metric: { tempAvg: 10 }, humidityAvg: 50 },
    { obsTimeLocal: "2026-06-11 12:00:00", metric: { tempAvg: 20 }, humidityAvg: 70 },
  ];

  it("averages each metric across the week's series", () => {
    const a = dashboardWeekAverages({ observations: obs });
    expect(a.temp).toBeCloseTo(15, 5);
    expect(a.humidity).toBeCloseTo(60, 5);
  });

  it("returns nulls when there are no observations", () => {
    expect(dashboardWeekAverages(undefined)).toEqual({
      temp: null,
      humidity: null,
      pressure: null,
      solar: null,
      uv: null,
    });
  });
});
