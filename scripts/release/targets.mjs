// HMI version files. apps/mobile/app.json is the source of truth for the current
// version; every package manifest, the lockfile and native build numbers follow it.
import { replaceOnce } from "./core.mjs";

const PACKAGES = [
  "package.json",
  "apps/web/package.json",
  "apps/mobile/package.json",
  "packages/core/package.json",
];
const LOCK_KEYS = ["", "apps/web", "apps/mobile", "packages/core"];

export function currentVersion(read) {
  return JSON.parse(read("apps/mobile/app.json")).expo.version;
}

export function applyVersion(read, write, version) {
  for (const file of PACKAGES) {
    const text = read(file);
    write(file, replaceOnce(text, /^(  "version": )"[^"]*"/m, `$1"${version}"`, file));
  }

  const lock = JSON.parse(read("package-lock.json"));
  lock.version = version;
  for (const key of LOCK_KEYS) {
    if (lock.packages?.[key]) lock.packages[key].version = version;
  }
  write("package-lock.json", `${JSON.stringify(lock, null, 2)}\n`);

  const app = JSON.parse(read("apps/mobile/app.json"));
  const build = Number(app.expo.android.versionCode) + 1;
  app.expo.version = version;
  app.expo.android.versionCode = build;
  app.expo.ios = { ...app.expo.ios, buildNumber: String(build) };
  write("apps/mobile/app.json", `${JSON.stringify(app, null, 2)}\n`);
  return { build };
}
