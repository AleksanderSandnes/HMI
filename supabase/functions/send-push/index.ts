// send-push — unified Expo push sender. Two invocation shapes:
//   1) Database webhook on notifications INSERT: { type:'INSERT', record:{ auth_id, title, message, type } }
//      -> looks up the user's expo_push_tokens and pushes. This is how BOTH the weather
//         Edge Functions and the Java solar job deliver push: just insert a notification row.
//   2) Direct: { tokens: string[], title, body, data }.
// Port of backend/weatherAPI/services/notificationService.sendExpoPush. Never throws fatally.
import { json } from "../_shared/cors.ts";
import { authorizeJob } from "../_shared/authorize.ts";
import { PushInputError, readPushRequest } from "../_shared/pushInput.ts";
import { adminClient } from "../_shared/supabase.ts";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

const isExpoPushToken = (t: unknown): t is string =>
  typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  const valid = tokens.filter(isExpoPushToken);
  if (valid.length === 0) return { sent: 0 };

  const messages = valid.map((to) => ({ to, title, body, data, sound: "default" }));
  const res = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
  return { sent: valid.length, expoStatus: res.status };
}

Deno.serve(async (req: Request) => {
  const denied = authorizeJob(req);
  if (denied) return denied;
  try {
    const payload = await readPushRequest(req);

    // Shape 1: database webhook on notifications INSERT.
    if (payload.kind === "notification") {
      const admin = adminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("expo_push_tokens")
        .eq("auth_id", payload.authId)
        .maybeSingle();
      const tokens: string[] = profile?.expo_push_tokens ?? [];
      const result = await sendExpoPush(tokens, payload.title, payload.body, {
        type: payload.type,
        notificationId: payload.id,
      });
      return json(result);
    }

    // Shape 2: direct invocation.
    const { tokens, title, body, data } = payload;
    const result = await sendExpoPush(tokens, title, body, data);
    return json(result);
  } catch (error) {
    if (error instanceof PushInputError)
      return json({ error: "Invalid push request" }, error.status);
    return json({ error: "Push delivery failed" }, 500);
  }
});
