import { PushInputError, readPushRequest, validatePushPayload } from "./pushInput.ts";

const direct = {
  tokens: ["ExpoPushToken[fictional-token]"],
  title: "Fixture",
  body: "Fictional text",
};
const webhook = {
  type: "INSERT",
  table: "notifications",
  schema: "public",
  record: {
    id: "10000000-0000-0000-0000-000000000001",
    auth_id: "20000000-0000-0000-0000-000000000001",
    title: "Fixture",
    message: "Fictional message",
  },
};

function invalid(value: unknown) {
  try {
    validatePushPayload(value);
  } catch (error) {
    if (error instanceof PushInputError) return;
    throw error;
  }
  throw new Error("Invalid push payload accepted");
}

Deno.test("push payload accepts direct requests and notification inserts", () => {
  if (validatePushPayload(direct).kind !== "direct") throw new Error("Direct payload rejected");
  if (validatePushPayload(webhook).kind !== "notification") throw new Error("Webhook rejected");
});

Deno.test(
  "push payload rejects malformed tokens, oversized fields and incorrect row identities",
  () => {
    for (const payload of [
      null,
      [],
      {},
      { tokens: "token" },
      { tokens: ["ExpoPushToken[unterminated"] },
      { ...direct, tokens: Array(101).fill("ExpoPushToken[fictional]") },
      { ...direct, body: "x".repeat(1001) },
      { ...direct, data: { value: "x".repeat(2049) } },
      { ...webhook, table: "profiles" },
      { ...webhook, record: { ...webhook.record, auth_id: "invalid" } },
    ])
      invalid(payload);
  },
);

Deno.test(
  "push reader validates JSON and rejects oversized streams independent of headers",
  async () => {
    const request = (body: string, type = "application/json") =>
      new Request("https://example.test", {
        method: "POST",
        headers: { "Content-Type": type, "Content-Length": "1" },
        body,
      });
    if ((await readPushRequest(request(JSON.stringify(direct)))).kind !== "direct")
      throw new Error("Valid request rejected");
    for (const [req, status] of [
      [request("{"), 400],
      [request("{}", "text/plain"), 415],
      [request("x".repeat(65537)), 413],
    ] as const) {
      try {
        await readPushRequest(req);
      } catch (error) {
        if (error instanceof PushInputError && error.status === status) continue;
        throw error;
      }
      throw new Error("Invalid request accepted");
    }
  },
);
