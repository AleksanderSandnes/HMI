import {
  type AccountDeletionStore,
  handleAccountDeletion,
  type MediaObject,
} from "./accountDeletion.ts";

const AUTH_ID = "40000000-0000-0000-0000-000000000001";

function fakeStore(media: MediaObject[] = [], failRemoval = false) {
  const calls: string[] = [];
  const store: AccountDeletionStore = {
    userIdForToken: (token) => Promise.resolve(token === "valid.token" ? AUTH_ID : null),
    mediaOf: () => Promise.resolve(media),
    removeMedia: (bucket, names) => {
      calls.push(`remove:${bucket}:${names.length}`);
      return failRemoval ? Promise.reject(new Error("storage")) : Promise.resolve();
    },
    prepareDeletion: (id) => {
      calls.push(`prepare:${id}`);
      return Promise.resolve();
    },
    deleteAuthUser: (id) => {
      calls.push(`delete:${id}`);
      return Promise.resolve();
    },
  };
  return { store, calls };
}

function request(
  body: unknown = { confirm: "DELETE_MY_ACCOUNT" },
  token: string | null = "valid.token",
  method = "POST",
  contentType = "application/json",
) {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://example.test", {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

Deno.test("deletes avatars, credentials and the auth user in order", async () => {
  const media = Array.from({ length: 150 }, (_, i) => ({
    bucket_id: "avatars",
    name: `${AUTH_ID}/${i}.png`,
  }));
  const { store, calls } = fakeStore(media);
  const response = await handleAccountDeletion(request(), store);
  assertEquals(response.status, 204);
  assertEquals(calls, [
    "remove:avatars:100",
    "remove:avatars:50",
    `prepare:${AUTH_ID}`,
    `delete:${AUTH_ID}`,
  ]);
  assertEquals(response.headers.get("Access-Control-Allow-Origin") !== null, true);
});

Deno.test("rejects missing or invalid tokens without touching data", async () => {
  for (const token of [null, "forged.token"]) {
    const { store, calls } = fakeStore();
    assertEquals((await handleAccountDeletion(request(undefined, token), store)).status, 401);
    assertEquals(calls, []);
  }
});

Deno.test("requires the explicit JSON confirmation", async () => {
  const cases = [
    request({ confirm: "yes" }),
    request({}),
    request({ confirm: "DELETE_MY_ACCOUNT" }, "valid.token", "POST", "text/plain"),
    request("x".repeat(2000)),
  ];
  for (const req of cases) {
    const { store, calls } = fakeStore();
    assertEquals((await handleAccountDeletion(req, store)).status, 400);
    assertEquals(calls, []);
  }
});

Deno.test("answers preflight and rejects other methods", async () => {
  const { store, calls } = fakeStore();
  assertEquals((await handleAccountDeletion(request(null, null, "OPTIONS"), store)).status, 200);
  const get = await handleAccountDeletion(request(null, "valid.token", "GET"), store);
  assertEquals(get.status, 405);
  assertEquals(get.headers.get("Allow"), "POST");
  assertEquals(calls, []);
});

Deno.test("keeps the account when media removal fails so the user can retry", async () => {
  const { store, calls } = fakeStore([{ bucket_id: "avatars", name: `${AUTH_ID}/a.png` }], true);
  let failed = false;
  try {
    await handleAccountDeletion(request(), store);
  } catch {
    failed = true;
  }
  assertEquals(failed, true);
  assertEquals(calls, ["remove:avatars:1"]);
});
