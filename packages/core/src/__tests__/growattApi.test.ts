import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoreApiContext } from "../api/context";
import { createGrowattApi } from "../api/growatt";

const BASE = "https://growatt.test";

function makeApi(token: string | null = "tok-123") {
  const ctx = {
    env: { javaApiBaseUrl: BASE },
    getAccessToken: vi.fn().mockResolvedValue(token),
  } as unknown as CoreApiContext;
  return createGrowattApi(ctx);
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createGrowattApi", () => {
  it("fetches hourly data from dayChart + totalData with the bearer token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ result: 1, obj: { pac: [0, 500, 900] } }))
      .mockResolvedValueOnce(jsonResponse({ result: 1, obj: { eToday: 4.2, eTotal: 100 } }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await makeApi().fetchSolarData("hourly", "2026-03-01");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [dayUrl, dayInit] = fetchMock.mock.calls[0];
    expect(dayUrl).toBe(`${BASE}/api/growatt/dayChart`);
    expect(dayInit.headers.Authorization).toBe("Bearer tok-123");
    expect(dayInit.body).toBe(JSON.stringify({ date: "2026-03-01" }));
    expect(fetchMock.mock.calls[1][0]).toBe(`${BASE}/api/growatt/totalData`);
    expect(data.metrics.todayGeneration).toBe(4.2);
    expect(data.chartData.datasets[0].data.length).toBeGreaterThan(0);
  });

  it("omits the Authorization header without a token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ result: 1, obj: { pac: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    await makeApi(null).fetchSolarData("hourly", "2026-03-01");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("routes weekly requests to weekChart with the full date", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ result: 1, obj: { energy: [1, 2, 3], days: ["Mon", "Tue", "Wed"] } }),
      )
      .mockResolvedValueOnce(jsonResponse({ result: 1, obj: { eTotal: 50 } }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await makeApi().fetchSolarData("weekly", "2026-03-01");
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/api/growatt/weekChart`);
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ date: "2026-03-01" }));
    expect(data.chartData.datasets[0].data).toEqual([1, 2, 3]);
  });

  it("truncates the request date for monthly (yyyy-MM) and yearly (yyyy)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ result: 1, obj: { energy: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    const api = makeApi();

    await api.fetchSolarData("monthly", "2026-03-01");
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ date: "2026-03" }));
    await api.fetchSolarData("yearly", "2026-03-01");
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ date: "2026" }));
  });

  it("survives network failure with an empty chart instead of throwing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const data = await makeApi().fetchSolarData("weekly", "2026-03-01");
    expect(data.chartData.labels).toEqual(["No Data"]);
    expect(data.chartData.datasets[0].data).toEqual([0]);
  });

  it("reports health from the health endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));
    await expect(makeApi().checkApiHealth()).resolves.toBe(true);

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(makeApi().checkApiHealth()).resolves.toBe(false);
  });
});
