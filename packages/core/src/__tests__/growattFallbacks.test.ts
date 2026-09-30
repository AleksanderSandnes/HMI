import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoreApiContext } from "../api/context";
import { createGrowattApi } from "../api/growatt";

function fixture() {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const api = createGrowattApi({
    env: { javaApiBaseUrl: "https://growatt.example.test" },
    getAccessToken: vi.fn().mockResolvedValue("fixture-token"),
  } as unknown as CoreApiContext);
  return { api, fetchMock };
}

function response(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Growatt response fallback", () => {
  it.each([response({}, false), response({ result: 0 }), response({ result: 1, obj: {} })])(
    "returns no-data when an aggregated response is unavailable or incomplete",
    async (chart) => {
      const { api, fetchMock } = fixture();
      fetchMock.mockResolvedValueOnce(chart).mockResolvedValueOnce(response({}, false));
      const data = await api.fetchSolarData("weekly", "2026-09-30");
      expect(data.chartData.labels).toEqual(["No Data"]);
    },
  );

  it("returns no-data when the hourly endpoint rejects the request", async () => {
    const { api, fetchMock } = fixture();
    fetchMock.mockResolvedValue(response({}, false));
    const data = await api.fetchSolarData("hourly", "2026-09-30");
    expect(data.chartData.datasets[0].data).toEqual([0]);
  });

  it("routes lifetime data to totalChart and uses cumulative generation", async () => {
    const { api, fetchMock } = fixture();
    fetchMock
      .mockResolvedValueOnce(response({ result: 1, obj: { energy: [10, 20] } }))
      .mockResolvedValueOnce(
        response({
          result: 1,
          obj: {
            totalPower: 100,
            todayGeneration: 2,
            monthGeneration: 40,
            status: "1",
            nominalPower: "10000",
            deviceNum: "invalid",
          },
        }),
      );
    const data = await api.fetchSolarData("total", "2026-09-30");
    expect(fetchMock.mock.calls[0][0]).toBe("https://growatt.example.test/api/growatt/totalChart");
    expect(fetchMock.mock.calls[0][1].body).toBe('{"date":"2026"}');
    expect(data.metrics).toEqual({
      todayGeneration: 30,
      totalGeneration: 100,
      todayRevenue: 30,
      totalRevenue: 100,
    });
    expect(data.device).toMatchObject({ online: true, capacity: 10000, deviceCount: undefined });
    expect(data.chartData.datasets[0].color?.()).toBe("#3b82f6");
  });
});

describe("Growatt incomplete data and transport errors", () => {
  it("uses cumulative generation even when the hourly chart cannot be reached", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { api, fetchMock } = fixture();
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response({ result: 1, obj: { eToday: 5, eTotal: 100 } }));
    const data = await api.fetchSolarData("hourly", "2026-09-30");
    expect(data.metrics.todayGeneration).toBe(5);
    expect(data.metrics.totalGeneration).toBe(100);
    expect(data.chartData.labels).toEqual(["No Data"]);
  });

  it("keeps the chart usable when cumulative data is absent or rejected", async () => {
    const { api, fetchMock } = fixture();
    fetchMock
      .mockResolvedValueOnce(response({ result: 1, obj: { energy: [2, 3] } }))
      .mockResolvedValueOnce(response({}, false));
    const data = await api.fetchSolarData("weekly", "2026-09-30");
    expect(data.metrics.totalGeneration).toBe(5);
    expect(data.device).toBeUndefined();
  });

  it("returns a no-data chart after an aggregated transport failure", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { api, fetchMock } = fixture();
    fetchMock.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(response(null));
    const data = await api.fetchSolarData("weekly", "2026-09-30");
    expect(data.chartData.labels).toEqual(["No Data"]);
    expect(data.metrics.totalGeneration).toBe(0);
  });

  it.each([{ result: 0, obj: { pac: [100] } }, { result: 1 }, {}])(
    "does not invent power data from an unsuccessful or incomplete hourly result",
    async (body) => {
      const { api, fetchMock } = fixture();
      fetchMock
        .mockResolvedValueOnce(response(body))
        .mockResolvedValueOnce(response({ result: 0, obj: {} }));
      const data = await api.fetchSolarData("hourly", "2026-09-30");
      expect(data.chartData.datasets[0].data).toEqual([0]);
      expect(data.chartData.datasets[0].color?.()).toBe("#10b981");
      expect(data.metrics.totalGeneration).toBe(0);
    },
  );
});
