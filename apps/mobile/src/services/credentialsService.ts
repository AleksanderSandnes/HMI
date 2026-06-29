/**
 * Credentials Service (compatibility shim).
 *
 * Growatt login now happens server-side from Vault, so the frontend no longer holds the
 * Growatt password. These helpers remain for call-site compatibility:
 *  - storeGrowattCredentials -> routes to the `save_user_credentials` Vault RPC
 *  - getGrowattCredentials   -> returns the (non-secret) email/plant from settings
 *  - clearStoredCredentials  -> no-op (logout must NOT wipe saved Vault credentials)
 *  - hasStoredCredentials    -> whether Growatt is configured for the current user
 */
import { supabase } from './supabaseClient';

export interface GrowattCredentials {
  account: string;
  password: string;
  plantId?: string;
}

/** Non-secret Growatt identity from settings (password is never returned to the client). */
export async function getGrowattCredentials(): Promise<GrowattCredentials> {
  const { data } = await supabase
    .from('user_settings')
    .select('growatt_email, growatt_plant_id')
    .maybeSingle();
  return {
    account: data?.growatt_email ?? '',
    password: '',
    plantId: data?.growatt_plant_id ?? undefined,
  };
}

/** Persist Growatt credentials to Vault + settings via the RPC. */
export async function storeGrowattCredentials(
  credentials: GrowattCredentials
): Promise<void> {
  const { error } = await supabase.rpc('save_user_credentials', {
    p_growatt_email: credentials.account,
    p_growatt_password: credentials.password,
  });
  if (error) throw new Error(error.message);
}

/** No-op: there are no client-side credentials to clear (logout keeps Vault data). */
export async function clearStoredCredentials(): Promise<void> {
  /* intentionally empty */
}

/** Whether the current user has Growatt credentials configured. */
export async function hasStoredCredentials(): Promise<boolean> {
  const { data } = await supabase
    .from('user_settings')
    .select('growatt_password_secret_id')
    .maybeSingle();
  return data?.growatt_password_secret_id != null;
}
