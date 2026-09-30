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

## Pending user/account actions

- Supabase login completed and both repositories linked to the correct projects.
- Choose owned domains and support/controller contact information before legal
  pages and DNS can be finalized.
- Confirm licensing, legal text, store declarations and production release actions
  after the concrete artifacts have been prepared for review.
