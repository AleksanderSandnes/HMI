// delete-account — self-service account deletion for signed-in web and mobile users.
// Gateway JWT verification stays on; the token is re-validated with Auth so only the
// caller's own account can be deleted.
import { handleAccountDeletion } from "../_shared/accountDeletion.ts";
import { supabaseAccountDeletionStore } from "../_shared/accountDeletionStore.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  try {
    return await handleAccountDeletion(req, supabaseAccountDeletionStore(adminClient()));
  } catch {
    return new Response("account deletion failed", { status: 500, headers: corsHeaders });
  }
});
