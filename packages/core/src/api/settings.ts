// Settings API — per-user integration settings. Secrets (Weather API key, Growatt
// password) go to Vault via the save_user_credentials RPC, never to a plain column.
// Ported from mobile src/services/settingsApiService.ts.
import type { ApiSettingsData, ApiSettingsResponse } from "../types/settings";

import type { CoreApiContext } from "./context";

export function createSettingsApi(ctx: CoreApiContext) {
  const { supabase } = ctx;

  /** Save any subset of Growatt/Weather settings (secrets routed to Vault by the RPC). */
  async function saveApiSettings(settings: ApiSettingsData): Promise<void> {
    const { error } = await supabase.rpc("save_user_credentials", {
      p_weather_station_id: settings.weather?.stationId ?? null,
      p_weather_api_key: settings.weather?.apiKey ?? null,
      p_growatt_email: settings.growatt?.email ?? null,
      p_growatt_password: settings.growatt?.password ?? null,
    });
    if (error) throw new Error(error.message);
  }

  async function saveGrowattApiSettings(settings: {
    growatt: ApiSettingsData["growatt"];
  }): Promise<void> {
    return saveApiSettings(settings);
  }

  async function saveWeatherApiSettings(settings: {
    weather: ApiSettingsData["weather"];
  }): Promise<void> {
    return saveApiSettings(settings);
  }

  /** Read the current user's settings (presence flags, not the secret values). */
  async function getApiSettings(): Promise<ApiSettingsResponse | null> {
    const { data, error } = await supabase
      .from("user_settings")
      .select(
        "growatt_email, growatt_plant_id, growatt_password_secret_id, weather_station_id, weather_api_key_secret_id",
      )
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      growatt: {
        email: data.growatt_email ?? "",
        plantId: data.growatt_plant_id ?? "",
        hasPassword: data.growatt_password_secret_id != null,
      },
      weather: {
        stationId: data.weather_station_id ?? "",
        hasApiKey: data.weather_api_key_secret_id != null,
      },
    };
  }

  /** Clear all integration credentials for the current user. */
  async function clearApiSettings(): Promise<void> {
    const g = await supabase.rpc("clear_user_credentials", { p_kind: "growatt" });
    if (g.error) throw new Error(g.error.message);
    const w = await supabase.rpc("clear_user_credentials", { p_kind: "weather" });
    if (w.error) throw new Error(w.error.message);
  }

  /** Clear just the Weather.com credentials. */
  async function clearWeatherApiSettings(): Promise<void> {
    const { error } = await supabase.rpc("clear_user_credentials", {
      p_kind: "weather",
    });
    if (error) throw new Error(error.message);
  }

  /**
   * Subscribe to live settings/profile changes for the current user (cross-device sync).
   * Returns an unsubscribe function. RLS ensures only the user's own rows arrive.
   */
  function subscribeSettings(onChange: () => void): () => void {
    const channel = supabase
      .channel("settings-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_settings" }, () =>
        onChange(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => onChange())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }

  return {
    saveApiSettings,
    saveGrowattApiSettings,
    saveWeatherApiSettings,
    getApiSettings,
    clearApiSettings,
    clearWeatherApiSettings,
    subscribeSettings,
  };
}

export type SettingsApi = ReturnType<typeof createSettingsApi>;
