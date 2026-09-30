// Dependency-free release helpers: Conventional Commit parsing, SemVer bumping,
// changelog rendering and version-file rewriting. Pure functions are unit tested
// in core.test.mjs; git and filesystem access live in release.mjs.

const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<breaking>!)?: (?<subject>.+)$/;
const BUMPS = ["none", "patch", "minor", "major"];
const SECTIONS = [
  ["breaking", "Breaking changes"],
  ["feat", "Features"],
  ["fix", "Bug fixes"],
  ["perf", "Performance"],
];

export function parseCommit({ hash, subject, body = "" }) {
  const match = HEADER.exec(subject.trim());
  if (!match) return { hash, type: "other", scope: null, subject: subject.trim(), breaking: false };
  const { type, scope, breaking, subject: text } = match.groups;
  return {
    hash,
    type,
    scope: scope || null,
    subject: text,
    breaking: Boolean(breaking) || /^BREAKING[ -]CHANGE:/m.test(body),
  };
}

export function bumpLevel(commits) {
  let level = 0;
  for (const commit of commits) {
    if (commit.breaking) level = Math.max(level, 3);
    else if (commit.type === "feat") level = Math.max(level, 2);
    else if (commit.type === "fix" || commit.type === "perf") level = Math.max(level, 1);
  }
  return BUMPS[level];
}

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(String(version).trim());
  if (!match) throw new Error(`Unsupported version "${version}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

export function nextVersion(current, level) {
  const [major, minor, patch] = parseVersion(current);
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  if (level === "patch") return `${major}.${minor}.${patch + 1}`;
  return null;
}

export function renderChangelog(version, date, commits) {
  const lines = [`## ${version} (${date})`, ""];
  for (const [key, title] of SECTIONS) {
    const entries = commits.filter((c) =>
      key === "breaking" ? c.breaking : !c.breaking && c.type === key,
    );
    if (entries.length === 0) continue;
    lines.push(`### ${title}`, "");
    for (const c of entries) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      lines.push(`- ${scope}${c.subject} (${c.hash.slice(0, 7)})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function prependChangelog(existing, section) {
  const title = "# Changelog\n\n";
  const rest = existing.startsWith(title) ? existing.slice(title.length) : existing;
  return `${title}${section}\n${rest}`.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Replace exactly one regex match, failing loudly when a version file changes shape. */
export function replaceOnce(text, pattern, replacer, label) {
  const matches = text.match(new RegExp(pattern.source, pattern.flags.replace("g", "") + "g"));
  if (!matches || matches.length !== 1) {
    throw new Error(
      `${label}: expected exactly one match for ${pattern}, found ${matches?.length ?? 0}`,
    );
  }
  return text.replace(pattern, replacer);
}
