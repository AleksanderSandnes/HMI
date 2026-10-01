import assert from "node:assert/strict";
import { test } from "node:test";
import { ciReady } from "./ci-ready.mjs";
const run = (name, id = 1, extra = {}) => ({
  name,
  id,
  event: "push",
  status: "completed",
  conclusion: "success",
  ...extra,
});
test("release requires every quality workflow and uses its latest rerun", () => {
  const required = ["CI", "Security"];
  const passing = [run("CI"), run("Security")];
  assert.equal(ciReady(passing, required), true);
  assert.equal(ciReady([run("CI")], required), false);
  assert.equal(ciReady([...passing, run("CI", 2, { conclusion: "failure" })], required), false);
  assert.equal(
    ciReady([...passing, run("CI", 2, { status: "in_progress", conclusion: null })], required),
    false,
  );
  assert.equal(
    ciReady([run("CI", 1, { event: "pull_request" }), run("Security")], required),
    false,
  );
  assert.equal(
    ciReady([...passing, run("CI", 2, { conclusion: "failure" }), run("CI", 3)], required),
    true,
  );
  assert.equal(
    ciReady([run("CI", 1, { conclusion: "skipped" }), run("Security")], required),
    false,
  );
});
