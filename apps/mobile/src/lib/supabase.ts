/**
 * Supabase client for the mobile app — the single source of truth for auth +
 * data access. The session (access + refresh token) is persisted and
 * auto-refreshed by supabase-js using AsyncStorage on native (localStorage on
 * web), so callers read the current token via {@link getAccessToken} rather than
 * a cached copy. Mirrors apps/web/lib/supabase/client.ts (which uses @supabase/ssr
 * cookies); here we use the AsyncStorage adapter instead.
 */
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

/** localStorage on web; AsyncStorage on native. */
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
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
