import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyRelease } from "./verify.mjs";

const state = () => ({
  version: "4.1.0",
  build: 4,
  versions: { native: "4.1.0" },
  builds: { ios: "4" },
});
const notes = "# Changelog\n\n## 4.1.0 (2026-09-30)\n\n### Features\n\n- New release\n";
test("release rejects divergent versions, builds and absent notes", () => {
  assert.deepEqual(verifyRelease(state(), notes), { version: "4.1.0", build: 4 });
  assert.throws(
    () => verifyRelease({ ...state(), versions: { native: "4.0.0" } }, notes),
    /version differs/,
  );
  assert.throws(() => verifyRelease({ ...state(), builds: { ios: "3" } }, notes), /build differs/);
  assert.throws(() => verifyRelease({ ...state(), build: 3 }, notes), /must exceed/);
  assert.throws(() => verifyRelease({ ...state(), build: NaN }, notes), /must exceed/);
  assert.throws(() => verifyRelease({ ...state(), version: "4.1" }, notes), /three-part/);
  assert.throws(() => verifyRelease(state(), "# Changelog\n"), /nonempty section/);
  assert.throws(() => verifyRelease(state(), notes + notes), /one nonempty section/);
  assert.throws(() => verifyRelease(state(), "## 4.1.0 (2026-09-30)\n"), /nonempty section/);
});

test("release version and build must advance beyond the prior release", () => {
  assert.throws(() => verifyRelease(state(), notes, 4, "4.0.0"), /Build number must exceed/);
  assert.throws(() => verifyRelease(state(), notes, 3, "4.1.0"), /Version must exceed/);
  assert.throws(() => verifyRelease(state(), notes, 3, "5.0.0"), /Version must exceed/);
  assert.deepEqual(verifyRelease(state(), notes, 3, "4.0.9"), { version: "4.1.0", build: 4 });
});
