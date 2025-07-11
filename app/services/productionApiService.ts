/**
 * Production API Service
 * Handles communication with the production API hosted on render.com
 */

import { getApiEndpoint } from './dataConfig';

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
    console.error('[ProductionAPI] Error getting auth token:', error);
    return null;
  }
}

export interface ProductionSolarData {
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
 * Fetch solar data from production API
 */
export async function fetchProductionSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<ProductionSolarData> {
  const apiEndpoint = getApiEndpoint();

  console.log(`[ProductionAPI] Fetching ${timespan} data from ${apiEndpoint}`);

  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[ProductionAPI] Making authenticated request');
    } else {
      console.warn('[ProductionAPI] No auth token available');
    }

    const response = await fetch(`${apiEndpoint}/solar/daily/${date}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        '[ProductionAPI] Request failed:',
        response.status,
        errorData
      );
      throw new Error(
        `Production API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[ProductionAPI] Successfully fetched solar data');

    return {
      chartData: {
        labels: data.labels || [],
        datasets: [
          {
            data: data.values || [],
            color: () => '#10b981',
            strokeWidth: 2,
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
    console.error('[ProductionAPI] Error fetching solar data:', error);
    throw error;
  }
}

/**
 * Get production API health status
 */
export async function checkProductionApiHealth(): Promise<boolean> {
  try {
    const apiEndpoint = getApiEndpoint();

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    const fetchPromise = fetch(`${apiEndpoint}/health`, {
      method: 'GET',
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    return response.ok;
  } catch (error) {
    console.log('[ProductionAPI] Health check failed:', error);
    return false;
  }
}
