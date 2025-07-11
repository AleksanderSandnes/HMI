/**
 * Account API Service
 * Handles API calls for user account management
 */

import { getDataMode } from './dataConfig';

// Get the correct API URL based on mode
function getApiBaseUrl(): string {
  // For user account management, always use localhost in development
  // Since user data should always be handled by the local backend
  return 'http://localhost:5000';
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
    console.error('[AccountAPI] Error getting auth token:', error);
    return null;
  }
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  username: string;
  email: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Get user profile data
 */
export async function getUserProfile(): Promise<UserProfile> {
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

    const apiUrl = `${getApiBaseUrl()}/api/user/account`;
    console.log('[AccountAPI] Making request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    console.log('[AccountAPI] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      const errorText = await response.text();
      console.error('[AccountAPI] Error response:', errorText);
      throw new Error(
        `Failed to get profile: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[AccountAPI] ✅ Profile retrieved successfully');
    return data.user;
  } catch (error) {
    console.error('[AccountAPI] ❌ Failed to get profile:', error);
    throw error;
  }
}

/**
 * Update user profile (username, email)
 */
export async function updateUserProfile(
  profileData: UpdateProfileData
): Promise<UserProfile> {
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

    const response = await fetch(
      `${getApiBaseUrl()}/api/user/account/profile`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    const data = await response.json();
    console.log('[AccountAPI] ✅ Profile updated successfully');
    return data.user;
  } catch (error) {
    console.error('[AccountAPI] ❌ Failed to update profile:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  passwordData: UpdatePasswordData
): Promise<void> {
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

    const response = await fetch(
      `${getApiBaseUrl()}/api/user/account/password`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(passwordData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update password');
    }

    console.log('[AccountAPI] ✅ Password updated successfully');
  } catch (error) {
    console.error('[AccountAPI] ❌ Failed to update password:', error);
    throw error;
  }
}
