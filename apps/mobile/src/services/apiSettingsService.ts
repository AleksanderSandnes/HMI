/**
 * API Settings Service (Growatt-focused) — backed by Supabase. Sensitive values route to
 * Vault via the `save_user_credentials` RPC; the Growatt plant id is derived server-side at
 * login and is no longer collected.
 */
import { supabase } from './supabaseClient';

interface GrowattApiSettings {
  email: string;
  plantId: string;
  hasPassword: boolean;
}

interface UpdateApiSettingsRequest {
  growatt: {
    email: string;
    password?: string;
    plantId?: string; // ignored (derived server-side)
  };
}

/** Get the current user's Growatt settings (presence flags, not the secret). */
export async function getApiSettings(): Promise<GrowattApiSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('growatt_email, growatt_plant_id, growatt_password_secret_id')
      .maybeSingle();
    if (error || !data) return null;
    if (!data.growatt_email && !data.growatt_password_secret_id) return null;
    return {
      email: data.growatt_email ?? '',
      plantId: data.growatt_plant_id ?? '',
      hasPassword: data.growatt_password_secret_id != null,
    };
  } catch (error) {
    console.error('[ApiSettingsService] Error fetching API settings:', error);
    return null;
  }
}

/** Update the current user's Growatt credentials. */
export async function updateApiSettings(
  settings: UpdateApiSettingsRequest
): Promise<boolean> {
  const { error } = await supabase.rpc('save_user_credentials', {
    p_growatt_email: settings.growatt.email,
    p_growatt_password: settings.growatt.password ?? null,
  });
  if (error) throw new Error(error.message);
  return true;
}

/** Clear the current user's Growatt credentials. */
export async function clearApiSettings(): Promise<boolean> {
  const { error } = await supabase.rpc('clear_user_credentials', {
    p_kind: 'growatt',
  });
  if (error) throw new Error(error.message);
  return true;
}
