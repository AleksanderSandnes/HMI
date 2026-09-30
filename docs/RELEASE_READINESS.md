# Release readiness tracker

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
- [ ] Supabase authentication, linking and live security/performance advisors.
- [ ] Branch protections and reviewed stale-branch cleanup proposal.
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
Current suites contain 246 core, 106 web and 73 mobile tests. Added responsive-hook
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
