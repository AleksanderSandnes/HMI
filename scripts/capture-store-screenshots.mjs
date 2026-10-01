#!/usr/bin/env node
// Regenerates store screenshots from fictional data only.
//
//   npm run store:screenshots
//
// 1. Starts the local Supabase stack (Docker) — never the hosted project.
// 2. Seeds the fictional demo account from supabase/seed_demo.sql (guarded to refuse
//    databases with real accounts).
// 3. Builds the web app against the local stack and runs the Playwright store spec,
//    which answers every solar/weather request from apps/web/tests/store/fixtures.ts.
// Output: store/screenshots/<device>/<locale>/*.png. Review every image before committing.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shell = process.platform === "win32";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell, ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
}

function localStackEnv() {
  const output = execFileSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: root,
    encoding: "utf8",
    shell,
  });
  const env = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  );
  const url = env.API_URL;
  const anonKey = env.ANON_KEY ?? env.PUBLISHABLE_KEY;
  if (!url?.startsWith("http://127.0.0.1") && !url?.startsWith("http://localhost")) {
    throw new Error(`Refusing to capture against a non-local Supabase URL: ${url}`);
  }
  if (!anonKey) throw new Error("Local Supabase anon key not found in `supabase status`.");
  return { url, anonKey };
}

function seedDemoAccount() {
  const projectId = readFileSync(path.join(root, "supabase/config.toml"), "utf8").match(
    /^project_id\s*=\s*"([^"]+)"/m,
  )?.[1];
  if (!projectId) throw new Error("project_id missing from supabase/config.toml");
  run(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${projectId}`,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    {
      input: readFileSync(path.join(root, "supabase/seed_demo.sql")),
      stdio: ["pipe", "inherit", "inherit"],
      shell: false,
    },
  );
}

run("npx", ["supabase", "start"]);
const { url, anonKey } = localStackEnv();
seedDemoAccount();
run("npx", ["playwright", "test", "-c", "playwright.store.config.ts"], {
  cwd: path.join(root, "apps/web"),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    NEXT_PUBLIC_DATA_MODE: "production",
    // Unreachable on purpose: the spec intercepts every request to it.
    NEXT_PUBLIC_JAVA_API: "http://127.0.0.1:3999",
  },
});
console.log("Screenshots written to store/screenshots/. Review every image before committing.");
