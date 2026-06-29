/**
 * Supabase client — the single source of truth for auth + data access on the frontend.
 *
 * Replaces the hand-rolled JWT/`userInfo.token` flow. The session (access + refresh token)
 * is persisted and auto-refreshed by supabase-js using a platform storage adapter
 * (localStorage on web, AsyncStorage on native), so callers should always read the current
 * token via {@link getAccessToken} rather than a cached copy.
 */
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://xdttfrknoazcqcelieck.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/** localStorage on web; AsyncStorage on native (lazy-required so web bundles stay clean). */
function storageAdapter() {
  if (Platform.OS === 'web') {
    return undefined; // supabase-js defaults to localStorage on web
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-async-storage/async-storage').default;
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: storageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

/** Current access token (Supabase JWT), or null if signed out. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Current auth user id (auth.uid), or null if signed out. */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
