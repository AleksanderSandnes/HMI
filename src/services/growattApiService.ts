/**
 * Direct Growatt API Service
 * Handles direct communication with the Java Growatt API
 * No encryption, no JWT - simple and direct
 */

import { getDataMode } from './dataConfig';
import {
  buildAggregatedLabels,
  calculateMetrics,
  cleanPowerData,
  generateTimeLabels,
  optimizeChartData,
} from '../utils/growattApiHelpers';

export interface SolarData {
  chartData: {
    labels: string[];
    datasets: {
      data: number[];
      color: () => string;
      strokeWidth: number;
    }[];
  };
  metrics: {
    todayGeneration: number;
    totalGeneration: number;
    todayRevenue: number;
    totalRevenue: number;
  };
}

/**
 * API Configuration
 */
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8080',
    endpoints: {
      login: '/api/growatt/login',
      dayChart: '/api/growatt/dayChart',
      weekChart: '/api/growatt/weekChart',
      monthChart: '/api/growatt/monthChart',
      yearChart: '/api/growatt/yearChart',
      totalData: '/api/growatt/totalData',
      health: '/api/growatt/health',
    },
  },
  production: {
    baseUrl: 'https://growattapi.onrender.com',
    endpoints: {
      login: '/api/growatt/login',
      dayChart: '/api/growatt/dayChart',
      weekChart: '/api/growatt/weekChart',
      monthChart: '/api/growatt/monthChart',
      yearChart: '/api/growatt/yearChart',
      totalData: '/api/growatt/totalData',
      health: '/api/growatt/health',
    },
  },
};

/**
 * Get current environment config
 */
function getApiConfig() {
  const mode = getDataMode();
  return mode === 'production' ? API_CONFIG.production : API_CONFIG.development;
}

/**
 * Get user's Growatt credentials from backend
 */
async function getGrowattCredentials(): Promise<{
  account: string | null;
  password: string | null;
  plantId: string | null;
}> {
  try {
    const token = await getAuthToken();

    if (!token) {
      console.warn('[GrowattAPI] No auth token available - user not logged in');
      return { account: null, password: null, plantId: null };
    }

    // Get the backend URL based on current mode
    const mode = getDataMode();
    const backendUrl =
      mode === 'production'
        ? 'https://weatherapi-sbwb.onrender.com'
        : 'http://localhost:5000';

    // Fetch user settings from MongoDB via backend API
    const response = await fetch(`${backendUrl}/api/settings/credentials`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        '[GrowattAPI] Failed to fetch credentials:',
        response.status
      );
      return { account: null, password: null, plantId: null };
    }

    const data = await response.json();
    return {
      account: data.credentials?.account || null,
      password: data.credentials?.password || null,
      plantId: data.credentials?.plantId || null,
    };
  } catch (error) {
    console.error('[GrowattAPI] Error getting credentials:', error);
    return { account: null, password: null, plantId: null };
  }
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof localStorage !== 'undefined') {
      // Web: Use localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.token || null;
      }
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.token || null;
      }
    }
    return null;
  } catch (error) {
    console.error('[GrowattAPI] Error getting auth token:', error);
    return null;
  }
}

/**
 * Fetch the lifetime total generation (eTotal) used for the "Total" metric column.
 */
async function fetchTotalGeneration(
  config: ReturnType<typeof getApiConfig>,
  date: string
): Promise<number | undefined> {
  try {
    const response = await fetch(
      `${config.baseUrl}${config.endpoints.totalData}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ date }),
      }
    );

    if (!response.ok) {
      return undefined;
    }

    const totalData = await response.json();
    if (totalData && totalData.result === 1 && totalData.obj) {
      return (
        totalData.obj.eTotal ||
        totalData.obj.totalPower ||
        totalData.obj.totalGeneration ||
        undefined
      );
    }
  } catch (error) {
    console.warn('[GrowattAPI] Error fetching total data for metrics:', error);
  }
  return undefined;
}

/**
 * Fetch and assemble aggregated solar data for the week/month/year time ranges.
 * Assumes the Growatt session has already been established by a prior login call.
 */
async function fetchAggregatedSolarData(
  timespan: string,
  date: string,
  config: ReturnType<typeof getApiConfig>,
  isMobile: boolean
): Promise<SolarData> {
  // Pick the endpoint and the date granularity each range expects.
  let endpoint: string;
  let requestDate: string;

  if (timespan === 'weekly') {
    endpoint = config.endpoints.weekChart;
    requestDate = date; // yyyy-MM-dd (inclusive end of the 7-day window)
  } else if (timespan === 'monthly') {
    endpoint = config.endpoints.monthChart;
    requestDate = date.slice(0, 7); // yyyy-MM
  } else {
    endpoint = config.endpoints.yearChart;
    requestDate = date.slice(0, 4); // yyyy
  }

  console.log(
    `[GrowattAPI] Fetching ${timespan} chart from ${endpoint} for ${requestDate} (mobile: ${isMobile})`
  );

  let energyValues: number[] = [];
  let dayLabels: string[] | undefined;

  try {
    const chartResponse = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ date: requestDate }),
    });

    if (chartResponse.ok) {
      const chartData = await chartResponse.json();
      if (chartData.result === 1 && chartData.obj) {
        energyValues = cleanPowerData(chartData.obj.energy || []);
        dayLabels = chartData.obj.days; // only present on the weekly response
        console.log(
          `[GrowattAPI] ✅ Fetched ${timespan} chart (${energyValues.length} buckets)`
        );
      } else {
        console.warn(`[GrowattAPI] ${timespan} chart returned error result`);
      }
    } else {
      const errorData = await chartResponse.text();
      console.warn(
        `[GrowattAPI] ${timespan} chart request failed:`,
        chartResponse.status,
        errorData
      );
    }
  } catch (error) {
    console.warn(`[GrowattAPI] ${timespan} chart request error:`, error);
  }

  // Lifetime total for the "Total" column.
  const totalGenerationFromApi = await fetchTotalGeneration(config, requestDate);

  // Sum of all buckets = generation for the selected period (kWh).
  const periodTotal = energyValues.reduce((sum, value) => sum + value, 0);
  const finalTotal = totalGenerationFromApi ?? periodTotal;

  const hasData = energyValues.some((value) => value > 0);
  const labels = buildAggregatedLabels(
    timespan,
    energyValues.length,
    dayLabels
  );

  const chartData = hasData
    ? {
        labels,
        datasets: [
          {
            data: energyValues,
            color: () => '#3b82f6', // Blue bars, matching Growatt
            strokeWidth: 2,
          },
        ],
      }
    : {
        labels: ['No Data'],
        datasets: [
          {
            data: [0],
            color: () => '#3b82f6',
            strokeWidth: 2,
          },
        ],
      };

  return {
    chartData,
    metrics: {
      todayGeneration: periodTotal,
      totalGeneration: finalTotal,
      todayRevenue: periodTotal,
      totalRevenue: finalTotal,
    },
  };
}

/**
 * Fetch solar data from Growatt API
 */
export async function fetchSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<SolarData> {
  const config = getApiConfig();

  console.log(`[GrowattAPI] Fetching ${timespan} data for ${date}`);
  console.log(`[GrowattAPI] Using API: ${config.baseUrl}`);

  try {
    // Get user credentials
    const credentials = await getGrowattCredentials();

    if (!credentials.account || !credentials.password) {
      throw new Error(
        'Growatt credentials not found. Please configure your account in Settings > API Credentials.'
      );
    }

    console.log(`[GrowattAPI] Got credentials for: ${credentials.account}`);

    // Step 1: Login to Growatt API
    console.log('[GrowattAPI] Logging in to Growatt API...');
    const loginResponse = await fetch(
      `${config.baseUrl}${config.endpoints.login}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          account: credentials.account,
          password: credentials.password, // Plain password - Java API will hash it
        }),
      }
    );

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error(
        '[GrowattAPI] Login failed:',
        loginResponse.status,
        errorData
      );
      throw new Error(`Growatt login failed: ${loginResponse.status}`);
    }

    console.log('[GrowattAPI] ✅ Login successful');

    // For aggregated time ranges (week/month/year) use the dedicated chart
    // endpoints, which return discrete energy (kWh) totals per bucket rather than
    // the 5-minute power samples used for the hourly view.
    if (
      timespan === 'weekly' ||
      timespan === 'monthly' ||
      timespan === 'yearly'
    ) {
      return await fetchAggregatedSolarData(timespan, date, config, isMobile);
    }

    // Step 2: Fetch day chart data and total data in parallel after login
    let powerValues: number[] = [];

    // Fetch day chart data (for chart visualization)
    try {
      console.log('[GrowattAPI] Fetching day chart data...');
      const chartResponse = await fetch(
        `${config.baseUrl}${config.endpoints.dayChart}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            date: date, // YYYY-MM-DD format
          }),
        }
      );

      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        if (chartData.result === 1) {
          powerValues = chartData.obj?.pac || [];
          console.log('[GrowattAPI] ✅ Successfully fetched day chart data');
        } else {
          console.warn('[GrowattAPI] Day chart returned error result');
        }
      } else {
        const errorData = await chartResponse.text();
        console.warn(
          '[GrowattAPI] Day chart request failed:',
          chartResponse.status,
          errorData
        );
      }
    } catch (error) {
      console.warn('[GrowattAPI] Day chart request error:', error);
    }

    // Step 3: Fetch total data for accurate total generation and today's data (independent of chart data)
    let totalGenerationFromApi: number | undefined;
    let todayGenerationFromApi: number | undefined;
    let monthGenerationFromApi: number | undefined;
    try {
      console.log('[GrowattAPI] Fetching total data for accurate metrics...');
      const totalDataRequest = { date }; // Use the provided date
      console.log(
        `[GrowattAPI] Sending totalData request with date: ${date} for timespan: ${timespan}`
      );

      // Make direct call to totalData endpoint using the same session
      const totalDataResponse = await fetch(
        `${config.baseUrl}${config.endpoints.totalData}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(totalDataRequest),
        }
      );

      if (!totalDataResponse.ok) {
        const errorData = await totalDataResponse.text();
        console.error(
          '[GrowattAPI] Total data request failed:',
          totalDataResponse.status,
          errorData
        );
      } else {
        const totalData = await totalDataResponse.json();
        console.log('[GrowattAPI] ✅ Successfully fetched total data');

        if (totalData && totalData.result === 1 && totalData.obj) {
          // Try different property names that might exist in the API response
          totalGenerationFromApi =
            totalData.obj.eTotal ||
            totalData.obj.totalPower ||
            totalData.obj.totalGeneration ||
            undefined;

          // Also get today's generation if available
          todayGenerationFromApi =
            totalData.obj.eToday || totalData.obj.todayGeneration || undefined;

          // Get month's generation if available
          monthGenerationFromApi =
            totalData.obj.eMonth || totalData.obj.monthGeneration || undefined;

          if (totalGenerationFromApi) {
            console.log(
              '[GrowattAPI] Successfully got total generation from API:',
              totalGenerationFromApi,
              'kWh'
            );
          }

          if (todayGenerationFromApi) {
            console.log(
              '[GrowattAPI] Successfully got today generation from API:',
              todayGenerationFromApi,
              'kWh'
            );
          }

          if (monthGenerationFromApi) {
            console.log(
              '[GrowattAPI] Successfully got month generation from API:',
              monthGenerationFromApi,
              'kWh for date:',
              date
            );
          }

          // Log all available fields for debugging
          console.log('[GrowattAPI] Full totalData response obj:', {
            eToday: totalData.obj.eToday,
            eMonth: totalData.obj.eMonth,
            eTotal: totalData.obj.eTotal,
            requestDate: date,
          });

          if (
            !totalGenerationFromApi &&
            !todayGenerationFromApi &&
            !monthGenerationFromApi
          ) {
            console.log('[GrowattAPI] No generation data in API response');
          }
        } else {
          console.log('[GrowattAPI] Invalid total data response or no obj');
        }
      }
    } catch (error) {
      console.warn(
        '[GrowattAPI] Error fetching total data (will use calculated fallback):',
        error
      );
    }

    // Step 4: Process the data (even if chart data failed, we can still return metrics)
    const cleanPowerValues = cleanPowerData(powerValues);
    const labels = generateTimeLabels();
    const metrics = calculateMetrics(
      cleanPowerValues,
      timespan,
      1,
      totalGenerationFromApi,
      todayGenerationFromApi,
      monthGenerationFromApi
    );

    // Use the new optimization function for better chart visualization
    const optimizedChart = optimizeChartData(
      cleanPowerValues,
      labels.slice(0, cleanPowerValues.length),
      timespan,
      isMobile
    );

    return {
      chartData: {
        labels: optimizedChart.labels,
        datasets: [
          {
            data: optimizedChart.data,
            color: () => '#10b981', // Green
            strokeWidth: 2,
          },
        ],
      },
      metrics,
    };
  } catch (error) {
    console.error('[GrowattAPI] Error fetching solar data:', error);
    throw error;
  }
}

/**
 * Check Growatt API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const config = getApiConfig();

    console.log(`[GrowattAPI] Checking API health: ${config.baseUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${config.baseUrl}${config.endpoints.health}`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const isHealthy = response.ok;
    console.log(`[GrowattAPI] Health check: ${isHealthy ? '✅' : '❌'}`);
    return isHealthy;
  } catch (error) {
    console.error('[GrowattAPI] Health check failed:', error);
    return false;
  }
}
