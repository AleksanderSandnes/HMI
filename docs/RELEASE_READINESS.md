# Release readiness tracker

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

Resumed on Linux on 2026-09-30. See [HANDOVER.md](HANDOVER.md) and
[the full updated plan](RELEASE_READINESS_PLAN.txt). The full release plan remains open.

Plan: `release-readiness-plan.txt`, supplied 2026-09-29. This file records verified
progress; unchecked work is not release-ready.

## Decisions

- HMI: `task/*` → `test` → `main`.
- Family App: retain `master` (user decision 2026-09-29); use `task/*` → `test` → `master`.
- Production merges, store submissions, paid services, DNS changes, destructive
  branch cleanup, and production credential rotations require explicit approval.
- Never publish real personal data in demos or store screenshots.

## Progress

- [x] Clean starting checkouts verified; task/releaseReadiness branches created.
- [x] GitHub, EAS and Vercel CLI authentication verified.
- [x] Supabase CLI, Gitleaks, Maestro, ADB, bundletool and Android SDK installed.
- [x] JDK 17 available in Gradle's provisioned toolchain cache.
- [x] Supabase authentication, linking and live security/performance advisor audits.
- [ ] Complete branch protection: quality protections are live on main/test; trusted source enforcement, release-bot provisioning and reviewed branch cleanup remain open.
- [ ] Security audit and fixes across both repositories and deployed services.
- [ ] Domains, support email, SMTP and app-link association files.
- [ ] Common-mistakes checklist verified with evidence.
- [ ] Coverage thresholds achieved; CI green on test.
- [ ] Automated versioning dry run and approved first production merge.
- [ ] Documentation, legal pages and in-app links.
- [ ] Fictional demo data, screenshot automation and store assets.
- [ ] Signed Android builds tested and approved internal-track uploads.
- [ ] iOS pipeline, signing and TestFlight preparation.

## Baseline evidence (2026-09-29)

HMI: 159 core, 64 web and 52 mobile tests pass. Lint and typecheck pass (one
existing image warning). Windows CRLF checkout caused formatting failures;
normalized files to LF and made Git's line-ending policy explicit.

Gitleaks full-history scans: HMI 306 commits, two findings of the public Supabase
`anon` JWT; Family App 369 commits, no findings. Automated scans cannot prove that
all secrets are absent. Reports are redacted and stored outside the repositories.

Initial npm audit: 2 critical, 11 high, 12 moderate vulnerabilities. High/critical
findings fixed; three moderate Expo Router dependency findings remain.
Existing tests pass after Next.js/Vitest/Vite upgrades. Android full required checks
now pass after SDK installation and existing formatting/static-analysis fixes.
See each repository's `docs/SECURITY_AUDIT.md` for unresolved security work.

Vercel CLI is authenticated as `apsandnes`, but that account's available team has
no projects/domains. The Family vault already records `thefamilyapp.app` and
Resend SMTP; production ownership/access needs verification, not a new purchase.

## Coverage work (2026-09-30)

An explicit V8 run including `packages/core/src/**/*.ts` and excluding test files
measured the initial shared core at 74.35% lines, 72.85% statements, 69.24% branches,
and 70.21% functions. Added behavioral tests for account ownership and failure paths,
avatar uploads, authentication registration/sign-out, integration secret boundaries,
weather cache expiry and upstream fallback, notification lifecycle and device tokens.
The resulting 192 core tests pass: 96.88% lines, 95.70% statements, 87.16% branches,
and 94.68% functions. The plan's 100% core target is still open; no threshold has
been lowered or uncovered production code excluded to satisfy it.

Additional provider-response, period-math, localization and dashboard-query tests
bring the core to 233 passing tests, 100% lines and functions, 99.38% statements,
and 96.22% branches. Remaining branch gaps include date/translation fallbacks and
validation error handling; the 100% branch gate remains unfinished. The Growatt
health probe now clears its timeout on success, HTTP failure, transport failure,
and abort; all four cases are tested. That fix passed local full checks and CI,
CodeQL and secret scanning before advancing into `test`.

The core now passes all four coverage metrics at 100% with 244 tests. Coverage is
enabled on every core test run and includes all source TypeScript except test
files. Per-file thresholds enforce 100% lines, branches, functions and statements;
CI publishes the summary and coverage artifact. Removed an unreachable label
formatting branch (the sampler always uses 12 points per hour) and a redundant
fallback after the weather extractor, which always returns at least one series.
Unexpected registration-validator failures now propagate instead of returning an
empty validation-error map. Web/mobile/backend and Family coverage targets remain
open; this result does not mark the overall coverage phase complete.
An unimported, untested temporary source module was rejected by the per-file gate
with 0% lines/functions/statements; the probe was removed before final checks.

Initial whole-application baselines include untested source files: web 8.78% lines
(app/components/hooks/lib/utils), mobile 24.87% lines (app/src, excluding tests and
declarations). Passing the existing suites does not meet the plan's 80% overall
and 90% logic thresholds. New tests exercise notification query refresh/cleanup,
mutation failures, native push-token persistence/logout cleanup, and boolean
preferences. Preference storage failures now retain the current/default setting
without an unhandled rejection; pending reads cannot update an unmounted hook.
Current suites contain 247 core, 115 web and 84 mobile tests. Added responsive-hook
resize/server-render/cleanup and shared navigation-state coverage. Auth-proxy tests
exposed dropped refreshed/cleared cookies on redirects and erased earlier refresh
batches; fixed cookie copying and verified all 11 proxy cases. Push-token API read
failures now stop writes, and failed updates no longer appear successful. Overall
web/mobile coverage thresholds are still pending.

Login accepted arbitrary `redirectTo` query values, including script URLs, in
Next's client router. It now accepts only app-local paths and falls back to the
dashboard for external, protocol-relative, backslash, control-character and
unsafe normalized paths. Seventeen boundary cases and five real login-form tests
verify safe navigation and no navigation after authentication failure.

Native auth now ignores delayed initial session results after a newer auth event,
ends loading safely after session-read failures, and clears account query/mutation
caches before switching accounts or signing out. Sign-out errors propagate to the
caller. Eleven lifecycle tests cover initialization, failure, sign-out races, cache
isolation (including pending requests), local drafts, token refresh and unmount
cleanup. Account changes remount native consumers so component state cannot cross
accounts; the local-draft regression failed before adding that boundary.

Web query state now starts with the server-verified account identity. An auth
account change cancels and clears the old cache, creates a new query client,
remounts consumers to remove old local state, and refreshes server components.
Token refresh for the same account retains its cache. Six lifecycle tests cover
account switches, sign-out, initial session, pending requests and cleanup. The
shared logout API propagates rejected results; three settings tests verify success
navigation and visible failures without false navigation. Overall coverage remains
below target: the last full-source baseline was web 20.88% and mobile 29.8% lines.

The Java backend now records JaCoCo coverage during `mvn verify`, includes all
compiled production classes without custom exclusions, and produces HTML/XML/CSV
reports in `backend/growattAPI/target/site/jacoco`. CI publishes all counters in
the job summary and uploads the report; a missing report fails the reporting step.
The first JDK 17 run passes 29 tests (one existing skip) with 23% lines (112/487),
35.98% branches and 26.24% instructions across 27 executable classes. Largest
gaps are GrowattWebClient, GrowattDataService, SolarBackfillJob and session/error
handling. This is a measured baseline, not a completed coverage gate.

Final handover: backend verification now passes 63 tests (one live-provider skip),
with 76.92% lines and 69.09% branches. Added session, transport, cache, cron and
error tests. Removed cookies/raw exception details from logs and stored failures,
rejected unsuccessful logins, replaced stale cookies and remembered failed month
fetches within weekly requests. No production deployment or merge was performed.

The installed Vercel connector lists HMI and `thefamilyapp-web`, but deployment
access to their account scope returns HTTP 403. Its project-details tool also
returns an input-validation error with the documented arguments. Ownership and
deployment configuration are therefore still unverified. XcodeBuildMCP cannot
run Apple's tools on this Windows host (`xcrun` is unavailable); macOS CI remains
the verified iOS build/test route.

## Pending user/account actions

- Supabase login completed and both repositories linked to the correct projects.
- Choose owned domains and support/controller contact information before legal
  pages and DNS can be finalized.
- Confirm licensing, legal text, store declarations and production release actions
  after the concrete artifacts have been prepared for review.

## Linux continuation (2026-09-30)

- Reinstalled Node dependencies with npm ci; existing node_modules lacked runnable
  tooling. npm audit reports three moderate findings and no high/critical findings.
- JDK 17 clean Maven verification passes 89 backend tests (one deliberately gated
  live-provider test skipped), 99.39% lines and 98.18% branches across all 28
  compiled production classes. Every method and class is exercised.
- JaCoCo now enforces 90% lines and branches both overall and per class in mvn verify,
  including CI. No production-class exclusions or lowered targets were introduced.
- Added real provider-shape chart, retry-limit, snapshot/year cache, failure,
  backfill, JSON request, cache identity and per-login client isolation tests.
  Controller tests verify caller plant IDs are overridden by authenticated settings
  and cache hits avoid login; multiple live fetches share a request-local session.
- A temporary untested source class failed verification at 0% lines/branches despite
  high aggregate coverage. Removed the probe before final clean verification.
- Removed runtime remote JavaScript password hashing and the Nashorn dependency;
  offline provider compatibility vectors and fail-closed tests pass.
- npm run check and all 247 core / 115 web / 84 mobile tests pass. Formatting
  skips generated Maven targets and ignored machine-local tool/settings files.

This closes the backend's initial 90% coverage threshold gap. Whole-app coverage,
coverage-drop detection, UI/E2E/release verification, production security rollout
and all other unchecked release requirements remain open.

The inherited remote CI failure was a mobile auth-test timing bug: inactive
fixtures used gcTime=0 and could disappear while awaiting a late session result.
Use indefinite fixture lifetimes with explicit afterEach cleanup so assertions
measure auth-driven removal. A delayed regression fails with the old configuration
and passes after the fix; production auth behavior is unchanged.
