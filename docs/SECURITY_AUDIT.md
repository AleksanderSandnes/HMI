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

Web auth-proxy regression tests verify protected routes use Supabase `getUser()`
and redirect only within the request origin. Cookie refresh/removal was lost on
redirect responses, and repeated refresh batches replaced earlier cookies. The
proxy now copies outgoing cookies, including their attributes, to every replacement
or redirect response. Three tests reproduced the failures before the fix; all 11
proxy tests now pass. Production deployment and logged-in browser smoke testing
remain pending.

Push-token registration/removal previously ignored profile read and write errors.
A failed read could replace other devices' registrations with an empty list, and
a rejected write could appear successful. The shared API now stops after a failed
read and propagates write errors. Tests cover both operations; best-effort native
logout cleanup still clears the local token and permits sign-out after a failure.

The web login form passed untrusted `redirectTo` query values to `router.replace`,
allowing external redirects and potentially script execution. It now permits only
app-local paths, rejects control characters/backslashes and protocol-relative paths
after normalization, and falls back to `/dashboard`. Seventeen boundary cases and
five login-form tests verify unsafe inputs, preserved app destinations and failed
authentication. This fix is local; production deployment remains pending.

Native authentication could restore a stale initial session after sign-out and
retain previous account query data across sign-ins. Initial reads now defer to
newer auth events; account changes/sign-out clear the query and mutation caches,
including canceling pending queries. Session-read failures end loading signed out,
and sign-out errors propagate rather than appearing successful. Eleven lifecycle
tests cover these boundaries. Native consumers now remount on account changes,
removing private local drafts; the added draft regression failed before the fix.
This fix still needs a production build smoke test.

Web queries also survived logout/login across accounts. The provider now starts
from the server-verified user, cancels old queries, replaces the query/mutation
cache and remounts consumers on account changes, then refreshes server components.
Same-account token refresh preserves state. Six lifecycle tests cover caches,
local drafts, pending requests and subscription cleanup. Shared logout rejects
Supabase error results; settings displays an error and stays on the current screen
when sign-out fails. Three form tests cover success, errors and localized fallback.
