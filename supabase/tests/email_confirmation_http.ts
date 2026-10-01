// Auth confirmation contract on a disposable localhost stack. Fictional fixtures only.
// No external email is sent: the Admin API generates a signup code in memory.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

const workdir = Deno.args[0];
if (!workdir) throw new Error("Usage: email_confirmation_http.ts <supabase workdir>");
const output = await new Deno.Command("supabase", {
  args: ["status", "--workdir", workdir, "-o", "json"],
  stderr: "null",
}).output();
if (!output.success) throw new Error("Local stack unavailable");
const status = JSON.parse(new TextDecoder().decode(output.stdout));
const api = new URL(status.API_URL);
if (api.protocol !== "http:" || api.hostname !== "127.0.0.1") {
  throw new Error("Only a disposable localhost stack is permitted");
}
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const client = createClient(status.API_URL, status.ANON_KEY, options);
const email = `confirmation-${crypto.randomUUID()}@example.test`;
const password = `${crypto.randomUUID()}Ab1!`;
let checks = 0;
function check(value: unknown, message: string) {
  if (!value) throw new Error(message);
  checks++;
}
const generated = await admin.auth.admin.generateLink({ type: "signup", email, password });
if (generated.error || !generated.data.user) throw generated.error ?? new Error("Fixture missing");
const id = generated.data.user.id;
try {
  check(!generated.data.user.email_confirmed_at, "Signup requires email confirmation");
  const unconfirmed = await client.auth.signInWithPassword({ email, password });
  check(unconfirmed.error?.code === "email_not_confirmed", "Unconfirmed password login denied");
  check(unconfirmed.data.session === null, "No unconfirmed session issued");
  const invalid = await client.auth.verifyOtp({ email, token: "invalid-code", type: "email" });
  check(invalid.error !== null && invalid.data.session === null, "Invalid code denied");
  const verified = await client.auth.verifyOtp({
    email,
    token: generated.data.properties.email_otp,
    type: "email",
  });
  check(!verified.error && verified.data.session !== null, "Confirmation issues a real session");
  check(verified.data.user?.id === id, "Confirmed session belongs to signup fixture");
  const profile = await client.from("profiles").select("auth_id").eq("auth_id", id).single();
  check(!profile.error && profile.data?.auth_id === id, "Confirmed user can access their profile");
  await client.auth.signOut();
  const reused = await client.auth.verifyOtp({
    email,
    token: generated.data.properties.email_otp,
    type: "email",
  });
  check(
    reused.error !== null && reused.data.session === null,
    "Confirmation code cannot be reused",
  );
  const login = await client.auth.signInWithPassword({ email, password });
  check(!login.error && login.data.user?.id === id, "Confirmed password login works");
} finally {
  await client.auth.signOut();
  const removed = await admin.auth.admin.deleteUser(id);
  if (removed.error) throw removed.error;
}
console.log(`Email confirmation: ${checks} Auth/profile checks passed; fixture removed.`);
