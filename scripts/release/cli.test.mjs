import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const cli = join(root, "scripts/release/release.mjs");
const files = [
  "package.json",
  "package-lock.json",
  "apps/web/package.json",
  "apps/mobile/package.json",
  "packages/core/package.json",
  "apps/mobile/app.json",
];
test("real CLI dry run, prepare, verification and repeat are safe", () => {
  const dir = mkdtempSync(join(tmpdir(), "release-cli-"));
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const run = (...args) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  try {
    for (const file of files) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      copyFileSync(join(root, file), join(dir, file));
    }
    git("init", "--initial-branch=task/releaseTest");
    git("config", "user.name", "Release Test");
    git("config", "user.email", "release@example.invalid");
    git("add", ".");
    git("commit", "-m", "chore: baseline");
    const base = git("rev-parse", "HEAD").trim();
    assert.match(run("prepare", "--base", base, "--dry-run"), /released=false/);
    writeFileSync(join(dir, "feature.txt"), "fictional change\n");
    git("add", ".");
    git("commit", "-m", "feat: support family sharing");
    const before = files.map((file) => readFileSync(join(dir, file), "utf8"));
    assert.match(run("prepare", "--base", base, "--dry-run"), /released=true/);
    assert.deepEqual(
      files.map((file) => readFileSync(join(dir, file), "utf8")),
      before,
    );
    assert.equal(git("status", "--porcelain"), "");
    const prepared = run("prepare", "--base", base);
    assert.match(prepared, /released=true/);
    const version = /^version=(.*)$/m.exec(prepared)[1];
    const verified = run("verify");
    assert.match(verified, new RegExp(`version=${version.replaceAll(".", "\\.")}`));
    assert.match(run("notes"), /support family sharing/);
    const after = files.map((file) => readFileSync(join(dir, file), "utf8"));
    assert.match(run("prepare", "--base", base), /prepared=true/);
    assert.deepEqual(
      files.map((file) => readFileSync(join(dir, file), "utf8")),
      after,
    );
    writeFileSync(join(dir, "CHANGELOG.md"), "# Changelog\n");
    assert.throws(() => run("verify"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
