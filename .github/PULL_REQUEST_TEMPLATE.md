## What and why

<!-- Short description; link the issue if there is one. -->

## Checklist

- [ ] Branch is `task/*` targeting `test` (only `test` → `main` for releases)
- [ ] Conventional Commit messages, no AI attribution trailers
- [ ] `npm run check` and `npm run test` pass locally
- [ ] Backend changes: `mvn verify` passes
- [ ] Database changes are a numbered migration in `supabase/migrations/`
- [ ] No secrets, real user data or personal screenshots added
- [ ] Docs updated (`docs/ENVIRONMENTS.md` for new env vars)
