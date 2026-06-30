import {
  createAccountApi,
  createAuthApi,
  createCredentialsApi,
  createGrowattApi,
  createNotificationsApi,
  createSettingsApi,
  createWeatherApi,
} from "@hmi/core";
import { useMemo } from "react";

import { coreContext } from "./context";
import { supabase } from "./supabase";

/**
 * Accessor for the @hmi/core API factories, wired to the mobile Supabase client.
 * Mirrors apps/web/lib/hooks/useCore.ts. The Supabase client is a module
 * singleton (see ./supabase), so the factories are built once and memoized.
 */
export function useCore() {
  return useMemo(() => {
    const ctx = coreContext(supabase);
    return {
      supabase,
      auth: createAuthApi(ctx),
      growatt: createGrowattApi(ctx),
      weather: createWeatherApi(ctx),
      account: createAccountApi(ctx),
      settings: createSettingsApi(ctx),
      credentials: createCredentialsApi(ctx),
      notifications: createNotificationsApi(ctx),
    };
  }, []);
}
