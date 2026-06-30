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

type AuthHeaders = () => Promise<Record<string, string>>;

interface TotalSnapshot {
  totalGeneration?: number;
  todayGeneration?: number;
  monthGeneration?: number;
  device?: SolarDeviceInfo;
}

const num = (v: unknown): number | undefined =>
  v == null || isNaN(Number(v)) ? undefined : Number(v);

function parseDevice(o: any): SolarDeviceInfo {
  return {
    status: o.status ?? undefined,
    online: o.status != null ? o.status === "1" : undefined,
    model: o.deviceModel ?? undefined,
    plantName: o.plantName ?? undefined,
    lastUpdate: o.lastUpdateTime ?? undefined,
    capacity: num(o.nominalPower),
    deviceCount: num(o.deviceNum),
    onlineCount: num(o.onlineNum),
  };
}

/** Map the raw totalData `obj` into our snapshot + device shape. */
function parseSnapshot(o: any): TotalSnapshot {
  const device = parseDevice(o);
  const hasDevice = Object.values(device).some((v) => v !== undefined);
  return {
    totalGeneration: o.eTotal || o.totalPower || o.totalGeneration || undefined,
    todayGeneration: o.eToday || o.todayGeneration || undefined,
    monthGeneration: o.eMonth || o.monthGeneration || undefined,
    device: hasDevice ? device : undefined,
  };
}

/**
 * Fetch the cumulative "as of now" snapshot (totalData): lifetime/today/month generation
 * plus the device/plant status. Used by both the hourly and aggregated paths. Returns an
 * empty object on any failure.
 */
async function fetchTotalSnapshot(
  baseUrl: string,
  authHeaders: AuthHeaders,
  date: string,
): Promise<TotalSnapshot> {
  try {
    const response = await fetch(`${baseUrl}${ENDPOINTS.totalData}`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ date }),
    });
    if (!response.ok) return {};
    const totalData = await response.json();
    if (totalData && totalData.result === 1 && totalData.obj) return parseSnapshot(totalData.obj);
  } catch (error) {
    console.warn("[GrowattAPI] Error fetching total snapshot:", error);
  }
  return {};
}

/** Endpoint + request date for the week/month/year/total aggregated ranges. */
function resolveAggregatedRequest(
  timespan: SolarTimespan,
  date: string,
): { endpoint: string; requestDate: string } {
  if (timespan === "weekly") return { endpoint: ENDPOINTS.weekChart, requestDate: date };
  if (timespan === "monthly")
    return { endpoint: ENDPOINTS.monthChart, requestDate: date.slice(0, 7) };
  if (timespan === "total")
    return { endpoint: ENDPOINTS.totalChart, requestDate: date.slice(0, 4) };
  return { endpoint: ENDPOINTS.yearChart, requestDate: date.slice(0, 4) };
}

/** Assemble aggregated solar data for the week/month/year ranges. */
async function fetchAggregatedSolarData(
  baseUrl: string,
  authHeaders: AuthHeaders,
  timespan: SolarTimespan,
  date: string,
): Promise<SolarData> {
  const { endpoint, requestDate } = resolveAggregatedRequest(timespan, date);
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

  const snapshot = await fetchTotalSnapshot(baseUrl, authHeaders, requestDate);
  const periodTotal = energyValues.reduce((sum, value) => sum + value, 0);
  const finalTotal = snapshot.totalGeneration ?? periodTotal;
  const hasData = energyValues.some((value) => value > 0);
  const labels = buildAggregatedLabels(timespan, energyValues.length, dayLabels);
  const datasets = [{ data: hasData ? energyValues : [0], color: () => "#3b82f6", strokeWidth: 2 }];

  return {
    chartData: { labels: hasData ? labels : ["No Data"], datasets },
    metrics: {
      todayGeneration: periodTotal,
      totalGeneration: finalTotal,
      todayRevenue: periodTotal,
      totalRevenue: finalTotal,
    },
    device: snapshot.device,
  };
}

/** Hourly view: 5-minute power samples (pac) + totals for metrics. */
async function fetchHourlySolarData(
  baseUrl: string,
  authHeaders: AuthHeaders,
  date: string,
): Promise<SolarData> {
  let powerValues: number[] = [];
  try {
    const chartResponse = await fetch(`${baseUrl}${ENDPOINTS.dayChart}`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ date }),
    });
    if (chartResponse.ok) {
      const chartData = await chartResponse.json();
      if (chartData.result === 1) powerValues = chartData.obj?.pac || [];
    }
  } catch (error) {
    console.warn("[GrowattAPI] Day chart request error:", error);
  }

  const snapshot = await fetchTotalSnapshot(baseUrl, authHeaders, date);
  const cleanPowerValues = cleanPowerData(powerValues);
  const labels = generateTimeLabels();
  const metrics = calculateMetrics(cleanPowerValues, "hourly", 1, {
    total: snapshot.totalGeneration,
    today: snapshot.todayGeneration,
    month: snapshot.monthGeneration,
  });
  const optimized = optimizeChartData(
    cleanPowerValues,
    labels.slice(0, cleanPowerValues.length),
    "hourly",
  );

  return {
    chartData: {
      labels: optimized.labels,
      datasets: [{ data: optimized.data, color: () => "#10b981", strokeWidth: 2 }],
    },
    metrics,
    device: snapshot.device,
  };
}

const AGGREGATED: SolarTimespan[] = ["weekly", "monthly", "yearly", "total"];

async function checkApiHealth(baseUrl: string): Promise<boolean> {
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

export function createGrowattApi(ctx: CoreApiContext) {
  const baseUrl = ctx.env.javaApiBaseUrl;

  /** JSON headers carrying the live Supabase access token. */
  const authHeaders: AuthHeaders = async () => {
    const token = await ctx.getAccessToken();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  return {
    fetchSolarData: (timespan: SolarTimespan, date: string): Promise<SolarData> =>
      AGGREGATED.includes(timespan)
        ? fetchAggregatedSolarData(baseUrl, authHeaders, timespan, date)
        : fetchHourlySolarData(baseUrl, authHeaders, date),
    checkApiHealth: () => checkApiHealth(baseUrl),
  };
}

export type GrowattApi = ReturnType<typeof createGrowattApi>;
