// Web env resolution. Mirrors the mobile EXPO_PUBLIC_* config as NEXT_PUBLIC_*.
// core never reads process.env — we hand it a CoreEnv built here.
import type { CoreEnv, DataMode } from "@hmi/core";

export const DATA_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_MODE === "production"
    ? "production"
    : "development";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xdttfrknoazcqcelieck.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Resolved Java Growatt service base URL (no trailing /api).
 *
 * In development with NEXT_PUBLIC_JAVA_API unset this is http://localhost:8080, so the
 * local Java service must be running (`cd backend/growattAPI && mvn spring-boot:run`) or
 * every /api/growatt/* call fails and Solar/Dashboard show no data. Set NEXT_PUBLIC_JAVA_API
 * to https://growattapi.onrender.com to use the deployed backend instead.
 */
export const JAVA_API_BASE_URL =
  DATA_MODE === "production"
    ? process.env.NEXT_PUBLIC_JAVA_API || "https://growattapi.onrender.com"
    : process.env.NEXT_PUBLIC_JAVA_API || "http://localhost:8080";

export function coreEnv(): CoreEnv {
  return { dataMode: DATA_MODE, javaApiBaseUrl: JAVA_API_BASE_URL };
}
