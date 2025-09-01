/**
 * Authenticated Weather API Service
 * Handles weather API calls with user authentication
 */

import { getWeatherApiConfig } from './weatherApiConfig';
import { logInfo, logError, logApiCall, logWarn } from './graylogService';

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
    logError('Error getting auth token:', 'WeatherAPI', error);
    logError('Failed to get auth token', 'WeatherAPI', error as Error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(url: string): Promise<any> {
  const startTime = Date.now();
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      logInfo('Making authenticated request to:', 'WeatherAPI', url);
      logInfo('Making authenticated API request', 'WeatherAPI', { url, hasToken: true });
    } else {
      logWarn('No auth token available, making unauthenticated request to:', 'WeatherAPI', url);
      logWarn('Making unauthenticated API request', 'WeatherAPI', { url, hasToken: false });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      logError('Request failed:', 'WeatherAPI', response.status, errorData);
      
      const error = new Error(`Weather API request failed: ${response.status} ${errorData}`);
      logApiCall('GET', url, response.status, duration, error, { errorData });
      throw error;
    }

    const data = await response.json();
    logInfo('Request successful', 'WeatherAPI');
    logApiCall('GET', url, response.status, duration, undefined, { responseSize: JSON.stringify(data).length });
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Request error:', 'WeatherAPI', error);
    logApiCall('GET', url, undefined, duration, error as Error);
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
 * Get daily weather data for a specific date
 */
export async function getDailyWeatherData(date: string): Promise<any> {
  const config = getWeatherApiConfig();
  return await makeAuthenticatedRequest(config.dailyWeatherEndpoint(date));
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
