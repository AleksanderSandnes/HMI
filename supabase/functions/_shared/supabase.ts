// Shared Supabase clients + per-user credential resolution for the weather Edge Functions.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Service-role client — bypasses RLS. Used for Vault reads and cache upserts. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Resolve the calling user's auth id from their bearer token. Throws if unauthenticated. */
export async function requireUser(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user) throw new Error("Invalid or expired session");
  return user.id;
}

export interface WeatherCredentials {
  stationId: string;
  apiKey: string;
}

/**
 * Resolve a user's Weather.com station + API key. The station id is stored in
 * user_settings; the API key lives in Vault (only its uuid is stored). Reads the secret
 * via the service-role-only get_vault_secret() RPC.
 */
export async function getWeatherCredentials(
  admin: SupabaseClient,
  authId: string,
): Promise<WeatherCredentials> {
  const { data: settings, error } = await admin
    .from("user_settings")
    .select("weather_station_id, weather_api_key_secret_id")
    .eq("auth_id", authId)
    .single();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);

  const stationId = settings?.weather_station_id;
  const secretId = settings?.weather_api_key_secret_id;
  if (!stationId || !secretId) {
    throw new Error("Weather API credentials not configured. Set them up in Settings.");
  }

  const { data: apiKey, error: secretErr } = await admin.rpc("get_vault_secret", {
    p_secret_id: secretId,
  });
  if (secretErr || !apiKey) {
    throw new Error("Failed to read Weather API key from Vault.");
  }
  return { stationId, apiKey: apiKey as string };
}

/** Append an integration_health row (best-effort; never throws). */
export async function recordHealth(
  admin: SupabaseClient,
  authId: string,
  source: "growatt" | "weather",
  status: "ok" | "error",
  detail?: string,
): Promise<void> {
  try {
    await admin
      .from("integration_health")
      .insert({ auth_id: authId, source, status, detail: detail ?? null });
  } catch (_e) {
    // health recording must never break the caller
  }
}
