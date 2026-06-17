import { Platform } from 'react-native';
import { unregisterPushToken } from './notificationsApiService';

/**
 * Device-side Expo push token helpers.
 *
 * The token obtained at registration is cached locally so that, on logout, we can tell the
 * backend to forget it — otherwise this physical device would keep receiving push
 * notifications for an account that is no longer signed in (a real problem on shared
 * devices). Push is native-only, so everything here no-ops on web.
 */

const STORAGE_KEY = 'expoPushToken';

function asyncStorage() {
  return require('@react-native-async-storage/async-storage').default;
}

export async function storePushToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await asyncStorage().setItem(STORAGE_KEY, token);
  } catch {
    /* ignore storage errors */
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await asyncStorage().getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await asyncStorage().removeItem(STORAGE_KEY);
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Remove this device's push token from the backend on logout. Best-effort and never throws.
 * MUST be called while the user is still authenticated (before auth state is cleared), as
 * the request needs the user's bearer token.
 */
export async function unregisterPushOnLogout(): Promise<void> {
  if (Platform.OS === 'web') return;
  const token = await getStoredPushToken();
  if (!token) return;
  try {
    await unregisterPushToken(token);
  } catch {
    /* delivery isn't critical — clear locally regardless */
  }
  await clearStoredPushToken();
}
