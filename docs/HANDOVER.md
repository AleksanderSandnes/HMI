# Release readiness handover — 30 September 2026

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
- Live Auth still auto-confirms email, permits six-character passwords, uses
  default SMTP and has no redirect allow-list. Confirmation/onboarding handling
  must be fixed before enabling email confirmation. Core registration currently
  permits four characters, so validators also need alignment.

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
