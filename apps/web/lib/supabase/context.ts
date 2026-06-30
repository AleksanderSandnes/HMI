import type { CoreApiContext } from "@hmi/core";
import type { SupabaseClient } from "@supabase/supabase-js";

import { coreEnv } from "../env";

/**
 * Build a CoreApiContext from a Supabase client so the @hmi/core API factories
 * can run in any web context (browser client, server client, or proxy). Works on
 * both client and server — the caller supplies the appropriate Supabase client.
 */
export function coreContext(supabase: SupabaseClient): CoreApiContext {
  return {
    supabase,
    getAccessToken: async () =>
      (await supabase.auth.getSession()).data.session?.access_token ?? null,
    getCurrentUserId: async () => (await supabase.auth.getSession()).data.session?.user?.id ?? null,
    env: coreEnv(),
  };
}
