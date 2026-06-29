import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoreApiContext } from '@hmi/core';
import { coreEnv } from './env';

/**
 * Build a CoreApiContext from the mobile Supabase client so the @hmi/core API
 * factories run unchanged on React Native. Mirrors
 * apps/web/lib/supabase/context.ts — only the env source (EXPO_PUBLIC_*) and the
 * Supabase client construction differ.
 */
export function coreContext(supabase: SupabaseClient): CoreApiContext {
  return {
    supabase,
    getAccessToken: async () =>
      (await supabase.auth.getSession()).data.session?.access_token ?? null,
    getCurrentUserId: async () =>
      (await supabase.auth.getSession()).data.session?.user?.id ?? null,
    env: coreEnv(),
  };
}
