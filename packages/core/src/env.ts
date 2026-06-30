// Platform-agnostic environment contract. Each app resolves its own env vars
// (EXPO_PUBLIC_* on mobile, NEXT_PUBLIC_* on web) and passes a CoreEnv into the
// API factories, so core never reads process.env directly.

export type DataMode = "production" | "development";

export interface CoreEnv {
  /** Selected data mode (build-time on both platforms). */
  dataMode: DataMode;
  /** Resolved base URL for the Java Growatt service (no trailing /api). */
  javaApiBaseUrl: string;
}
