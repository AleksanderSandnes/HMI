/**
 * Settings service — persists per-user integration settings to Supabase. Sensitive values
 * (Weather.com API key, Growatt password) go into Vault via the `save_user_credentials`
 * RPC and are never stored in a plain column or on the client. The Growatt plant id is no
 * longer collected: the Java service derives it from the server-side Growatt login.
 */
import { supabase } from './supabaseClient';

export interface ApiSettingsData {
  growatt?: {
    email: string;
    password: string;
    plantId?: string; // accepted for back-compat but ignored (derived server-side)
  };
  weather?: {
    apiKey: string;
    stationId: string;
  };
}

export interface ApiSettingsResponse {
  growatt?: {
    email: string;
    plantId: string;
    hasPassword: boolean;
  };
  weather?: {
    stationId: string;
    hasApiKey: boolean;
  };
}

/** Save any subset of Growatt/Weather settings (secrets routed to Vault by the RPC). */
export async function saveApiSettings(settings: ApiSettingsData): Promise<void> {
  const { error } = await supabase.rpc('save_user_credentials', {
    p_weather_station_id: settings.weather?.stationId ?? null,
    p_weather_api_key: settings.weather?.apiKey ?? null,
    p_growatt_email: settings.growatt?.email ?? null,
    p_growatt_password: settings.growatt?.password ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function saveGrowattApiSettings(settings: {
  growatt: ApiSettingsData['growatt'];
}): Promise<void> {
  return saveApiSettings(settings);
}

export async function saveWeatherApiSettings(settings: {
  weather: ApiSettingsData['weather'];
}): Promise<void> {
  return saveApiSettings(settings);
}

/** Read the current user's settings (presence flags, not the secret values). */
export async function getApiSettings(): Promise<ApiSettingsResponse | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select(
      'growatt_email, growatt_plant_id, growatt_password_secret_id, weather_station_id, weather_api_key_secret_id'
    )
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    growatt: {
      email: data.growatt_email ?? '',
      plantId: data.growatt_plant_id ?? '',
      hasPassword: data.growatt_password_secret_id != null,
    },
    weather: {
      stationId: data.weather_station_id ?? '',
      hasApiKey: data.weather_api_key_secret_id != null,
    },
  };
}

/** Clear all integration credentials for the current user. */
export async function clearApiSettings(): Promise<void> {
  const g = await supabase.rpc('clear_user_credentials', { p_kind: 'growatt' });
  if (g.error) throw new Error(g.error.message);
  const w = await supabase.rpc('clear_user_credentials', { p_kind: 'weather' });
  if (w.error) throw new Error(w.error.message);
}

/** Clear just the Weather.com credentials. */
export async function clearWeatherApiSettings(): Promise<void> {
  const { error } = await supabase.rpc('clear_user_credentials', {
    p_kind: 'weather',
  });
  if (error) throw new Error(error.message);
}
