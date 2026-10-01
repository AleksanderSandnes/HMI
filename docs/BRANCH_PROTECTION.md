# Protected release branches

On 2026-09-30, the GitHub API confirmed live quality protection on `main`
and `test`: 15 named checks from GitHub Actions (App ID 15368), strict
up-to-date checking, required PRs, administrator enforcement, resolved review
conversations, and no force push/deletion. There is no mandatory second reviewer
for this personal repository; explicit user approval before production promotion
remains the working rule. Production commits have not changed.

`branch-protection-quality.json` records the applied configuration. Reproduce it
with `gh api --method PUT repos/AleksanderSandnes/HMI/branches/<branch>/protection
--input docs/branch-protection-quality.json`, then GET the same endpoint to verify.
Required jobs include build/test/lint/security scans plus policy tests. Family
workflows run on every task/test/production push and PR, so skipped path filters
cannot leave required checks pending. HMI already ran its quality workflow on all
these events. Python helpers are included in CodeQL.

Task work must now use a PR to `test` after verification. Do not bypass protection
or use direct branch merges. Bring `test` into a task branch if strict checking
reports it behind, run the required repository checks, and let PR CI verify the
combined result. Only propose `test` -> `main` for production; do not merge
that PR until the user explicitly approves it. Keep all remote branches until
cleanup is approved.

## Trusted source enforcement: prepared, activation still pending

`promotion-source.yml` tests the branch policy on task pushes and normal PRs.
The enforcement job uses `pull_request_target` and checks out `github.workflow_sha`,
never PR code. It validates only GitHub's event metadata and writes a
`promotion-source` status on the proposed head commit, with read-only contents
and only the status-write permission it needs. It rejects forks pretending to
be trusted branches, direct task-to-production PRs and unknown sources. Four
policy tests plus a negative target-event CLI check pass locally.

GitHub runs target workflows from the default branch. This trusted workflow is
not on `main` yet, and no production merge has been approved. Therefore
`promotion-source` is deliberately not a required status in the live bootstrap
configuration. Source-only production enforcement is NOT complete yet; requiring
an absent status would prevent the authorized first promotion from bootstrapping.

After an explicitly approved first `test` -> `main` promotion:

1. Verify the trusted workflow runs and reports a GitHub Actions status on the
   PR head for valid/invalid source fixtures. Do not execute untrusted PR code.
2. Add `{"context":"promotion-source","app_id":15368}` to the required checks
   in the JSON, apply it to both protected branches, and GET to confirm it.
3. Demonstrate that a direct task-to-production proposal cannot merge and a
   same-repository test-to-production proposal can satisfy the source check.

No bot bypass is configured. A dedicated release-bot identity and restricted
bypass must be provisioned/reviewed before the later automated version-bump push
can work; do not grant humans a bypass or temporarily disable these quality gates.
Branch cleanup and full release automation remain open.
