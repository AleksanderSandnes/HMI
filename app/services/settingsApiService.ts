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
    console.log('[SettingsAPI] Getting auth token...');
    if (typeof window !== 'undefined') {
      // Web: Use localStorage
      const userInfo = localStorage.getItem('userInfo');
      console.log('[SettingsAPI] Web - userInfo from localStorage:', userInfo);
      if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('[SettingsAPI] Web - parsed user:', user);
        console.log('[SettingsAPI] Web - token:', user.token);
        return user.token || null;
      }
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const userInfo = await AsyncStorage.getItem('userInfo');
      console.log(
        '[SettingsAPI] Mobile - userInfo from AsyncStorage:',
        userInfo
      );
      if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('[SettingsAPI] Mobile - parsed user:', user);
        console.log('[SettingsAPI] Mobile - token:', user.token);
        return user.token || null;
      }
    }
    console.log('[SettingsAPI] No token found');
    return null;
  } catch (error) {
    console.error('[SettingsAPI] Error getting auth token:', error);
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
    console.log('[SettingsAPI] Saving settings:', settings);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    const token = await getAuthToken();
    console.log(
      '[SettingsAPI] Retrieved token:',
      token ? `${token.substring(0, 20)}...` : 'null'
    );

    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    headers['Authorization'] = `Bearer ${token}`;

    const apiUrl = `${getApiBaseUrl()}/api/settings/api`;
    console.log('[SettingsAPI] Making request to:', apiUrl);
    console.log('[SettingsAPI] Headers:', headers);

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings),
    });

    console.log('[SettingsAPI] Response status:', response.status);
    console.log('[SettingsAPI] Response ok:', response.ok);

    if (!response.ok) {
      const error = await response.text();
      console.error('[SettingsAPI] Response error:', error);
      throw new Error(`Failed to save settings: ${error}`);
    }

    console.log('[SettingsAPI] ✅ Settings saved to backend successfully');
  } catch (error) {
    console.error('[SettingsAPI] ❌ Failed to save settings:', error);
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
      console.warn('[SettingsAPI] No authentication token available');
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
    console.log(
      '[SettingsAPI] ✅ Settings retrieved from backend successfully'
    );
    // The backend wraps the payload as { success, apiSettings: {...} }. Unwrap it
    // here so callers get the flat { growatt, weather } shape (ApiSettingsResponse).
    // Fall back to the raw body in case an older endpoint returns it directly.
    return (data?.apiSettings ?? data) as ApiSettingsResponse;
  } catch (error) {
    console.error('[SettingsAPI] ❌ Failed to get settings:', error);
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

    console.log('[SettingsAPI] ✅ Settings cleared from backend successfully');
  } catch (error) {
    console.error('[SettingsAPI] ❌ Failed to clear settings:', error);
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

    console.log(
      '[SettingsAPI] ✅ Weather settings cleared from backend successfully'
    );
  } catch (error) {
    console.error('[SettingsAPI] ❌ Failed to clear weather settings:', error);
    throw error;
  }
}
