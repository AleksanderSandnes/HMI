/**
 * Credentials Service
 * Manages secure credential retrieval from user settings or environment variables
 */

import { getDataMode } from './dataConfig';

export interface GrowattCredentials {
  account: string;
  password: string;
  plantId?: string;
}

/**
 * Get Growatt credentials from user settings or environment variables
 * Priority: User Settings > Environment Variables (dev mode only) > Error
 */
export async function getGrowattCredentials(): Promise<GrowattCredentials> {
  const dataMode = getDataMode();

  console.log(
    `[CredentialsService] Getting Growatt credentials for ${dataMode} mode`
  );

  // Try to get from user settings first (stored in localStorage or AsyncStorage)
  try {
    const storedCredentials = await getUserStoredCredentials();
    if (
      storedCredentials?.growatt?.account &&
      storedCredentials?.growatt?.password
    ) {
      console.log('[CredentialsService] ✅ Using user-stored credentials');
      return {
        account: storedCredentials.growatt.account,
        password: storedCredentials.growatt.password,
        plantId: storedCredentials.growatt.plantId,
      };
    }
  } catch (error) {
    console.warn(
      '[CredentialsService] Could not retrieve user-stored credentials:',
      error
    );
  }

  // Only use environment variables in development mode
  if (dataMode === 'development') {
    const envAccount = process.env.EXPO_PUBLIC_GROWATT_USERNAME;
    const envPassword = process.env.EXPO_PUBLIC_GROWATT_PASSWORD;
    const envPlantId = process.env.EXPO_PUBLIC_GROWATT_PLANT_ID;

    if (envAccount && envPassword) {
      console.log(
        '[CredentialsService] ⚠️ Using environment variable credentials (development mode only)'
      );
      return {
        account: envAccount,
        password: envPassword,
        plantId: envPlantId,
      };
    }
  }

  // No credentials available
  console.error('[CredentialsService] ❌ No Growatt credentials available');
  throw new Error(
    dataMode === 'development'
      ? 'No Growatt credentials available. Please set them in Settings or environment variables.'
      : 'No Growatt credentials available. Please set them in Settings > API Credentials.'
  );
}

/**
 * Store Growatt credentials in user settings
 */
export async function storeGrowattCredentials(
  credentials: GrowattCredentials
): Promise<void> {
  try {
    const existingSettings = (await getUserStoredCredentials()) || {};
    const updatedSettings = {
      ...existingSettings,
      growatt: {
        account: credentials.account,
        password: credentials.password,
        plantId: credentials.plantId,
      },
    };

    if (typeof localStorage !== 'undefined') {
      // Web: Use localStorage
      localStorage.setItem('userCredentials', JSON.stringify(updatedSettings));
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(
        'userCredentials',
        JSON.stringify(updatedSettings)
      );
    }

    console.log(
      '[CredentialsService] ✅ Growatt credentials stored successfully'
    );
  } catch (error) {
    console.error(
      '[CredentialsService] ❌ Failed to store credentials:',
      error
    );
    throw new Error('Failed to store credentials');
  }
}

/**
 * Get user-stored credentials from local storage
 */
async function getUserStoredCredentials(): Promise<any> {
  try {
    let credentialsString: string | null = null;

    if (typeof localStorage !== 'undefined') {
      // Web: Use localStorage
      credentialsString = localStorage.getItem('userCredentials');
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      credentialsString = await AsyncStorage.getItem('userCredentials');
    }

    if (credentialsString) {
      return JSON.parse(credentialsString);
    }

    return null;
  } catch (error) {
    console.warn(
      '[CredentialsService] Error reading stored credentials:',
      error
    );
    return null;
  }
}

/**
 * Clear stored credentials
 */
export async function clearStoredCredentials(): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      // Web: Clear localStorage
      localStorage.removeItem('userCredentials');
    } else {
      // React Native: Clear AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('userCredentials');
    }

    console.log('[CredentialsService] ✅ Stored credentials cleared');
  } catch (error) {
    console.error(
      '[CredentialsService] ❌ Failed to clear credentials:',
      error
    );
  }
}

/**
 * Check if credentials are available
 */
export async function hasStoredCredentials(): Promise<boolean> {
  try {
    const credentials = await getUserStoredCredentials();
    return !!(credentials?.growatt?.account && credentials?.growatt?.password);
  } catch (error) {
    return false;
  }
}
