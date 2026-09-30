# Release readiness handover — 30 September 2026

## First release-proposal workflow verification — 30 September 2026

HMI PR #46 merged into `test` after all task/PR checks passed. The first
Prepare Release workflow (36775117818) passed and generated a proposal for
5.0.0/build 4 without writing a branch, tag or release. Artifact inspection
found that the newly created CHANGELOG.md was absent from git diff. Both
workflows now include that file with intent-to-add; a disposable-Git regression
verifies that the patch contains the changelog and release notes. The fix's
remote workflow verification remains pending. Production main/master are unchanged.

## Release automation prepared — 30 September 2026

`prepare-release.yml` computes a version proposal after changes land in `test`.
It always uploads a patch; set `RELEASE_PREPARE_ENABLED=true` to let it open a
`task/releaseV...` PR. Manual dispatch on `test` defaults to preview. Preparation
recognizes an already-bumped version and never bumps it again against the same
production base. Every version file, native build number and changelog section
must agree; release build numbers must exceed the last release and Play's existing 3.

`release.yml` listens for completed quality workflows on `main`. It checks the
exact commit, current production tip and latest push run of every workflow listed
in `scripts/release/pipeline.json`. Missing, pending, failed or skipped quality
workflows prevent drafting. Superseded production commits cannot release.
With `RELEASE_DRAFT_ENABLED=true`, its `production` environment job creates an
immutable version tag and a **draft** GitHub Release. Repeated runs reuse the
same release and reject a tag that points to another commit. Publish the draft
only after the owner reviews the release. This workflow does not upload to stores.

Both activation variables are currently unset. Production branches, environment
protections, credentials and activation must be reviewed before enabling them.
Coverage targets, signed native build/store jobs and the first approved production
promotion remain open. Local release integration tests use disposable Git repos:
dry runs do not change files, version preparation is repeat-safe, inconsistent
versions/builds/missing notes fail, and every quality workflow must pass.

GitHub Actions PRs created with `GITHUB_TOKEN` require workflow approval; an
optional scoped `RELEASE_BOT_TOKEN` enables automatic task/PR CI. It needs Contents
and Pull requests write permission only and no protected-branch bypass. Repository
Actions settings must allow PR creation. Token behavior reference:
https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow

## Full web coverage baseline — 30 September 2026

`npm run test:coverage --workspace @hmi/web` now explicitly includes all production
app, component and library sources, including files no test imports. The earlier
imported-file report was incomplete. Correct baseline: 39.38% lines. Date-picker
interaction tests cover day/month/year selection, boundaries, dismissal, loading
and Norwegian labels; full web coverage reached 50.20% (492/980 lines). Further session and dashboard
integration tests now bring it to 53.26% (522/980 lines), with 153 web tests passing.
These cover account switches, absent/failing session reads, browser-client reuse,
server cookie refresh/read-only contexts, dashboard failures and cached-weather refresh.

The command uses two workers to avoid resource pressure during coverage reporting.
HTML, JSON summary and LCOV reports are generated under `apps/web/coverage/`.
The 80% overall / 90% logic requirements are still unmet; reporting is not a gate.
Full mobile coverage also passed all 92 tests: 36.26% lines (466/1285).
CI now collects and saves full web/mobile reports alongside the core report.

## Email confirmation client implementation — 30 September 2026

Web and mobile registration now wait for an email code when signup returns no
session. The shared Auth API verifies the code and supports resending; integration
onboarding starts only after a real session exists. English/Norwegian messages,
web/native behavior tests, and a local confirmation email template are included.
Nine real localhost Auth/profile checks passed locally and in CI (unconfirmed login and reused codes
are denied), and Mailpit delivered the expected signup email. Local Auth now uses
confirmation, eight-character new passwords and a ten-minute code expiry.

Production still auto-confirms: deploy the updated clients, configure verified
SMTP, apply the code template, then enable confirmation and smoke-test delivery.
The remaining Pro-only leaked-password protection warning is accepted by the owner.

> Owner decision (2026-09-30): accept the remaining Pro-only leaked-password
> protection warning in both projects. No upgrade is required; this warning
> does not block release readiness. Other security requirements still apply.

## Verified continuation — 30 September 2026, 20:46 Oslo

This section supersedes older rollout status below. The full plan is still open.
Supabase CLI is authenticated and both projects are linked; the direct Codex
Supabase MCP server is configured with OAuth authentication. Production Git branches
have not been merged. Leaked-password protection was requested through the
Management API and rejected with HTTP 402 for both projects (Pro required).
No billing upgrade occurred. Email/password, SMTP, domains, signed builds, store
uploads, screenshots, coverage gates and complete bootstrap still require work.

- HMI task commit `1b28e58`: GitHub CI `36758576703`, Security, CodeQL and
  Promotion Source all passed. Node 22 discovers the six release tests via
  `*.test.mjs`; the database job uses isolated 5732x ports. Confirmation/cancel
  test actions are synchronous and renderer roots are cleaned up.
- All three pending migrations (20260930104000, 20260930180000, 20260930190000) applied live. `delete-account` is ACTIVE with gateway JWT
  verification enabled. Anonymous POST returns 401. No exposed SECURITY DEFINER
  function is executable by anon/authenticated. Fresh security advisors: one
  warning (leaked-password protection), down from nine.
- A fresh disposable stack replayed all repository migrations; real account
  deletion passed 23 Auth/Storage/Vault checks. Full npm check/tests passed.
- Live Auth still auto-confirms email, requires eight-character new passwords (verified through Management API read-back), uses
  default SMTP and has no redirect allow-list. Confirmation/onboarding handling
  must be fixed before enabling email confirmation. Core registration now requires eight characters; existing login passwords
  remain accepted. Both projects now expire email OTPs after 600 seconds.

**Resumed on Linux on 2026-09-30. The release plan is not complete.**

Resume **task/releaseReadiness** in both repositories:

- https://github.com/AleksanderSandnes/HMI
- https://github.com/AleksanderSandnes/The_family_app

The latest code and handover are saved on those remote branches. The full updated
plan is docs/RELEASE_READINESS_PLAN.txt in both repos. Downloads contains copies:
release-readiness-plan.txt and release-readiness-handover.txt. The original local
folders were D:/Dev/HMI and D:/Dev/The_family_app. Credentials and ignored secrets
are machine-local and are not included in Git.

## Progress

- Release tooling installed; Docker/WSL repaired; hooks, secret scanning and
  task/test workflows established. Family keeps master by user decision.
- HMI dependencies updated, including Spring Boot 4.1.1. Shared core is at 100%
  coverage with per-file gates. App suites: 247 core, 115 web and 84 mobile tests.
- HMI auth storage, login redirects, cookie refresh, token error handling and
  account cache/draft isolation hardened on web and native.
- Backend now has 89 tests (one deliberate live-provider skip), 99.39% line and
  98.18% branch coverage. JDK 17 clean verification meets enforced 90% overall and
  per-class line/branch gates. Password hashing runs locally; Nashorn removed.
  Controller ownership, real provider mappings, retries and cache paths are tested.
- Family sessions use Android Keystore, with migration/restart verification and
  restored-session auth gating. Earlier verification: 502 Android, 251 iOS and
  four actual Keystore emulator tests. Native iOS uses GitHub macOS runners.
- Supabase function isolation, Vault webhook wiring and restrictive media writes
  are prepared locally. Production deployment is unfinished.

## Remaining work

- Live security remediation/deployment. Supabase: HMI xdttfrknoazcqcelieck;
  Family bntcznvsbyshetndbxfa. Last live audits had 9/24 security warnings.
- Family live SQL trigger contains a service-role credential. Coordinate Vault
  rollout and approved rotation; never put the value in Git. Add authenticated
  media URL handling before private buckets. Fresh migration reproducibility
  remains unproven.
- Coverage targets, end-to-end/release tests, branch protection, version/release
  automation and signed builds. Last full-source web/mobile lines: 20.88%/29.8%.
- Domains, support/controller details, SMTP, legal/deletion pages, moderation,
  store declarations, fictional screenshots/listings and approved uploads.
- iOS signing, Apple account actions and TestFlight/submission preparation.

## Preserve these decisions

Production main/master remain unchanged; no production merge was approved. Keep
Family master. Obtain approval for production merges, DNS, paid services, store
submissions, branch deletion and production secret rotation. Never use real user
data for demo assets. Follow repo instructions and required pre-commit checks;
update Family's Obsidian vault alongside changes.

Details: docs/RELEASE_READINESS.md, docs/SECURITY_AUDIT.md and Family's
obsidian/05_Implementation_Plan/Release Readiness.md.

## Branch protection update

Live main/test require 15 GitHub Actions quality checks and up-to-date
PRs, including administrators. Force pushes/deletion are blocked. New promotion
policy tests pass; trusted source enforcement is staged but awaits an approved
default-branch bootstrap. No bot bypass exists. Use verified task PRs to test;
production still requires explicit approval. See docs/BRANCH_PROTECTION.md.
