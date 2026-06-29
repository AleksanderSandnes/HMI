// Credentials API (compatibility shim). Growatt login happens server-side from
// Vault, so the client never holds the Growatt password.
// Ported from mobile src/services/credentialsService.ts.
import type { GrowattCredentials } from '../types/settings';
import type { CoreApiContext } from './context';

export function createCredentialsApi(ctx: CoreApiContext) {
  const { supabase } = ctx;

  /** Non-secret Growatt identity from settings (password is never returned). */
  async function getGrowattCredentials(): Promise<GrowattCredentials> {
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
  async function storeGrowattCredentials(
    credentials: GrowattCredentials
  ): Promise<void> {
    const { error } = await supabase.rpc('save_user_credentials', {
      p_growatt_email: credentials.account,
      p_growatt_password: credentials.password,
    });
    if (error) throw new Error(error.message);
  }

  /** No-op: there are no client-side credentials to clear (logout keeps Vault data). */
  async function clearStoredCredentials(): Promise<void> {
    /* intentionally empty */
  }

  /** Whether the current user has Growatt credentials configured. */
  async function hasStoredCredentials(): Promise<boolean> {
    const { data } = await supabase
      .from('user_settings')
      .select('growatt_password_secret_id')
      .maybeSingle();
    return data?.growatt_password_secret_id != null;
  }

  return {
    getGrowattCredentials,
    storeGrowattCredentials,
    clearStoredCredentials,
    hasStoredCredentials,
  };
}

export type CredentialsApi = ReturnType<typeof createCredentialsApi>;
