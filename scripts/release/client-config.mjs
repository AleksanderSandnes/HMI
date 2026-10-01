// Validates the public Supabase client settings in an EAS production env file.
// The file is parsed as data (never sourced) and errors never echo values.
import { readFileSync } from "node:fs";

const PROJECT_REF = "xdttfrknoazcqcelieck";

export function parseEnvFile(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || match[1].startsWith("#")) continue;
    values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
}

function jwtRole(key) {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role ?? null;
  } catch {
    return null;
  }
}

export function validateClientConfig(env, ref = PROJECT_REF) {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (url !== `https://${ref}.supabase.co`)
    throw new Error("EXPO_PUBLIC_SUPABASE_URL is not the production project URL");
  if (!key) throw new Error("Supabase client key is missing");
  if (/^sb_secret_/.test(key)) throw new Error("Supabase client key is a secret key");
  if (/placeholder/i.test(key)) throw new Error("Supabase client key is a placeholder");
  if (env.EXPO_PUBLIC_DATA_MODE !== "production")
    throw new Error("EXPO_PUBLIC_DATA_MODE must be production");
  for (const name of Object.keys(env)) {
    if (/^EXPO_PUBLIC_.*(SERVICE_ROLE|SECRET|PASSWORD)/i.test(name))
      throw new Error(`${name} must not be a public variable`);
  }
  if (/^sb_publishable_\S{8,}$/.test(key)) return;
  const role = jwtRole(key);
  if (role === "anon") return;
  throw new Error(
    role
      ? `Supabase client key has role ${role}, expected anon`
      : "Supabase client key is not a publishable or anon key",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateClientConfig(parseEnvFile(readFileSync(process.argv[2], "utf8")));
    console.log("Mobile client configuration is valid");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
