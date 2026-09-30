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
- Maven verify passes on JDK 17: 28 tests, zero failures/errors, one existing skipped test.
  Five new security tests exercise unauthorized endpoints, bearer requests and CORS.
- Added Maven verification and core/Next builds to CI; checks passed on task/test
  before the dependency update. The dependency update requires a fresh CI run.
- Upgraded Spring Boot 3.5.3 through verified 3.5.16 to 4.1.1 and Nashorn 15.6 to
  15.7. Adapted modular web/security test starters, EntityScan, Jackson 3 mappers
  and the Spring Security header DSL. Full production-profile startup with an
  isolated in-memory database verifies public health and protected data/actuator
  routes. Render deployment and real database smoke testing remain pending.
- Supabase advisors still report leaked-password protection, one mutable search path,
  pg_net extension placement and callable privileged functions. Review remains open.

Issuer/JWKS configuration follows [Spring Security documentation](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).

CodeQL now scans TypeScript/JavaScript, the Java backend and workflows. Added
Docker and GitHub Actions dependency updates alongside Maven/npm. Initial scans
are pending; scheduled scans and Dependabot activation await the approved main merge.

Initial CodeQL scans completed. Returned exception messages exposed internal details
in weather/push functions; responses and stored job failures now use fixed messages.
Maintenance/push functions additionally reject user/anon JWTs and require the exact
server credential. Browser CORS is restricted to the verified production web origin.
All five live functions have gateway JWT verification enabled; local changes are not
yet deployed. New Deno authorization/error-response tests are included in CI.

CodeQL also flags disabled CSRF in the Java API. Its filter chain uses stateless
bearer authentication, with no form/basic authentication or auth cookie; a browser
cannot supply another user's Authorization token automatically. Review this finding
alongside authentication regression tests before deciding its disposition; it has
not been silently suppressed or marked fixed.
