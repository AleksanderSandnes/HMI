import { logInfo, logError, logWarn } from '../services/graylogService';
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

  logInfo('Getting Growatt credentials for ${dataMode} mode', 'CredentialsService');

  // Try to get from user settings first (stored in localStorage or AsyncStorage)
  try {
    const storedCredentials = await getUserStoredCredentials();
    if (
      storedCredentials?.growatt?.account &&
      storedCredentials?.growatt?.password
    ) {
      logInfo('✅ Using user-stored credentials', 'CredentialsService');
      return {
        account: storedCredentials.growatt.account,
        password: storedCredentials.growatt.password,
        plantId: storedCredentials.growatt.plantId,
      };
    }
  } catch (error) {
    logWarn('Could not retrieve user-stored credentials:', 'CredentialsService', error);
  }

  // Only use environment variables in development mode
  if (dataMode === 'development') {
    const envAccount = process.env.EXPO_PUBLIC_GROWATT_USERNAME;
    const envPassword = process.env.EXPO_PUBLIC_GROWATT_PASSWORD;
    const envPlantId = process.env.EXPO_PUBLIC_GROWATT_PLANT_ID;

    if (envAccount && envPassword) {
      logInfo('⚠️ Using environment variable credentials (development mode only)', 'CredentialsService');
      return {
        account: envAccount,
        password: envPassword,
        plantId: envPlantId,
      };
    }
  }

  // No credentials available
  logError('❌ No Growatt credentials available', 'CredentialsService');
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

    if (typeof window !== 'undefined') {
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

    logInfo('✅ Growatt credentials stored successfully', 'CredentialsService');
  } catch (error) {
    logError('❌ Failed to store credentials:', 'CredentialsService', error);
    throw new Error('Failed to store credentials');
  }
}

/**
 * Get user-stored credentials from local storage
 */
async function getUserStoredCredentials(): Promise<any> {
  try {
    let credentialsString: string | null = null;

    if (typeof window !== 'undefined') {
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
    logWarn('Error reading stored credentials:', 'CredentialsService', error);
    return null;
  }
}

/**
 * Clear stored credentials
 */
export async function clearStoredCredentials(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      // Web: Clear localStorage
      localStorage.removeItem('userCredentials');
    } else {
      // React Native: Clear AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('userCredentials');
    }

    logInfo('✅ Stored credentials cleared', 'CredentialsService');
  } catch (error) {
    logError('❌ Failed to clear credentials:', 'CredentialsService', error);
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
