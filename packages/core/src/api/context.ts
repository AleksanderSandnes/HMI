// The dependency-injection contract for all core API factories. Each app builds
// a CoreApiContext from its own Supabase client + session accessors + env, so the
// shared API logic stays framework-agnostic (no react-native, no next, no process.env).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoreEnv } from '../env';

export interface CoreApiContext {
  /** App-provided Supabase client (RN AsyncStorage on mobile; @supabase/ssr on web). */
  supabase: SupabaseClient;
  /** Current Supabase access token (JWT), or null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** Current auth user id, or null when signed out. */
  getCurrentUserId: () => Promise<string | null>;
  /** Resolved environment (data mode + Java API base URL). */
  env: CoreEnv;
}
