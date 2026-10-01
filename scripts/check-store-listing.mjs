#!/usr/bin/env node
// Validates store listing text against Google Play / App Store length limits.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "store");
const LIMITS = {
  title: 30,
  short_description: 80,
  full_description: 4000,
  name: 30,
  subtitle: 30,
  keywords: 100,
  promotional_text: 170,
  description: 4000,
};

function* files(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (entry.endsWith(".txt")) yield path;
  }
}

const problems = [];
let checked = 0;
for (const file of files(root)) {
  const key = basename(file, ".txt");
  const limit = LIMITS[key];
  if (limit === undefined) {
    problems.push(`${file}: unknown listing field "${key}"`);
    continue;
  }
  const length = [...readFileSync(file, "utf8").trimEnd()].length;
  checked += 1;
  if (length === 0) problems.push(`${file}: empty`);
  if (length > limit) problems.push(`${file}: ${length} > ${limit} characters`);
}

if (checked === 0) problems.push("no listing files found");
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Store listing OK (${checked} files)`);
