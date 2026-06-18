/**
 * Simple Development API Service
 * Uses the backend Node.js solar API with authentication for development mode
 */

export interface DevelopmentSolarData {
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
    console.error('[DevelopmentAPI] Error getting auth token:', error);
    return null;
  }
}

/**
 * Fetch solar data from development backend API
 */
export async function fetchDevelopmentSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<DevelopmentSolarData> {
  const javaApiEndpoint = 'http://localhost:8080';

  console.log(
    `[DevelopmentAPI] Fetching ${timespan} data from Java API: ${javaApiEndpoint}`
  );

  try {
    // First, login to the Java API to establish session
    console.log('[DevelopmentAPI] Logging in to Java API...');
    const loginResponse = await fetch(`${javaApiEndpoint}/api/growatt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        account: 'charles.sandnes@lyse.net', // TODO: Get from user settings
        password: '8382Napp', // TODO: Get from user settings
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error(
        '[DevelopmentAPI] Login failed:',
        loginResponse.status,
        errorData
      );
      throw new Error(`Java API login failed: ${loginResponse.status}`);
    }

    console.log('[DevelopmentAPI] Login successful, fetching solar data...');

    const response = await fetch(`${javaApiEndpoint}/api/growatt/dayChart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        plantId: '1907049', // TODO: This should come from user settings
        date: date, // YYYY-MM-DD format
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        '[DevelopmentAPI] Request failed:',
        response.status,
        errorData
      );
      throw new Error(
        `Development API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      '[DevelopmentAPI] Successfully fetched solar data from Java API',
      data
    );

    // Parse Java API response format
    if (data.result !== 1) {
      throw new Error('Java API returned error result');
    }

    const powerValues = data.obj?.pac || [];

    // Filter out null values and convert to numbers
    const cleanPowerValues = powerValues.map((value: any) => {
      if (value === null || value === undefined || isNaN(value)) {
        return 0;
      }
      return Number(value);
    });

    // Generate labels for 5-minute intervals (288 values = 24 hours * 12 intervals/hour)
    const labels = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        labels.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      }
    }

    // Calculate metrics from power data
    const totalGeneration =
      cleanPowerValues.reduce((sum: number, value: number) => sum + value, 0) /
      12; // Convert to kWh (5min intervals)
    const validValues = cleanPowerValues.filter((v: number) => v > 0);
    const maxPower = validValues.length > 0 ? Math.max(...validValues) : 0;

    return {
      chartData: {
        labels: labels.slice(0, cleanPowerValues.length), // Match labels to data length
        datasets: [
          {
            data: cleanPowerValues,
            color: () => '#f59e0b',
            strokeWidth: 2,
          },
        ],
      },
      metrics: {
        todayGeneration: totalGeneration / 1000, // Convert W to kW
        totalGeneration: totalGeneration / 1000, // TODO: Get from API or database
        todayRevenue: (totalGeneration / 1000) * 0.12, // Estimate: 0.12 kr/kWh
        totalRevenue: (totalGeneration / 1000) * 0.12, // TODO: Calculate properly
      },
    };
  } catch (error) {
    console.error('[DevelopmentAPI] Error fetching solar data:', error);
    throw error;
  }
}

/**
 * Check development API health
 */
export async function checkDevelopmentApiHealth(): Promise<boolean> {
  try {
    console.log('[DevelopmentAPI] Checking Java API health...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://localhost:8080/api/growatt/health', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(
      `[DevelopmentAPI] Java API health check: ${response.ok ? '✅' : '❌'}`
    );
    return response.ok;
  } catch (error) {
    console.error('[DevelopmentAPI] Java API health check failed:', error);
    return false;
  }
}
