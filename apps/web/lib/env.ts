// Web env resolution. Mirrors the mobile EXPO_PUBLIC_* config as NEXT_PUBLIC_*.
// core never reads process.env — we hand it a CoreEnv built here.
import type { CoreEnv, DataMode } from "@hmi/core";

export const DATA_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_MODE === "production" ? "production" : "development";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xdttfrknoazcqcelieck.supabase.co";

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const RENDER_JAVA_API = "https://growattapi.onrender.com";
export const LOCAL_JAVA_API = "http://localhost:8080";

/**
 * Resolve the Java Growatt service base URL (no trailing /api).
 *
 * `localhost:8080` is only correct for a local `next dev` session running the
 * Java service alongside it — so it's used ONLY when this is a local dev build
 * AND the data mode isn't production. Any deployed build (every Vercel build runs
 * `next build`, so NODE_ENV="production") falls back to the Render service rather
 * than baking in localhost, which the browser can never reach. An explicit
 * NEXT_PUBLIC_JAVA_API always wins.
 */
export function resolveJavaApiBaseUrl(opts: {
  override?: string;
  dataMode: DataMode;
  nodeEnv?: string;
}): string {
  if (opts.override) return opts.override;
  const isLocalDevBuild = opts.nodeEnv !== "production";
  const useLocal = isLocalDevBuild && opts.dataMode !== "production";
  return useLocal ? LOCAL_JAVA_API : RENDER_JAVA_API;
}

export const JAVA_API_BASE_URL = resolveJavaApiBaseUrl({
  override: process.env.NEXT_PUBLIC_JAVA_API,
  dataMode: DATA_MODE,
  nodeEnv: process.env.NODE_ENV,
});

export function coreEnv(): CoreEnv {
  return { dataMode: DATA_MODE, javaApiBaseUrl: JAVA_API_BASE_URL };
}
