/**
 * Authenticated Weather API Service
 * Handles weather API calls with user authentication
 */

import { getWeatherApiConfig } from './weatherApiConfig';

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
    console.error('[WeatherAPI] Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(url: string): Promise<any> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[WeatherAPI] Making authenticated request to:', url);
    } else {
      console.warn(
        '[WeatherAPI] No auth token available, making unauthenticated request to:',
        url
      );
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[WeatherAPI] Request failed:', response.status, errorData);
      throw new Error(
        `Weather API request failed: ${response.status} ${errorData}`
      );
    }

    const data = await response.json();
    console.log('[WeatherAPI] Request successful');
    return data;
  } catch (error) {
    console.error('[WeatherAPI] Request error:', error);
    throw error;
  }
}

/**
 * Get current weather data
 */
export async function getCurrentWeatherData(): Promise<any> {
  const config = getWeatherApiConfig();
  return await makeAuthenticatedRequest(config.currentWeatherEndpoint);
}

/**
 * Get historical weather data for a specific date
 */
export async function getHistoricalWeatherData(date: string): Promise<any> {
  const config = getWeatherApiConfig();
  return await makeAuthenticatedRequest(config.historicalWeatherEndpoint(date));
}

/**
 * Get hourly weather data for a specific date
 */
export async function getHourlyWeatherData(date: string): Promise<any> {
  const config = getWeatherApiConfig();
  return await makeAuthenticatedRequest(config.hourlyWeatherEndpoint(date));
}

/**
 * Get weekly weather data
 */
export async function getWeeklyWeatherData(date?: string): Promise<any> {
  const config = getWeatherApiConfig();
  return await makeAuthenticatedRequest(config.weeklyWeatherEndpoint(date));
}

/**
 * Get hourly weather data for a specific date range (for weekly mode)
 */
export async function getWeeklyHourlyWeatherData(
  startDate: string,
  endDate: string
): Promise<any> {
  const config = getWeatherApiConfig();
  // Use startDate as the date parameter since backend calculates the week from it
  const url = `${config.baseUrl}/api/weather/weekly-hourly/${startDate}`;
  return await makeAuthenticatedRequest(url);
}
