# Security audit — in progress

Date: 2026-09-29. Scope: tracked source, dependency tree and all local Git refs.
Supabase CLI authenticated and linked on 2026-09-30; live policy review is in progress. Render/Vercel production configuration remains unverified.

| Finding                                                                      | Remediation / evidence                                                                                                                                                                                                                | Status                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Public Supabase anon JWT embedded in EAS config and historical npm scripts   | Confirmed `role=anon`; use existing EAS production environment. Exact historical fingerprints documented in `.gitleaksignore`. No broad JWT exclusion.                                                                                | Fixed locally               |
| 2 critical and 11 high npm dependency findings at baseline                   | Upgrade Next.js and Vitest/Vite; patch transitive dependencies. Metro PNG dimensions checked with image-size 2.0.4. `npm audit --audit-level=high` passes; three moderate findings remain in Expo Router's decoding dependency chain. | High/critical fixed locally |
| No mandatory secret scan                                                     | Gitleaks pre-commit hook and full-history CI job; commit-message hook rejects Claude attribution.                                                                                                                                     | Added, CI pending           |
| Missing secret-file ignore patterns                                          | Ignore keystores, Firebase files, local properties and iOS secrets.                                                                                                                                                                   | Fixed locally               |
| Missing web security headers                                                 | Add HTTPS/security headers, framing protection and a baseline CSP. CSP does not yet restrict script sources; stronger nonce policy needs integration testing.                                                                         | Partial                     |
| Git and EAS both own version increments; production-track submission default | Disable EAS auto-increment; select internal Play track. Automated Git versioning still pending.                                                                                                                                       | Partial                     |
| Native auth session stored in AsyncStorage                                   | SecureStore adapter with chunked encrypted storage and plaintext migration implemented. Ten tests cover Unicode, interrupted writes, concurrent refresh/logout and cleanup. Native device smoke test pending.                         | Open                        |
| Production branch and test lack protection                                   | Verified with GitHub API. Configure required checks after establishing CI jobs and release-bot design.                                                                                                                                | Open                        |

Gitleaks scanned 306 commits: the only two findings were the historical public
anon key above. No service-role credentials were detected; this is not a guarantee
that every possible credential is absent. Do not rotate public anon keys merely
because a JWT detector reports them.

Next: live RLS/storage/auth/edge audit, backend dependency and authorization audit,
encrypted session migration, release build validation, account deletion and UGC
requirements, and required coverage thresholds. Do not mark this report complete
until each has evidence.

## Live audit and backend follow-up (2026-09-30)

- All seven public tables have RLS. Policies restrict rows to auth.uid(), directly
  or through the user's linked station/plant. No public-schema views found.
- Vault RPC and edge invocation are not executable by anon/authenticated.
  Anonymous execution of the integration-health pruning function is a finding.
  Prepared a migration restricting it to service_role and revoking trigger RPC access;
  migration has not been applied to production.
- Added exact-origin CORS using FRONTEND_URL; production excludes localhost and
  wildcard previews. Bearer auth does not enable credentialed cookie CORS.
- Only health probes are public; production actuator exposes health without details.
  JWT configuration now validates issuer and authenticated audience.
- Maven verify passes: 27 tests, zero failures/errors, one existing skipped test.
  Five new security tests exercise unauthorized endpoints, bearer requests and CORS.
- Added Maven verification and core/Next builds to CI; remote result pending.
- Supabase advisors still report leaked-password protection, one mutable search path,
  pg_net extension placement and callable privileged functions. Review remains open.

Issuer/JWKS configuration follows [Spring Security documentation](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).
