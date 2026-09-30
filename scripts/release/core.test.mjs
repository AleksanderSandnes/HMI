import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bumpLevel,
  nextVersion,
  parseCommit,
  parseVersion,
  prependChangelog,
  renderChangelog,
  replaceOnce,
} from "./core.mjs";

const commit = (subject, body = "") => parseCommit({ hash: "abcdef1234567", subject, body });

test("parses conventional headers, scopes and breaking markers", () => {
  assert.deepEqual(commit("feat(web): add login"), {
    hash: "abcdef1234567",
    type: "feat",
    scope: "web",
    subject: "add login",
    breaking: false,
  });
  assert.equal(commit("fix!: drop old api").breaking, true);
  assert.equal(commit("refactor: x", "BREAKING CHANGE: removed y").breaking, true);
  assert.equal(commit("Merge branch test").type, "other");
});

test("chooses the highest bump level", () => {
  assert.equal(bumpLevel([commit("docs: a"), commit("chore: b")]), "none");
  assert.equal(bumpLevel([commit("fix: a"), commit("perf: b")]), "patch");
  assert.equal(bumpLevel([commit("fix: a"), commit("feat: b")]), "minor");
  assert.equal(bumpLevel([commit("feat: a"), commit("fix!: b")]), "major");
});

test("computes the next semantic version", () => {
  assert.deepEqual(parseVersion("2.1"), [2, 1, 0]);
  assert.throws(() => parseVersion("v1"), /Unsupported/);
  assert.equal(nextVersion("4.0.0", "patch"), "4.0.1");
  assert.equal(nextVersion("4.0.3", "minor"), "4.1.0");
  assert.equal(nextVersion("2.1", "major"), "3.0.0");
  assert.equal(nextVersion("4.0.0", "none"), null);
});

test("renders grouped changelog sections and prepends them", () => {
  const section = renderChangelog("4.1.0", "2026-09-30", [
    commit("feat(web): add login"),
    commit("fix: repair chart"),
    commit("feat!: new api"),
    commit("chore: tidy"),
  ]);
  assert.equal(
    section,
    [
      "## 4.1.0 (2026-09-30)",
      "",
      "### Breaking changes",
      "",
      "- new api (abcdef1)",
      "",
      "### Features",
      "",
      "- **web:** add login (abcdef1)",
      "",
      "### Bug fixes",
      "",
      "- repair chart (abcdef1)",
      "",
    ].join("\n"),
  );
  const first = prependChangelog("", section);
  assert.match(first, /^# Changelog\n\n## 4\.1\.0/);
  const second = prependChangelog(
    first,
    "## 4.1.1 (2026-10-01)\n\n### Bug fixes\n\n- x (abcdef1)\n",
  );
  assert.ok(second.indexOf("## 4.1.1") < second.indexOf("## 4.1.0"));
  assert.doesNotMatch(second, /\n{3,}/);
});

test("replaceOnce rejects missing or ambiguous matches", () => {
  assert.equal(replaceOnce("a=1", /a=\d/, "a=2", "f"), "a=2");
  assert.throws(() => replaceOnce("b=1", /a=\d/, "a=2", "f"), /found 0/);
  assert.throws(() => replaceOnce("a=1 a=2", /a=\d/, "a=3", "f"), /found 2/);
});
