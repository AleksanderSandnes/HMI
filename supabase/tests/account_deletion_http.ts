// Real Auth/Storage/Vault test for account deletion on a DISPOSABLE localhost stack
// with the repository migrations applied. Fictional fixtures only.
//
//   deno run --allow-env --allow-net --allow-run --allow-read supabase/tests/account_deletion_http.ts <workdir>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { handleAccountDeletion } from "../functions/_shared/accountDeletion.ts";
import { supabaseAccountDeletionStore } from "../functions/_shared/accountDeletionStore.ts";

const workdir = Deno.args[0];
if (!workdir) throw new Error("Usage: account_deletion_http.ts <supabase workdir>");
const status = JSON.parse(
  new TextDecoder().decode(
    (
      await new Deno.Command("supabase", {
        args: ["status", "--workdir", workdir, "-o", "json"],
        stderr: "null",
      }).output()
    ).stdout,
  ),
);
const api = new URL(status.API_URL);
if (api.protocol !== "http:" || api.hostname !== "127.0.0.1") {
  throw new Error("Only a disposable localhost stack is permitted");
}

let checks = 0;
function check(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
  checks++;
}

const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function createUser(name: string) {
  const email = `${name}-${crypto.randomUUID()}@example.test`;
  const password = `${crypto.randomUUID()}Ab1!`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser");
  const client = createClient(status.API_URL, status.ANON_KEY, {
    auth: { persistSession: false },
  });
  const session = await client.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  return { id: data.user.id, token: session.data.session!.access_token, client };
}

async function seed(user: Awaited<ReturnType<typeof createUser>>) {
  const saved = await user.client.rpc("save_user_credentials", {
    p_weather_station_id: "IFICTIONAL1",
    p_weather_api_key: "fictional-weather-key",
    p_growatt_email: "fictional@example.test",
    p_growatt_password: "fictional-growatt",
  });
  check(!saved.error, "credentials saved");
  const upload = await user.client.storage
    .from("avatars")
    .upload(`${user.id}/avatar.png`, new TextEncoder().encode("fictional"), {
      contentType: "image/png",
    });
  check(!upload.error, "avatar uploaded");
  const { data } = await service
    .from("user_settings")
    .select("weather_api_key_secret_id, growatt_password_secret_id")
    .eq("auth_id", user.id)
    .single();
  return [data!.weather_api_key_secret_id, data!.growatt_password_secret_id] as string[];
}

async function secretExists(id: string): Promise<boolean> {
  const { data, error } = await service.rpc("get_vault_secret", { p_secret_id: id });
  return !error && data !== null;
}

async function avatarCount(id: string): Promise<number> {
  const { data } = await service.storage.from("avatars").list(id);
  return (data ?? []).length;
}

const target = await createUser("fictional-emma");
const other = await createUser("fictional-lars");
const targetSecrets = await seed(target);
const otherSecrets = await seed(other);
for (const id of [...targetSecrets, ...otherSecrets])
  check(await secretExists(id), "secret seeded");

const store = supabaseAccountDeletionStore(service);
const request = (token: string, confirm = "DELETE_MY_ACCOUNT") =>
  new Request("http://127.0.0.1/delete-account", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ confirm }),
  });

check((await handleAccountDeletion(request("forged.token.value"), store)).status === 401, "forged");
check((await handleAccountDeletion(request(target.token, "no"), store)).status === 400, "confirm");
check((await avatarCount(target.id)) === 1, "nothing deleted before confirmation");

check((await handleAccountDeletion(request(target.token), store)).status === 204, "deleted");
check((await service.auth.admin.getUserById(target.id)).error !== null, "auth user removed");
for (const table of ["profiles", "user_settings"]) {
  const { count } = await service
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("auth_id", target.id);
  check(count === 0, `${table} cascaded`);
}
for (const id of targetSecrets) check(!(await secretExists(id)), "target Vault secret removed");
check((await avatarCount(target.id)) === 0, "target avatar removed");

for (const id of otherSecrets) check(await secretExists(id), "other user's secret intact");
check((await avatarCount(other.id)) === 1, "other user's avatar intact");
check(!(await service.auth.admin.getUserById(other.id)).error, "other user intact");

const direct = await other.client.rpc("prepare_account_deletion", { target_auth_id: other.id });
check(direct.error !== null, "clients cannot call deletion helpers");

console.log(`Account deletion HTTP checks passed: ${checks}`);
