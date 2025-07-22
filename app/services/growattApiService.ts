/**
 * Direct Growatt API Service
 * Handles direct communication with the Java Growatt API
 * No encryption, no JWT - simple and direct
 */

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
  const mode = process.env.EXPO_PUBLIC_DATA_MODE || 'development';
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

    // Fetch user settings from MongoDB via backend API
    const response = await fetch(
      'https://weatherapi-sbwb.onrender.com/api/settings/api/credentials',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

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

    if (!credentials.account || !credentials.password || !credentials.plantId) {
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
          plantId: credentials.plantId,
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
      plantId: credentials.plantId,
      date: date, // YYYY-MM-DD format
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

    // Apply filtering based on timespan and device
    const rawData = cleanPowerValues;
    const rawLabels = labels.slice(0, cleanPowerValues.length);

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
