import { logInfo, logError, logWarn } from '../services/graylogService';
/**
 * Settings API Service
 * Handles API calls for saving and retrieving user settings to/from backend
 */

import { getDataMode } from './dataConfig';

// Get the correct API URL based on mode
function getApiBaseUrl(): string {
  const dataMode = getDataMode();

  if (dataMode === 'development') {
    return (
      process.env.EXPO_PUBLIC_WEATHER_API_DEVELOPMENT || 'http://localhost:5000'
    );
  } else if (dataMode === 'production') {
    return (
      process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION ||
      'https://weatherapi-sbwb.onrender.com'
    );
  }

  // Default fallback
  return 'https://weatherapi-sbwb.onrender.com';
}

export interface ApiSettingsData {
  growatt?: {
    email: string;
    password: string;
    plantId?: string;
  };
  weather?: {
    apiKey: string;
    stationId: string;
  };
}

export interface ApiSettingsResponse {
  growatt?: {
    email: string;
    plantId: string;
    hasPassword: boolean;
  };
  weather?: {
    stationId: string;
    hasApiKey: boolean;
  };
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    logInfo('Getting auth token...', 'SettingsAPI');
    if (typeof window !== 'undefined') {
      // Web: Use localStorage
      const userInfo = localStorage.getItem('userInfo');
      logInfo('Web - userInfo from localStorage:', 'SettingsAPI', userInfo);
      if (userInfo) {
        const user = JSON.parse(userInfo);
        logInfo('Web - parsed user:', 'SettingsAPI', user);
        logInfo('Web - token:', 'SettingsAPI', user.token);
        return user.token || null;
      }
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const userInfo = await AsyncStorage.getItem('userInfo');
      logInfo('Mobile - userInfo from AsyncStorage:', 'SettingsAPI', userInfo);
      if (userInfo) {
        const user = JSON.parse(userInfo);
        logInfo('Mobile - parsed user:', 'SettingsAPI', user);
        logInfo('Mobile - token:', 'SettingsAPI', user.token);
        return user.token || null;
      }
    }
    logInfo('No token found', 'SettingsAPI');
    return null;
  } catch (error) {
    logError('Error getting auth token:', 'SettingsAPI', error);
    return null;
  }
}

/**
 * Save API settings to backend
 */
export async function saveApiSettings(
  settings: ApiSettingsData
): Promise<void> {
  try {
    logInfo('Saving settings:', 'SettingsAPI', settings);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    const token = await getAuthToken();
    logInfo('Retrieved token:', 'SettingsAPI', token ? `${token.substring(0, 20)}...` : 'null'
    );

    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    headers['Authorization'] = `Bearer ${token}`;

    const apiUrl = `${getApiBaseUrl()}/api/settings/api`;
    logInfo('Making request to:', 'SettingsAPI', apiUrl);
    logInfo('Headers:', 'SettingsAPI', headers);

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings),
    });

    logInfo('Response status:', 'SettingsAPI', response.status);
    logInfo('Response ok:', 'SettingsAPI', response.ok);

    if (!response.ok) {
      const error = await response.text();
      logError('Response error:', 'SettingsAPI', error);
      throw new Error(`Failed to save settings: ${error}`);
    }

    logInfo('✅ Settings saved to backend successfully', 'SettingsAPI');
  } catch (error) {
    logError('❌ Failed to save settings:', 'SettingsAPI', error);
    throw error;
  }
}

/**
 * Save Growatt API settings specifically
 */
export async function saveGrowattApiSettings(settings: {
  growatt: ApiSettingsData['growatt'];
}): Promise<void> {
  return saveApiSettings(settings);
}

/**
 * Save Weather API settings specifically
 */
export async function saveWeatherApiSettings(settings: {
  weather: ApiSettingsData['weather'];
}): Promise<void> {
  return saveApiSettings(settings);
}

/**
 * Get API settings from backend
 */
export async function getApiSettings(): Promise<ApiSettingsResponse | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    const token = await getAuthToken();
    if (!token) {
      logWarn('No authentication token available', 'SettingsAPI');
      return null; // Return null instead of throwing error for graceful degradation
    }
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${getApiBaseUrl()}/api/settings/api`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No settings found
      }
      const error = await response.text();
      throw new Error(`Failed to get settings: ${error}`);
    }

    const data = await response.json();
    logInfo('✅ Settings retrieved from backend successfully', 'SettingsAPI');
    return data;
  } catch (error) {
    logError('❌ Failed to get settings:', 'SettingsAPI', error);
    throw error;
  }
}

/**
 * Clear API settings from backend
 */
export async function clearApiSettings(): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${getApiBaseUrl()}/api/settings/api`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to clear settings: ${error}`);
    }

    logInfo('✅ Settings cleared from backend successfully', 'SettingsAPI');
  } catch (error) {
    logError('❌ Failed to clear settings:', 'SettingsAPI', error);
    throw error;
  }
}

/**
 * Clear Weather API settings specifically
 */
export async function clearWeatherApiSettings(): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${getApiBaseUrl()}/api/settings/api`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        weather: {
          apiKey: '',
          stationId: '',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to clear weather settings: ${error}`);
    }

    logInfo('✅ Weather settings cleared from backend successfully', 'SettingsAPI');
  } catch (error) {
    logError('❌ Failed to clear weather settings:', 'SettingsAPI', error);
    throw error;
  }
}
