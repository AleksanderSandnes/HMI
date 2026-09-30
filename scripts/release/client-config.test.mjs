import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEnvFile, validateClientConfig } from "./client-config.mjs";

const jwt = (role) => `h.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.s`;
const good = (key = jwt("anon")) => ({
  EXPO_PUBLIC_SUPABASE_URL: "https://xdttfrknoazcqcelieck.supabase.co",
  EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
  EXPO_PUBLIC_DATA_MODE: "production",
});

test("parses dotenv text as data", () => {
  const env = parseEnvFile("# c\nA=1\nexport B=\"two\"\nC = 'x y'\n$(touch /tmp/pwned)\nD=`id`\n");
  assert.deepEqual(env, { A: "1", B: "two", C: "x y", D: "`id`" });
});

test("accepts publishable and legacy anon keys", () => {
  validateClientConfig(good("sb_publishable_abcdefghijkl"));
  validateClientConfig(good());
});

test("rejects unsafe keys without echoing them", () => {
  for (const key of [
    "sb_secret_abcdefghijkl",
    jwt("service_role"),
    "placeholder-9f3a",
    "plain",
    "",
  ]) {
    assert.throws(
      () => validateClientConfig(good(key)),
      (error) => /key/i.test(error.message) && !error.message.includes(key || "\0"),
    );
  }
});

test("rejects wrong URL, data mode and secret-looking public variables", () => {
  assert.throws(
    () =>
      validateClientConfig({
        ...good(),
        EXPO_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      }),
    /URL/,
  );
  assert.throws(
    () => validateClientConfig({ ...good(), EXPO_PUBLIC_DATA_MODE: "development" }),
    /DATA_MODE/,
  );
  assert.throws(
    () => validateClientConfig({ ...good(), EXPO_PUBLIC_SERVICE_ROLE_KEY: "x" }),
    /public/,
  );
});
