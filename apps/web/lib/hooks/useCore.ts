"use client";

import { useMemo } from "react";
import {
  createAccountApi,
  createAuthApi,
  createCredentialsApi,
  createGrowattApi,
  createNotificationsApi,
  createSettingsApi,
  createWeatherApi,
} from "@hmi/core";
import { createClient } from "../supabase/client";
import { coreContext } from "../supabase/context";

/**
 * Client-side accessor for the @hmi/core API factories, wired to the browser
 * Supabase client. Memoized so the factories are built once per component.
 */
export function useCore() {
  return useMemo(() => {
    const supabase = createClient();
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
