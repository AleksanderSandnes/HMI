#!/usr/bin/env node
// Release CLI (no dependencies).
//   node scripts/release/release.mjs prepare [--base <ref>] [--dry-run]
//     Bumps every version file and CHANGELOG.md from Conventional Commits in base..HEAD.
//   node scripts/release/release.mjs notes
//     Prints the current version's CHANGELOG section (used for the GitHub Release).
// Writes version/build/released to $GITHUB_OUTPUT when present.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bumpLevel, nextVersion, parseCommit, prependChangelog, renderChangelog } from "./core.mjs";
import { applyVersion, currentVersion, releaseState, DEFAULT_BASE } from "./targets.mjs";

import { verifyRelease } from "./verify.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};

function output(values) {
  for (const [key, value] of Object.entries(values)) {
    console.log(`${key}=${value}`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

function commitsSince(base) {
  const log = execFileSync(
    "git",
    ["log", "--no-merges", "--format=%H%x1f%s%x1f%b%x1e", `${base}..HEAD`],
    {
      encoding: "utf8",
    },
  );
  return log
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body] = entry.split("\x1f");
      return parseCommit({ hash, subject, body });
    })
    .filter((c) => !(c.type === "chore" && c.scope === "release"));
}

function prepare() {
  const dryRun = args.includes("--dry-run");
  const base = flag("--base", DEFAULT_BASE);
  const current = currentVersion(read);
  const baseRead = (file) => execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8" });
  if (current !== currentVersion(baseRead)) {
    verifyRelease(releaseState(read), read("CHANGELOG.md"));
    output({ released: "false", version: current, prepared: "true" });
    return;
  }
  const commits = commitsSince(base);
  const version = nextVersion(current, bumpLevel(commits));
  if (!version) {
    output({ released: "false", version: current });
    return;
  }
  const date = new Date().toISOString().slice(0, 10);
  const section = renderChangelog(version, date, commits);
  if (dryRun) {
    console.log(section);
    output({ released: "true", version });
    return;
  }
  const write = (file, text) => writeFileSync(join(root, file), text);
  const { build } = applyVersion(read, write, version);
  const changelog = existsSync(join(root, "CHANGELOG.md")) ? read("CHANGELOG.md") : "";
  write("CHANGELOG.md", prependChangelog(changelog, section));
  output({ released: "true", version, build });
}

function notes() {
  const version = currentVersion(read);
  const changelog = existsSync(join(root, "CHANGELOG.md")) ? read("CHANGELOG.md") : "";
  const start = changelog.indexOf(`## ${version} `);
  if (start === -1) throw new Error(`CHANGELOG.md has no section for ${version}`);
  const end = changelog.indexOf("\n## ", start + 1);
  process.stdout.write(changelog.slice(start, end === -1 ? undefined : end).trim() + "\n");
}

const command = args[0];
if (command === "prepare") prepare();
else if (command === "notes") notes();
else if (command === "verify") output(verifyRelease(releaseState(read), read("CHANGELOG.md")));
else if (command === "version") output({ version: currentVersion(read) });
else {
  console.error("Usage: release.mjs <prepare|notes|version|verify> [--base <ref>] [--dry-run]");
  process.exit(2);
}
