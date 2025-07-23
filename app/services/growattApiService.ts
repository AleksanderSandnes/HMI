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
      health: '/api/growatt/health',
    },
  },
  production: {
    baseUrl: 'https://growattapi.onrender.com',
    endpoints: {
      login: '/api/growatt/login',
      dayChart: '/api/growatt/dayChart',
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
    console.error('[GrowattAPI] Error getting auth token:', error);
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
  console.log(
    `[GrowattAPI] Optimizing chart data for ${timespan}, mobile: ${isMobile}`
  );
  console.log(`[GrowattAPI] Input data points: ${powerValues.length}`);

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

  console.log(
    `[GrowattAPI] Meaningful data range: ${firstMeaningfulIndex} to ${actualLastIndex}`
  );

  if (firstMeaningfulIndex === -1 || actualLastIndex === -1) {
    // No meaningful data found
    console.log('[GrowattAPI] No meaningful solar generation data found');
    return { data: [0], labels: ['No Data'] };
  }

  // Extract the meaningful range with minimal padding to avoid showing zeros
  const startIndex = Math.max(0, firstMeaningfulIndex - 6); // 30 minutes before first meaningful data
  const endIndex = Math.min(powerValues.length - 1, actualLastIndex + 6); // 30 minutes after last meaningful data

  const rangedData = powerValues.slice(startIndex, endIndex + 1);
  const rangedLabels = labels.slice(startIndex, endIndex + 1);

  console.log(
    `[GrowattAPI] Filtered to range: ${startIndex} to ${endIndex} (${rangedData.length} points)`
  );

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

  console.log(
    `[GrowattAPI] Final optimized data points: ${sampledData.length}`
  );
  console.log(
    `[GrowattAPI] Sample labels: ${sampledLabels.slice(0, 5).join(', ')}...`
  );

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
  pricePerKwh: number = 1
): {
  todayGeneration: number;
  totalGeneration: number;
  todayRevenue: number;
  totalRevenue: number;
} {
  // Sum power values and convert to kWh (5-minute intervals, so divide by 12 for hourly average)
  const totalGenerationWh =
    powerValues.reduce((sum, value) => sum + value, 0) / 12;
  const totalGenerationKwh = totalGenerationWh / 1000;

  return {
    todayGeneration: totalGenerationKwh,
    totalGeneration: totalGenerationKwh, // TODO: Get actual total from API/database
    todayRevenue: totalGenerationKwh * pricePerKwh,
    totalRevenue: totalGenerationKwh * pricePerKwh, // TODO: Calculate properly from historical data
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

    // Step 2: Fetch day chart data
    const requestBody = {
      date: date, // YYYY-MM-DD format
      // Note: plantId is omitted - let the backend use the one from login session
    };

    console.log('[GrowattAPI] Fetching day chart data...');
    const response = await fetch(
      `${config.baseUrl}${config.endpoints.dayChart}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        '[GrowattAPI] Day chart request failed:',
        response.status,
        errorData
      );
      throw new Error(
        `Growatt API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[GrowattAPI] ✅ Successfully fetched solar data');

    // Step 3: Process the response
    if (data.result !== 1) {
      throw new Error('Growatt API returned error result');
    }

    const powerValues = data.obj?.pac || [];
    const cleanPowerValues = cleanPowerData(powerValues);
    const labels = generateTimeLabels();
    const metrics = calculateMetrics(cleanPowerValues);

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
