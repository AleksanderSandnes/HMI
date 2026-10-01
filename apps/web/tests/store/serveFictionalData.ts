import type { Page, Route } from "@playwright/test";

import {
  DEMO_DEVICE,
  DEMO_TOTALS,
  WEEK_DAYS,
  currentConditions,
  dailyEnergy,
  dayPowerSamples,
  hourlyObservations,
  monthlyEnergy,
} from "./fixtures";

function json(route: Route, body: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function requestDate(route: Route): string {
  const body = route.request().postDataJSON() as { date?: string } | null;
  return body?.date ?? "";
}

/** Answers every Growatt-backend and weather call with fictional fixtures. */
export async function serveFictionalData(page: Page): Promise<void> {
  await page.route("**/api/growatt/dayChart", (route) =>
    json(route, { result: 1, obj: { pac: dayPowerSamples() } }),
  );
  await page.route("**/api/growatt/weekChart", (route) =>
    json(route, { result: 1, obj: { energy: dailyEnergy(7), days: WEEK_DAYS } }),
  );
  await page.route("**/api/growatt/monthChart", (route) =>
    json(route, { result: 1, obj: { energy: dailyEnergy(30, 3) } }),
  );
  await page.route("**/api/growatt/yearChart", (route) =>
    json(route, { result: 1, obj: { energy: monthlyEnergy() } }),
  );
  await page.route("**/api/growatt/totalChart", (route) =>
    json(route, { result: 1, obj: { energy: [4_120, 6_380, 6_910, 7_230, 3_890] } }),
  );
  await page.route("**/api/growatt/totalData", (route) =>
    json(route, { result: 1, obj: { ...DEMO_DEVICE, ...DEMO_TOTALS } }),
  );
  await page.route("**/api/growatt/health", (route) => json(route, { status: "UP" }));
  await page.route("**/functions/v1/weather-history", (route) =>
    json(route, { observations: hourlyObservations(requestDate(route)) }),
  );
  await page.route("**/functions/v1/weather-current", (route) =>
    json(route, currentConditions(new Date())),
  );
}
