import { parseVersion } from "./core.mjs";

export function verifyRelease(state, changelog, minimumBuild = 3, previousVersion = null) {
  if (!/^\d+\.\d+\.\d+$/.test(state.version)) throw new Error("Release needs a three-part version");
  const versionParts = parseVersion(state.version);
  if (previousVersion) {
    const previousParts = parseVersion(previousVersion);
    const firstChange = versionParts.findIndex((value, index) => value !== previousParts[index]);
    if (firstChange === -1 || versionParts[firstChange] < previousParts[firstChange]) {
      throw new Error(`Version must exceed ${previousVersion}`);
    }
  }
  if (!Number.isSafeInteger(state.build) || state.build <= minimumBuild) {
    throw new Error(`Build number must exceed ${minimumBuild}`);
  }
  for (const [file, value] of Object.entries(state.versions)) {
    if (value !== state.version) throw new Error(`${file}: version differs from ${state.version}`);
  }
  for (const [file, value] of Object.entries(state.builds)) {
    if (String(value) !== String(state.build))
      throw new Error(`${file}: build differs from ${state.build}`);
  }
  const sections = changelog.split(/^## /m).slice(1);
  const matching = sections.filter((section) => section.startsWith(`${state.version} (`));
  if (matching.length !== 1 || !/^- .+/m.test(matching[0])) {
    throw new Error(`CHANGELOG.md needs one nonempty section for ${state.version}`);
  }
  return { version: state.version, build: state.build };
}
