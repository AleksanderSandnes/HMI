import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { SolarHeroCard } from "../components/dashboard/SolarHeroCard";
import { WeatherSummaryCard } from "../components/dashboard/WeatherSummaryCard";
import type { DashboardModel } from "../lib/useDashboardData";

function renderRoot(element: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree.root;
}

function texts(root: TestRenderer.ReactTestInstance): string[] {
  return root
    .findAll((n) => String(n.type) === "Text")
    .map((n) =>
      React.Children.toArray(n.props.children)
        .filter((c): c is string => typeof c === "string")
        .join(""),
    )
    .filter((s) => s.length > 0);
}

const model = {
  currentPower: 5810,
  peak: { value: 11100, label: "13:00", unit: "W" },
  utilisation: 48,
  capacityKw: 12,
  todayGen: 68.5,
  sparkline: [0, 1200, 5810, 11100, 4000],
  obs: { winddir: 202, uv: 5, humidity: 65 },
  m: { windSpeed: 7, windGust: 13, temp: 19, precipRate: 0, pressure: 1014 },
  wkAvg: { uv: 6, humidity: 76, pressure: 1013 },
} as unknown as DashboardModel;

describe("SolarHeroCard", () => {
  it("renders the current kW answer, peak badge and capacity subline", () => {
    const t = texts(renderRoot(<SolarHeroCard model={model} />));
    expect(t).toEqual(expect.arrayContaining(["5.81", "kW", "Producing now"]));
    expect(t.some((s) => s.includes("Peak 11.1 kW"))).toBe(true);
    expect(t.some((s) => s.includes("48% of 12 kW capacity"))).toBe(true);
  });
});

describe("WeatherSummaryCard", () => {
  it("renders the temp/precip and UV/humidity/pressure metrics", () => {
    const t = texts(renderRoot(<WeatherSummaryCard model={model} />));
    expect(t).toEqual(
      expect.arrayContaining([
        "Temperature",
        "Precipitation",
        "UV index",
        "Humidity",
        "Pressure",
        "19",
        "65",
        "1014",
      ]),
    );
  });
});
