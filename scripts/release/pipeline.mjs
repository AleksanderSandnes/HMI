import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { ciReady } from "./ci-ready.mjs";
import { releaseState } from "./targets.mjs";
import { verifyRelease } from "./verify.mjs";

const config = JSON.parse(readFileSync("scripts/release/pipeline.json", "utf8"));
const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const tip = execFileSync("git", ["rev-parse", `origin/${config.production}`], {
  encoding: "utf8",
}).trim();
const pages = JSON.parse(
  execFileSync(
    "gh",
    [
      "api",
      "--paginate",
      "--slurp",
      `repos/${process.env.GITHUB_REPOSITORY}/actions/runs?head_sha=${sha}&per_page=100`,
    ],
    { encoding: "utf8" },
  ),
);
const runs = pages
  .flatMap((page) => page.workflow_runs)
  .filter((run) => run.head_sha === sha && run.head_branch === config.production);
const ready = sha === tip && ciReady(runs, config.workflows);
const values = { ready: String(ready) };
if (ready) {
  const read = (file) => readFileSync(file, "utf8");
  const state = releaseState(read);
  const tags = execFileSync("git", ["tag", "--merged", "HEAD", "--sort=-version:refname"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  const previousTag = tags.find(
    (tag) => /^v\d+\.\d+(?:\.\d+)?$/.test(tag) && tag !== `v${state.version}`,
  );
  const previous = previousTag
    ? releaseState((file) =>
        execFileSync("git", ["show", `${previousTag}:${file}`], { encoding: "utf8" }),
      )
    : null;
  Object.assign(
    values,
    verifyRelease(
      state,
      read("CHANGELOG.md"),
      Math.max(3, previous?.build ?? 3),
      previous?.version,
    ),
  );
}
for (const [key, value] of Object.entries(values)) {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
