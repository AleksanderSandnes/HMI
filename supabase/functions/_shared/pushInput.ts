const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/;
const MAX_BODY_BYTES = 64 * 1024;

export class PushInputError extends Error {
  constructor(public status = 400) {
    super("Invalid push request");
  }
}

interface DirectPush {
  kind: "direct";
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
}
interface NotificationPush {
  kind: "notification";
  authId: string;
  id: string;
  title: string;
  body: string;
  type: string;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PushInputError();
  return value as Record<string, unknown>;
}
function text(value: unknown, fallback: string, max: number): string {
  const result = value ?? fallback;
  if (typeof result !== "string" || result.length > max) throw new PushInputError();
  return result;
}
function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new PushInputError();
  return value;
}

export function validatePushPayload(value: unknown): DirectPush | NotificationPush {
  const payload = object(value);
  if (payload.type === "INSERT") {
    if (payload.table !== "notifications" || payload.schema !== "public")
      throw new PushInputError();
    const row = object(payload.record);
    return {
      kind: "notification",
      authId: uuid(row.auth_id),
      id: uuid(row.id),
      title: text(row.title, "HMI", 200),
      body: text(row.message, "", 1000),
      type: text(row.type, "system", 100),
    };
  }
  const tokens = payload.tokens;
  if (
    !Array.isArray(tokens) ||
    tokens.length > 100 ||
    tokens.some((token) => typeof token !== "string" || token.length > 128 || !TOKEN.test(token))
  )
    throw new PushInputError();
  const data = payload.data === undefined ? {} : object(payload.data);
  if (new TextEncoder().encode(JSON.stringify(data)).length > 2048) throw new PushInputError();
  return {
    kind: "direct",
    tokens,
    title: text(payload.title, "HMI", 200),
    body: text(payload.body, "", 1000),
    data,
  };
}

/** Cap received bytes even when Content-Length is absent or forged. */
export async function readPushRequest(req: Request): Promise<DirectPush | NotificationPush> {
  if (req.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new PushInputError(415);
  }
  if (!req.body) throw new PushInputError();
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new PushInputError(413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let payload;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new PushInputError();
  }
  return validatePushPayload(payload);
}
