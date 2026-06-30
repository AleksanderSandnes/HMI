// Growatt solar API (Java service, Supabase-JWT authed). Ported from mobile
// src/services/growattApiService.ts. The Java service performs the Growatt login
// itself (Vault creds) and derives the plant id; the client only sends its
// Supabase token + the requested date.
import type { SolarData, SolarDeviceInfo, SolarTimespan } from "../types/solar";
import {
  buildAggregatedLabels,
  calculateMetrics,
  cleanPowerData,
  generateTimeLabels,
  optimizeChartData,
} from "../utils/growattApiHelpers";

import type { CoreApiContext } from "./context";

const ENDPOINTS = {
  login: "/api/growatt/login",
  dayChart: "/api/growatt/dayChart",
  weekChart: "/api/growatt/weekChart",
  monthChart: "/api/growatt/monthChart",
  yearChart: "/api/growatt/yearChart",
  totalChart: "/api/growatt/totalChart",
  totalData: "/api/growatt/totalData",
  health: "/api/growatt/health",
} as const;

interface TotalSnapshot {
  totalGeneration?: number;
  todayGeneration?: number;
  monthGeneration?: number;
  device?: SolarDeviceInfo;
}

export function createGrowattApi(ctx: CoreApiContext) {
  const baseUrl = ctx.env.javaApiBaseUrl;

  /** JSON headers carrying the live Supabase access token. */
  async function authHeaders(): Promise<Record<string, string>> {
    const token = await ctx.getAccessToken();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Fetch the cumulative "as of now" snapshot (totalData): lifetime/today/month generation
   * plus the device/plant status the v2 getDevicesByPlantList endpoint returns. Used by both
   * the hourly and aggregated paths. Returns an empty object on any failure.
   */
  async function fetchTotalSnapshot(date: string): Promise<TotalSnapshot> {
    try {
      const response = await fetch(`${baseUrl}${ENDPOINTS.totalData}`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ date }),
      });
      if (!response.ok) return {};
      const totalData = await response.json();
      if (totalData && totalData.result === 1 && totalData.obj) {
        const o = totalData.obj;
        const num = (v: unknown) => (v == null || isNaN(Number(v)) ? undefined : Number(v));
        const device: SolarDeviceInfo = {
          status: o.status ?? undefined,
          online: o.status != null ? o.status === "1" : undefined,
          model: o.deviceModel ?? undefined,
          plantName: o.plantName ?? undefined,
          lastUpdate: o.lastUpdateTime ?? undefined,
          capacity: num(o.nominalPower),
          deviceCount: num(o.deviceNum),
          onlineCount: num(o.onlineNum),
        };
        const hasDevice = Object.values(device).some((v) => v !== undefined);
        return {
          totalGeneration: o.eTotal || o.totalPower || o.totalGeneration || undefined,
          todayGeneration: o.eToday || o.todayGeneration || undefined,
          monthGeneration: o.eMonth || o.monthGeneration || undefined,
          device: hasDevice ? device : undefined,
        };
      }
    } catch (error) {
      console.warn("[GrowattAPI] Error fetching total snapshot:", error);
    }
    return {};
  }

  /** Assemble aggregated solar data for the week/month/year ranges. */
  async function fetchAggregatedSolarData(
    timespan: SolarTimespan,
    date: string,
  ): Promise<SolarData> {
    let endpoint: string;
    let requestDate: string;

    if (timespan === "weekly") {
      endpoint = ENDPOINTS.weekChart;
      requestDate = date; // yyyy-MM-dd (inclusive end of the 7-day window)
    } else if (timespan === "monthly") {
      endpoint = ENDPOINTS.monthChart;
      requestDate = date.slice(0, 7); // yyyy-MM
    } else if (timespan === "total") {
      endpoint = ENDPOINTS.totalChart;
      requestDate = date.slice(0, 4); // yyyy (most recent year of the 5-year window)
    } else {
      endpoint = ENDPOINTS.yearChart;
      requestDate = date.slice(0, 4); // yyyy
    }

    let energyValues: number[] = [];
    let dayLabels: string[] | undefined;

    try {
      const chartResponse = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ date: requestDate }),
      });
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        if (chartData.result === 1 && chartData.obj) {
          energyValues = cleanPowerData(chartData.obj.energy || []);
          dayLabels = chartData.obj.days; // only present on the weekly response
        }
      }
    } catch (error) {
      console.warn(`[GrowattAPI] ${timespan} chart request error:`, error);
    }

    const snapshot = await fetchTotalSnapshot(requestDate);
    const periodTotal = energyValues.reduce((sum, value) => sum + value, 0);
    const finalTotal = snapshot.totalGeneration ?? periodTotal;
    const hasData = energyValues.some((value) => value > 0);
    const labels = buildAggregatedLabels(timespan, energyValues.length, dayLabels);

    const chartData = hasData
      ? {
          labels,
          datasets: [{ data: energyValues, color: () => "#3b82f6", strokeWidth: 2 }],
        }
      : {
          labels: ["No Data"],
          datasets: [{ data: [0], color: () => "#3b82f6", strokeWidth: 2 }],
        };

    return {
      chartData,
      metrics: {
        todayGeneration: periodTotal,
        totalGeneration: finalTotal,
        todayRevenue: periodTotal,
        totalRevenue: finalTotal,
      },
      device: snapshot.device,
    };
  }

  /** Fetch solar data from the Growatt API for a timespan + date. */
  async function fetchSolarData(timespan: SolarTimespan, date: string): Promise<SolarData> {
    if (
      timespan === "weekly" ||
      timespan === "monthly" ||
      timespan === "yearly" ||
      timespan === "total"
    ) {
      return fetchAggregatedSolarData(timespan, date);
    }

    // Hourly view: 5-minute power samples (pac) + totals for metrics.
    let powerValues: number[] = [];
    try {
      const chartResponse = await fetch(`${baseUrl}${ENDPOINTS.dayChart}`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ date }),
      });
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        if (chartData.result === 1) {
          powerValues = chartData.obj?.pac || [];
        }
      }
    } catch (error) {
      console.warn("[GrowattAPI] Day chart request error:", error);
    }

    const snapshot = await fetchTotalSnapshot(date);

    const cleanPowerValues = cleanPowerData(powerValues);
    const labels = generateTimeLabels();
    const metrics = calculateMetrics(
      cleanPowerValues,
      timespan,
      1,
      snapshot.totalGeneration,
      snapshot.todayGeneration,
      snapshot.monthGeneration,
    );

    const optimizedChart = optimizeChartData(
      cleanPowerValues,
      labels.slice(0, cleanPowerValues.length),
      timespan,
    );

    return {
      chartData: {
        labels: optimizedChart.labels,
        datasets: [{ data: optimizedChart.data, color: () => "#10b981", strokeWidth: 2 }],
      },
      metrics,
      device: snapshot.device,
    };
  }

  /** Check Growatt API health. */
  async function checkApiHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${baseUrl}${ENDPOINTS.health}`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error("[GrowattAPI] Health check failed:", error);
      return false;
    }
  }

  return { fetchSolarData, checkApiHealth };
}

export type GrowattApi = ReturnType<typeof createGrowattApi>;
