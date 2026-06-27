// send-push — unified Expo push sender. Two invocation shapes:
//   1) Database webhook on notifications INSERT: { type:'INSERT', record:{ auth_id, title, message, type } }
//      -> looks up the user's expo_push_tokens and pushes. This is how BOTH the weather
//         Edge Functions and the Java solar job deliver push: just insert a notification row.
//   2) Direct: { tokens: string[], title, body, data }.
// Port of backend/weatherAPI/services/notificationService.sendExpoPush. Never throws fatally.
import { json } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

const isExpoPushToken = (t: unknown): t is string =>
  typeof t === 'string' &&
  (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  const valid = tokens.filter(isExpoPushToken);
  if (valid.length === 0) return { sent: 0 };

  const messages = valid.map((to) => ({ to, title, body, data, sound: 'default' }));
  const res = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  return { sent: valid.length, expoStatus: res.status };
}

Deno.serve(async (req: Request) => {
  try {
    const admin = adminClient();
    const payload = await req.json();

    // Shape 1: database webhook on notifications INSERT.
    if (payload?.type === 'INSERT' && payload?.record) {
      const rec = payload.record;
      const { data: profile } = await admin
        .from('profiles')
        .select('expo_push_tokens')
        .eq('auth_id', rec.auth_id)
        .maybeSingle();
      const tokens: string[] = profile?.expo_push_tokens ?? [];
      const result = await sendExpoPush(
        tokens,
        rec.title ?? 'HMI',
        rec.message ?? '',
        { type: rec.type ?? 'system', notificationId: rec.id },
      );
      return json(result);
    }

    // Shape 2: direct invocation.
    const { tokens = [], title = 'HMI', body = '', data = {} } = payload ?? {};
    const result = await sendExpoPush(tokens, title, body, data);
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 200); // 200 so webhook delivery isn't retried forever
  }
});
