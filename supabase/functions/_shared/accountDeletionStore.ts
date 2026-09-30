// Supabase-backed AccountDeletionStore. Requires a service-role client; the SQL
// helpers are executable by service_role only
// (migrations/20260930190000_account_deletion.sql).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import type { AccountDeletionStore, MediaObject } from "./accountDeletion.ts";

function fail(step: string, error: unknown): never {
  // Log only the failing step; never tokens, ids or payloads.
  console.error(`delete-account: ${step} failed`);
  throw error instanceof Error ? error : new Error(step);
}

export function supabaseAccountDeletionStore(supabase: SupabaseClient): AccountDeletionStore {
  return {
    async userIdForToken(token) {
      const { data, error } = await supabase.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async mediaOf(authId) {
      const { data, error } = await supabase.rpc("account_deletion_media", {
        target_auth_id: authId,
      });
      if (error) fail("media lookup", error);
      return (data ?? []) as MediaObject[];
    },
    async removeMedia(bucket, names) {
      const { error } = await supabase.storage.from(bucket).remove(names);
      if (error) fail("media removal", error);
    },
    async prepareDeletion(authId) {
      const { error } = await supabase.rpc("prepare_account_deletion", {
        target_auth_id: authId,
      });
      if (error) fail("credential cleanup", error);
    },
    async deleteAuthUser(authId) {
      const { error } = await supabase.auth.admin.deleteUser(authId);
      if (error) fail("auth deletion", error);
    },
  };
}
