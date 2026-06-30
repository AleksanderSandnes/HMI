import { useCallback } from 'react';
import { useAuth } from './auth';
import { useCore } from './useCore';
import { unregisterPushOnLogout } from '../services/pushNotifications';

/**
 * Sign out, first removing this device's Expo push token from the backend while the
 * session is still valid (so a shared device stops receiving the prior user's pushes).
 * Best-effort — the token cleanup never blocks sign-out.
 */
export function useLogout(): () => Promise<void> {
  const { signOut } = useAuth();
  const { notifications } = useCore();

  return useCallback(async () => {
    await unregisterPushOnLogout(notifications.unregisterPushToken);
    await signOut();
  }, [signOut, notifications]);
}
