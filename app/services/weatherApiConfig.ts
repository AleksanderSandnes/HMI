/**
 * Weather API Configuration Service
 * Manages weather API endpoints based on data mode
 */

import { getDataMode } from './dataConfig';

export interface WeatherApiConfig {
  baseUrl: string;
  currentWeatherEndpoint: string;
  historicalWeatherEndpoint: (date: string) => string;
  hourlyWeatherEndpoint: (date: string) => string;
  dailyWeatherEndpoint: (date: string) => string;
  weeklyWeatherEndpoint: (date?: string) => string;
}

/**
 * Get weather API configuration based on current data mode
 */
export function getWeatherApiConfig(): WeatherApiConfig {
  const dataMode = getDataMode();
  let baseUrl = 'http://localhost:5000'; // Development default

  if (dataMode === 'production') {
    baseUrl =
      process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION ||
      'https://weatherapi-sbwb.onrender.com';
  } else if (dataMode === 'development') {
    baseUrl =
      process.env.EXPO_PUBLIC_WEATHER_API_DEVELOPMENT ||
      'http://localhost:5000';
  }

  console.log(
    `[WeatherApiConfig] Using weather API in ${dataMode} mode: ${baseUrl}`
  );

  return {
    baseUrl,
    currentWeatherEndpoint: `${baseUrl}/api/weather/current`,
    historicalWeatherEndpoint: (date: string) =>
      `${baseUrl}/api/weather/all/${date}`,
    hourlyWeatherEndpoint: (date: string) =>
      `${baseUrl}/api/weather/hourly/${date}`,
    dailyWeatherEndpoint: (date: string) =>
      `${baseUrl}/api/weather/daily/${date}`,
    // Updated weekly endpoint to support specific date-based week calculation
    weeklyWeatherEndpoint: (date?: string) =>
      date
        ? `${baseUrl}/api/weather/weekly-hourly/${date}`
        : `${baseUrl}/api/weather/weekly`,
  };
}

/**
 * Get weather endpoint based on time range
 */
export function getWeatherEndpointByTimeRange(
  timeRange: string,
  date?: string
): string {
  const config = getWeatherApiConfig();

  switch (timeRange) {
    case 'hourly':
      return date
        ? config.hourlyWeatherEndpoint(date)
        : config.historicalWeatherEndpoint(date || '');
    case 'daily':
      return date
        ? config.dailyWeatherEndpoint(date)
        : config.historicalWeatherEndpoint(date || '');
    case 'weekly':
      return config.weeklyWeatherEndpoint(date);
    default:
      return date
        ? config.historicalWeatherEndpoint(date)
        : config.currentWeatherEndpoint;
  }
}

/**
 * Get current weather endpoint
 */
export function getCurrentWeatherEndpoint(): string {
  return getWeatherApiConfig().currentWeatherEndpoint;
}

/**
 * Get historical weather endpoint for a specific date
 */
export function getHistoricalWeatherEndpoint(date: string): string {
  return getWeatherApiConfig().historicalWeatherEndpoint(date);
}
