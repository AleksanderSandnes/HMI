import { logInfo, logError, logWarn } from '../services/graylogService';
/**
 * Direct Growatt API Service
 * Handles direct communication with the Java Growatt API
 * No encryption, no JWT - simple and direct
 */

import { getDataMode } from './dataConfig';

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
      totalData: '/api/growatt/totalData',
      health: '/api/growatt/health',
    },
  },
  production: {
    baseUrl: 'https://growattapi.onrender.com',
    endpoints: {
      login: '/api/growatt/login',
      dayChart: '/api/growatt/dayChart',
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
      logWarn('No auth token available - user not logged in', 'GrowattAPI');
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
      logError('Failed to fetch credentials', 'GrowattAPI', new Error(`HTTP ${response.status}`));
      return { account: null, password: null, plantId: null };
    }

    const data = await response.json();
    return {
      account: data.credentials?.account || null,
      password: data.credentials?.password || null,
      plantId: data.credentials?.plantId || null,
    };
  } catch (error) {
    logError('Error getting credentials', 'GrowattAPI', error as Error);
    return { account: null, password: null, plantId: null };
  }
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
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
    logError('Error getting auth token', 'GrowattAPI', error as Error);
    return null;
  }
}

/**
 * Clean and filter power data to handle null/undefined values
 */
function cleanPowerData(powerValues: any[]): number[] {
  return powerValues.map((value: any) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return Number(value);
  });
}

/**
 * Generate time labels for 5-minute intervals (288 values = 24 hours * 12 intervals/hour)
 */
function generateTimeLabels(): string[] {
  const labels = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      labels.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  return labels;
}

/**
 * Filter and optimize chart data for better visualization
 * Removes zero values and creates smart labeling
 */
function optimizeChartData(
  powerValues: number[],
  labels: string[],
  timespan: string,
  isMobile: boolean = false
): { data: number[]; labels: string[] } {
  logInfo(`Optimizing chart data for ${timespan}, mobile: ${isMobile}`, 'GrowattAPI');
  logInfo(`Input data points: ${powerValues.length}`, 'GrowattAPI');

  // Find the range of meaningful data (where power > 5W to avoid noise)
  const meaningfulThreshold = 5; // Watts
  const firstMeaningfulIndex = powerValues.findIndex(
    (value) => value > meaningfulThreshold
  );
  const lastMeaningfulIndex = powerValues
    .slice()
    .reverse()
    .findIndex((value) => value > meaningfulThreshold);
  const actualLastIndex =
    lastMeaningfulIndex >= 0
      ? powerValues.length - 1 - lastMeaningfulIndex
      : -1;

  logInfo(`Meaningful data range: ${firstMeaningfulIndex} to ${actualLastIndex}`, 'GrowattAPI');

  if (firstMeaningfulIndex === -1 || actualLastIndex === -1) {
    // No meaningful data found
    logInfo('No meaningful solar generation data found', 'GrowattAPI');
    return { data: [0], labels: ['No Data'] };
  }

  // Extract the meaningful range with minimal padding to avoid showing zeros
  const startIndex = Math.max(0, firstMeaningfulIndex - 6); // 30 minutes before first meaningful data
  const endIndex = Math.min(powerValues.length - 1, actualLastIndex + 6); // 30 minutes after last meaningful data

  const rangedData = powerValues.slice(startIndex, endIndex + 1);
  const rangedLabels = labels.slice(startIndex, endIndex + 1);

  logInfo(`Filtered to range: ${startIndex} to ${endIndex} (${rangedData.length} points)`, 'GrowattAPI');

  // Determine optimal sampling based on timespan and device
  let samplingInterval: number;

  if (timespan === 'hourly') {
    // For hourly view: Mobile shows every hour, Desktop shows every hour too
    samplingInterval = isMobile ? 12 : 12; // Both show every hour (12 * 5min = 60min)
  } else if (timespan === 'daily') {
    // For daily view, show every 30 minutes during active period
    samplingInterval = isMobile ? 12 : 6; // Mobile: 1 hour, Desktop: 30 minutes
  } else {
    // For other timespans, use current logic
    samplingInterval = 12; // Every hour
  }

  // Sample the data at the determined interval
  const sampledData: number[] = [];
  const sampledLabels: string[] = [];

  for (let i = 0; i < rangedData.length; i += samplingInterval) {
    sampledData.push(rangedData[i]);
    // Format labels to show clean hour labels
    const label = rangedLabels[i];
    const [hour, minute] = label.split(':');

    // For hourly view, only show full hours
    if (timespan === 'hourly') {
      if (minute === '00') {
        sampledLabels.push(`${hour}:00`);
      } else {
        // Round to nearest hour for cleaner display
        const hourNum = parseInt(hour);
        const displayHour = minute >= '30' ? hourNum + 1 : hourNum;
        sampledLabels.push(`${displayHour.toString().padStart(2, '0')}:00`);
      }
    } else {
      // For other timespans, show hour:minute as before
      if (minute === '00') {
        sampledLabels.push(`${hour}:00`);
      } else if (minute === '30' && samplingInterval <= 6) {
        sampledLabels.push(`${hour}:30`);
      } else {
        sampledLabels.push(label);
      }
    }
  }

  logInfo(`Final optimized data points: ${sampledData.length}`, 'GrowattAPI');
  logInfo(`Sample labels: ${sampledLabels.slice(0, 5).join(', ')}...`, 'GrowattAPI');

  return {
    data: sampledData,
    labels: sampledLabels,
  };
}

/**
 * Calculate metrics from power data
 */
function calculateMetrics(
  powerValues: number[],
  timespan: string,
  pricePerKwh: number = 1,
  totalGenerationFromApi?: number,
  todayGenerationFromApi?: number,
  monthGenerationFromApi?: number
): {
  todayGeneration: number;
  totalGeneration: number;
  todayRevenue: number;
  totalRevenue: number;
} {
  // Sum power values and convert to kWh (5-minute intervals, so divide by 12 for hourly average)
  const totalGenerationWh =
    powerValues.reduce((sum, value) => sum + value, 0) / 12;
  const calculatedTodayGenerationKwh = totalGenerationWh / 1000;

  // Use API values if provided, otherwise fall back to calculated values
  let finalTodayGeneration: number;
  let finalTotalGeneration: number;

  // Determine what to show based on timespan
  switch (timespan) {
    case 'monthly':
      // For monthly view, show month generation as "today" and total as "total"
      finalTodayGeneration =
        monthGenerationFromApi ?? calculatedTodayGenerationKwh;
      finalTotalGeneration =
        totalGenerationFromApi ?? calculatedTodayGenerationKwh;
      break;
    case 'daily':
    case 'hourly':
    default:
      // For daily/hourly view, show today's generation and total
      finalTodayGeneration =
        todayGenerationFromApi ?? calculatedTodayGenerationKwh;
      finalTotalGeneration =
        totalGenerationFromApi ?? calculatedTodayGenerationKwh;
      break;
  }

  return {
    todayGeneration: finalTodayGeneration,
    totalGeneration: finalTotalGeneration,
    todayRevenue: finalTodayGeneration * pricePerKwh,
    totalRevenue: finalTotalGeneration * pricePerKwh,
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

  logInfo(`Fetching ${timespan} data for ${date}`, 'GrowattAPI');
  logInfo(`Using API: ${config.baseUrl}`, 'GrowattAPI');

  try {
    // Get user credentials
    const credentials = await getGrowattCredentials();

    if (!credentials.account || !credentials.password) {
      throw new Error(
        'Growatt credentials not found. Please configure your account in Settings > API Credentials.'
      );
    }

    logInfo(`Got credentials for: ${credentials.account}`, 'GrowattAPI');

    // Step 1: Login to Growatt API
    logInfo('Logging in to Growatt API...', 'GrowattAPI');
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
      logError('Login failed', 'GrowattAPI', new Error(`Status: ${loginResponse.status}, Data: ${errorData}`));
      throw new Error(`Growatt login failed: ${loginResponse.status}`);
    }

    logInfo('✅ Login successful', 'GrowattAPI');

    // Step 2: Fetch day chart data and total data in parallel after login
    let powerValues: number[] = [];
    let chartDataSuccess = false;

    // Fetch day chart data (for chart visualization)
    try {
      logInfo('Fetching day chart data...', 'GrowattAPI');
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
          chartDataSuccess = true;
          logInfo('✅ Successfully fetched day chart data', 'GrowattAPI');
        } else {
          logWarn('Day chart returned error result', 'GrowattAPI');
        }
      } else {
        const errorData = await chartResponse.text();
        logWarn('Day chart request failed', 'GrowattAPI', { 
          status: chartResponse.status, 
          errorData 
        });
      }
    } catch (error) {
      logWarn('Day chart request error', 'GrowattAPI', { error });
    }

    // Step 3: Fetch total data for accurate total generation and today's data (independent of chart data)
    let totalGenerationFromApi: number | undefined;
    let todayGenerationFromApi: number | undefined;
    let monthGenerationFromApi: number | undefined;
    try {
      logInfo('Fetching total data for accurate metrics...', 'GrowattAPI');
      const totalDataRequest = { date }; // Use the provided date
      logInfo(`Sending totalData request with date: ${date} for timespan: ${timespan}`, 'GrowattAPI');

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
        logError('Total data request failed', 'GrowattAPI', new Error(`Status: ${totalDataResponse.status}, Data: ${errorData}`));
      } else {
        const totalData = await totalDataResponse.json();
        logInfo('✅ Successfully fetched total data', 'GrowattAPI');

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
            logInfo('Successfully got total generation from API', 'GrowattAPI', { 
              totalGeneration: totalGenerationFromApi,
              unit: 'kWh'
            });
          }

          if (todayGenerationFromApi) {
            logInfo('Successfully got today generation from API', 'GrowattAPI', { 
              todayGeneration: todayGenerationFromApi,
              unit: 'kWh'
            });
          }

          if (monthGenerationFromApi) {
            logInfo('Successfully got month generation from API', 'GrowattAPI', { 
              monthGeneration: monthGenerationFromApi,
              unit: 'kWh',
              date: date
            });
          }

          // Log all available fields for debugging
          logInfo('Full totalData response obj:', 'GrowattAPI', {
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
            logInfo('No generation data in API response', 'GrowattAPI');
          }
        } else {
          logInfo('Invalid total data response or no obj', 'GrowattAPI');
        }
      }
    } catch (error) {
      logWarn('Error fetching total data (will use calculated fallback)', 'GrowattAPI', { error });
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
    logError('Error fetching solar data', 'GrowattAPI', error as Error);
    throw error;
  }
}

/**
 * Check Growatt API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const config = getApiConfig();

    logInfo(`Checking API health: ${config.baseUrl}`, 'GrowattAPI');

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
    logInfo(`Health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`, 'GrowattAPI');
    return isHealthy;
  } catch (error) {
    logError('Health check failed', 'GrowattAPI', error as Error);
    return false;
  }
}
