import assert from "node:assert/strict";
import { test } from "node:test";
import { applyVersion, currentVersion } from "./targets.mjs";

function fixture() {
  const files = {
    "package.json":
      '{\n  "name": "hmi",\n  "version": "1.0.0",\n  "dependencies": {\n    "x": "1.0.0"\n  }\n}\n',
    "apps/web/package.json": '{\n  "name": "web",\n  "version": "4.0.0"\n}\n',
    "apps/mobile/package.json": '{\n  "name": "mobile",\n  "version": "4.0.0"\n}\n',
    "packages/core/package.json": '{\n  "name": "@hmi/core",\n  "version": "0.1.0"\n}\n',
    "package-lock.json": JSON.stringify({
      name: "hmi",
      version: "1.0.0",
      packages: {
        "": { version: "1.0.0" },
        "apps/web": { version: "4.0.0" },
        "node_modules/x": { version: "1.0.0" },
      },
    }),
    "apps/mobile/app.json": JSON.stringify({
      expo: {
        version: "4.0.0",
        android: { versionCode: 3 },
        ios: { bundleIdentifier: "com.sandnes.hmi" },
      },
    }),
  };
  return { files, read: (f) => files[f], write: (f, t) => (files[f] = t) };
}

test("reads the app version and bumps every version file together", () => {
  const { files, read, write } = fixture();
  assert.equal(currentVersion(read), "4.0.0");
  assert.deepEqual(applyVersion(read, write, "4.1.0"), { build: 4 });

  for (const f of [
    "package.json",
    "apps/web/package.json",
    "apps/mobile/package.json",
    "packages/core/package.json",
  ]) {
    assert.equal(JSON.parse(files[f]).version, "4.1.0", f);
  }
  assert.equal(JSON.parse(files["package.json"]).dependencies.x, "1.0.0");
  const lock = JSON.parse(files["package-lock.json"]);
  assert.equal(lock.version, "4.1.0");
  assert.equal(lock.packages[""].version, "4.1.0");
  assert.equal(lock.packages["apps/web"].version, "4.1.0");
  assert.equal(lock.packages["node_modules/x"].version, "1.0.0");
  const app = JSON.parse(files["apps/mobile/app.json"]).expo;
  assert.equal(app.version, "4.1.0");
  assert.equal(app.android.versionCode, 4);
  assert.deepEqual(app.ios, { bundleIdentifier: "com.sandnes.hmi", buildNumber: "4" });
});
