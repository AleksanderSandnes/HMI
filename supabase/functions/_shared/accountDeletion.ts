// Deletes the calling user's account: avatar objects, Vault credentials and finally
// the auth user, which cascades to profiles, settings, notifications and health rows.
// Dependencies are injected so the flow is unit-testable without a live project.
import { corsHeaders } from "./cors.ts";

export interface MediaObject {
  bucket_id: string;
  name: string;
}

export interface AccountDeletionStore {
  /** Resolves the verified auth user id for a bearer token, or null when invalid. */
  userIdForToken(token: string): Promise<string | null>;
  mediaOf(authId: string): Promise<MediaObject[]>;
  removeMedia(bucket: string, names: string[]): Promise<void>;
  /** Deletes the user's Vault secrets. */
  prepareDeletion(authId: string): Promise<void>;
  deleteAuthUser(authId: string): Promise<void>;
}

const REMOVE_BATCH = 100;
const CONFIRMATION = "DELETE_MY_ACCOUNT";

function respond(body: string | null, status: number, extra: Record<string, string> = {}) {
  return new Response(body, { status, headers: { ...corsHeaders, ...extra } });
}

function bearer(req: Request): string | null {
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.get("Authorization") ?? "");
  return match ? match[1] : null;
}

async function confirmed(req: Request): Promise<boolean> {
  const type = req.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return false;
  const text = await req.text();
  if (text.length > 1024) return false;
  try {
    return JSON.parse(text)?.confirm === CONFIRMATION;
  } catch {
    return false;
  }
}

export async function handleAccountDeletion(
  req: Request,
  store: AccountDeletionStore,
): Promise<Response> {
  if (req.method === "OPTIONS") return respond("ok", 200);
  if (req.method !== "POST") return respond("method not allowed", 405, { Allow: "POST" });
  const token = bearer(req);
  const authId = token ? await store.userIdForToken(token) : null;
  if (!authId) return respond("unauthorized", 401);
  if (!(await confirmed(req))) return respond("confirmation required", 400);

  // Storage first: if it fails the account still exists and the user can retry.
  const byBucket = new Map<string, string[]>();
  for (const object of await store.mediaOf(authId)) {
    byBucket.set(object.bucket_id, [...(byBucket.get(object.bucket_id) ?? []), object.name]);
  }
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += REMOVE_BATCH) {
      await store.removeMedia(bucket, names.slice(i, i + REMOVE_BATCH));
    }
  }
  await store.prepareDeletion(authId);
  await store.deleteAuthUser(authId);
  return respond(null, 204);
}
