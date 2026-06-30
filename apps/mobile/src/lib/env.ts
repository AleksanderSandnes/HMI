// Mobile env resolution. Mirrors apps/web/lib/env.ts but reads EXPO_PUBLIC_*
// and uses the React Native __DEV__ flag. @hmi/core never reads process.env —
// we hand it a CoreEnv built here.
import type { CoreEnv, DataMode } from "@hmi/core";

export const DATA_MODE: DataMode =
  process.env.EXPO_PUBLIC_DATA_MODE === "production" ? "production" : "development";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://xdttfrknoazcqcelieck.supabase.co";

export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const RENDER_JAVA_API = "https://growattapi.onrender.com";
export const LOCAL_JAVA_API = "http://localhost:8080";

/**
 * Resolve the Java Growatt service base URL (no trailing /api — core appends the
 * /api/growatt/* paths). `localhost:8080` is only reachable from a local dev
 * session running the Java service alongside Metro, so it is used ONLY for a
 * local dev build whose data mode isn't production. Any installed/store build
 * (where __DEV__ is false) falls back to the Render service rather than baking in
 * localhost, which a device can never reach. An explicit EXPO_PUBLIC_JAVA_API
 * always wins.
 */
export function resolveJavaApiBaseUrl(opts: {
  override?: string;
  dataMode: DataMode;
  isDev: boolean;
}): string {
  if (opts.override) return opts.override;
  const useLocal = opts.isDev && opts.dataMode !== "production";
  return useLocal ? LOCAL_JAVA_API : RENDER_JAVA_API;
}

export const JAVA_API_BASE_URL = resolveJavaApiBaseUrl({
  override: process.env.EXPO_PUBLIC_JAVA_API,
  dataMode: DATA_MODE,
  isDev: typeof __DEV__ !== "undefined" ? __DEV__ : false,
});

export function coreEnv(): CoreEnv {
  return { dataMode: DATA_MODE, javaApiBaseUrl: JAVA_API_BASE_URL };
}
