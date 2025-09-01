import { logInfo, logError, logWarn } from '../services/graylogService';
/**
 * API Settings Service
 * Handles communication with backend for API settings management
 */

interface GrowattApiSettings {
  email: string;
  plantId: string;
  hasPassword: boolean;
}

interface ApiSettingsResponse {
  success: boolean;
  apiSettings?: {
    growatt: GrowattApiSettings;
  };
  message?: string;
}

interface UpdateApiSettingsRequest {
  growatt: {
    email: string;
    password?: string;
    plantId?: string;
  };
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get API settings from backend
 */
export async function getApiSettings(): Promise<GrowattApiSettings | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/api`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch API settings: ${response.status}`);
    }

    const data: ApiSettingsResponse = await response.json();

    if (data.success && data.apiSettings?.growatt) {
      return data.apiSettings.growatt;
    }

    return null;
  } catch (error) {
    logError('Error fetching API settings:', 'ApiSettingsService', error);
    return null;
  }
}

/**
 * Update API settings in backend
 */
export async function updateApiSettings(
  settings: UpdateApiSettingsRequest
): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/api`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to update API settings: ${response.status}`
      );
    }

    const data: ApiSettingsResponse = await response.json();
    return data.success;
  } catch (error) {
    logError('Error updating API settings:', 'ApiSettingsService', error);
    throw error;
  }
}

/**
 * Clear API settings in backend
 */
export async function clearApiSettings(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/api`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to clear API settings: ${response.status}`);
    }

    const data: ApiSettingsResponse = await response.json();
    return data.success;
  } catch (error) {
    logError('Error clearing API settings:', 'ApiSettingsService', error);
    throw error;
  }
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      // Web: Use localStorage
      return localStorage.getItem('authToken');
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('authToken');
    }
  } catch (error) {
    logError('Error getting auth token:', 'ApiSettingsService', error);
    return null;
  }
}
