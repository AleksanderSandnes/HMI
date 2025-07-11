/**
 * Unified Solar API Service
 * Handles communication with both development (Java API) and production APIs
 * with the same interface and data processing logic
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
 * Configuration for different API endpoints
 */
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8080',
    endpoints: {
      login: '/api/growatt/login',
      dayChart: '/api/growatt/dayChart',
      health: '/api/growatt/health',
    },
    credentials: {
      account: 'charles.sandnes@lyse.net', // TODO: Get from user settings
      password: '8382Napp', // TODO: Get from user settings
      plantId: '1907049', // TODO: Get from user settings
    },
  },
  production: {
    baseUrl:
      process.env.EXPO_PUBLIC_PRODUCTION_API ||
      'https://solar-api.onrender.com/api',
    endpoints: {
      daily: '/solar/daily',
      health: '/health',
    },
  },
};

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
    console.error('[UnifiedSolarAPI] Error getting auth token:', error);
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
 * Calculate metrics from power data
 */
function calculateMetrics(
  powerValues: number[],
  pricePerKwh: number = 0.12
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
 * Fetch solar data from development API (Java API)
 */
async function fetchDevelopmentSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<SolarData> {
  const config = API_CONFIG.development;

  console.log(
    `[UnifiedSolarAPI] Fetching ${timespan} data from Java API: ${config.baseUrl}`
  );

  try {
    // Step 1: Login to Java API and capture session
    console.log('[UnifiedSolarAPI] Logging in to Java API...');
    const loginResponse = await fetch(
      `${config.baseUrl}${config.endpoints.login}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          account: config.credentials.account,
          password: config.credentials.password,
        }),
      }
    );

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error(
        '[UnifiedSolarAPI] Login failed:',
        loginResponse.status,
        errorData
      );
      throw new Error(`Java API login failed: ${loginResponse.status}`);
    }

    // Extract session cookies from login response
    const sessionCookies = loginResponse.headers.get('set-cookie') || '';
    console.log(
      '[UnifiedSolarAPI] Login successful, session cookies:',
      sessionCookies ? 'Present' : 'None'
    );

    // Step 2: Fetch day chart data with session
    const requestBody = {
      plantId: config.credentials.plantId,
      date: date, // YYYY-MM-DD format
    };

    const chartHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Include session cookies if available
    if (sessionCookies) {
      chartHeaders['Cookie'] = sessionCookies;
    }

    console.log('[UnifiedSolarAPI] Sending dayChart request:', {
      url: `${config.baseUrl}${config.endpoints.dayChart}`,
      body: requestBody,
      headers: chartHeaders,
      dateReceived: date,
      plantId: config.credentials.plantId,
      hasSessionCookies: !!sessionCookies,
      sessionCookiesLength: sessionCookies.length,
    });

    const response = await fetch(
      `${config.baseUrl}${config.endpoints.dayChart}`,
      {
        method: 'POST',
        headers: chartHeaders,
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
        console.error('[UnifiedSolarAPI] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: `${config.baseUrl}${config.endpoints.dayChart}`,
          requestBody,
          headers: chartHeaders,
          errorResponse: errorData,
        });

        // Try to parse as JSON for more detailed error info
        try {
          const jsonError = JSON.parse(errorData);
          console.error('[UnifiedSolarAPI] Parsed error details:', jsonError);
        } catch (e) {
          // Not JSON, just log the text
          console.error(
            '[UnifiedSolarAPI] Error response (raw text):',
            errorData
          );
        }
      } catch (e) {
        console.error('[UnifiedSolarAPI] Could not read error response:', e);
        errorData = 'Could not read error response';
      }

      throw new Error(
        `Development API error: ${response.status} ${response.statusText}. Details: ${errorData}`
      );
    }

    const data = await response.json();
    console.log(
      '[UnifiedSolarAPI] Successfully fetched solar data from Java API'
    );

    // Step 3: Process Java API response
    if (data.result !== 1) {
      throw new Error('Java API returned error result');
    }

    const powerValues = data.obj?.pac || [];
    const cleanPowerValues = cleanPowerData(powerValues);
    const labels = generateTimeLabels();
    const metrics = calculateMetrics(cleanPowerValues);

    // Use the same label filtering approach as mock data service
    const rawData = cleanPowerValues;
    const rawLabels = labels.slice(0, cleanPowerValues.length);

    // Apply the same filtering logic as mock data service
    let displayLabels: string[] = [];
    let displayData: number[] = [];

    if (timespan === 'hourly') {
      // For hourly, show every 2 hours on mobile, every hour on desktop
      if (isMobile) {
        // Mobile: show every 2 hours (12 labels)
        displayLabels = rawLabels.filter(
          (_: string, index: number) => index % 2 === 0
        );
        displayData = rawData.filter(
          (_: number, index: number) => index % 2 === 0
        );
      } else {
        // Desktop: show every hour (24 labels)
        displayLabels = rawLabels;
        displayData = rawData;
      }
    } else if (timespan === 'daily') {
      // For daily, show every 2-3 hours
      if (isMobile) {
        // Mobile: show every 3 hours (8 labels)
        displayLabels = rawLabels.filter(
          (_: string, index: number) => index % 3 === 0
        );
        displayData = rawData.filter(
          (_: number, index: number) => index % 3 === 0
        );
      } else {
        // Desktop: show every 2 hours (12 labels)
        displayLabels = rawLabels.filter(
          (_: string, index: number) => index % 2 === 0
        );
        displayData = rawData.filter(
          (_: number, index: number) => index % 2 === 0
        );
      }
    } else {
      // For weekly, monthly, yearly - use all labels
      displayLabels = rawLabels;
      displayData = rawData;
    }

    return {
      chartData: {
        labels: displayLabels,
        datasets: [
          {
            data: displayData,
            color: () => '#10b981', // Green - same as production for consistency
            strokeWidth: 2, // Same as mock data for consistency
          },
        ],
      },
      metrics,
    };
  } catch (error) {
    console.error(
      '[UnifiedSolarAPI] Error fetching development solar data:',
      error
    );
    throw error;
  }
}

/**
 * Fetch solar data from production API
 */
async function fetchProductionSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<SolarData> {
  const config = API_CONFIG.production;

  console.log(
    `[UnifiedSolarAPI] Fetching ${timespan} data from production API: ${config.baseUrl}`
  );

  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[UnifiedSolarAPI] Making authenticated request');
    } else {
      console.warn('[UnifiedSolarAPI] No auth token available');
    }

    const response = await fetch(
      `${config.baseUrl}${config.endpoints.daily}/${date}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        '[UnifiedSolarAPI] Request failed:',
        response.status,
        errorData
      );
      throw new Error(
        `Production API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      '[UnifiedSolarAPI] Successfully fetched solar data from production API'
    );

    // Clean and process production data using the same approach as mock data service
    const rawData = cleanPowerData(data.values || []);
    const rawLabels = data.labels || [];

    // Ensure labels match data length
    const alignedLabels = rawLabels.slice(0, rawData.length);

    // Apply the same filtering logic as mock data service
    let displayLabels: string[] = [];
    let displayData: number[] = [];

    if (timespan === 'hourly') {
      // For hourly, show every 2 hours on mobile, every hour on desktop
      if (isMobile) {
        // Mobile: show every 2 hours (12 labels)
        displayLabels = alignedLabels.filter(
          (_: string, index: number) => index % 2 === 0
        );
        displayData = rawData.filter(
          (_: number, index: number) => index % 2 === 0
        );
      } else {
        // Desktop: show every hour (24 labels)
        displayLabels = alignedLabels;
        displayData = rawData;
      }
    } else if (timespan === 'daily') {
      // For daily, show every 2-3 hours
      if (isMobile) {
        // Mobile: show every 3 hours (8 labels)
        displayLabels = alignedLabels.filter(
          (_: string, index: number) => index % 3 === 0
        );
        displayData = rawData.filter(
          (_: number, index: number) => index % 3 === 0
        );
      } else {
        // Desktop: show every 2 hours (12 labels)
        displayLabels = alignedLabels.filter(
          (_: string, index: number) => index % 2 === 0
        );
        displayData = rawData.filter(
          (_: number, index: number) => index % 2 === 0
        );
      }
    } else {
      // For weekly, monthly, yearly - use all labels
      displayLabels = alignedLabels;
      displayData = rawData;
    }

    return {
      chartData: {
        labels: displayLabels,
        datasets: [
          {
            data: displayData,
            color: () => '#10b981', // Green - same as development for consistency
            strokeWidth: 2, // Same as mock data for consistency
          },
        ],
      },
      metrics: {
        todayGeneration: data.metrics?.todayGeneration || 0,
        totalGeneration: data.metrics?.totalGeneration || 0,
        todayRevenue: data.metrics?.todayRevenue || 0,
        totalRevenue: data.metrics?.totalRevenue || 0,
      },
    };
  } catch (error) {
    console.error(
      '[UnifiedSolarAPI] Error fetching production solar data:',
      error
    );
    throw error;
  }
}

/**
 * Main function to fetch solar data based on current mode
 */
export async function fetchSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<SolarData> {
  const dataMode = getDataMode();

  console.log(`[UnifiedSolarAPI] Fetching solar data in ${dataMode} mode`);

  if (dataMode === 'development') {
    return fetchDevelopmentSolarData(timespan, date, isMobile);
  } else if (dataMode === 'production') {
    return fetchProductionSolarData(timespan, date, isMobile);
  } else {
    throw new Error(`Unsupported data mode for solar API: ${dataMode}`);
  }
}

/**
 * Check API health based on current mode
 */
export async function checkSolarApiHealth(): Promise<boolean> {
  const dataMode = getDataMode();

  try {
    console.log(`[UnifiedSolarAPI] Checking ${dataMode} API health...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let healthUrl: string;
    if (dataMode === 'development') {
      healthUrl = `${API_CONFIG.development.baseUrl}${API_CONFIG.development.endpoints.health}`;
    } else if (dataMode === 'production') {
      healthUrl = `${API_CONFIG.production.baseUrl}${API_CONFIG.production.endpoints.health}`;
    } else {
      return false;
    }

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok;
    console.log(
      `[UnifiedSolarAPI] ${dataMode} API health check: ${isHealthy ? '✅' : '❌'}`
    );
    return isHealthy;
  } catch (error) {
    console.error(
      `[UnifiedSolarAPI] ${dataMode} API health check failed:`,
      error
    );
    return false;
  }
}
