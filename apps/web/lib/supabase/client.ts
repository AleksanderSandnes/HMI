"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../env";

let browserClient: SupabaseClient | undefined;

/**
 * Browser Supabase client (cookie session via @supabase/ssr). Cached as a module
 * singleton to avoid multiple GoTrueClient instances across components.
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
