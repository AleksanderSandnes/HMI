# Releasing HMI

## Flow

1. Work lands in `test` through task PRs (see `CONTRIBUTING.md`).
2. **Prepare the version** on a task branch from `test`:
   ```sh
   git checkout test && git pull && git checkout -b task/releaseVX
   npm run release:prepare            # add --dry-run to preview
   ```
   The tool reads Conventional Commits in `origin/main..HEAD`, picks the SemVer
   bump, writes the version into every `package.json`, `package-lock.json` and
   `apps/mobile/app.json` (`expo.version`, `android.versionCode` and
   `ios.buildNumber` are both incremented), and prepends `CHANGELOG.md`.
   Commit as `chore(release): vX.Y.Z` and open a PR to `test`.
3. **Promote**: open `test` → `main`. It is merged only after explicit owner
   approval. Because the bump already happened on `test`, nothing has to push
   to protected `main` and `test` already carries the new version.
4. **Publish**: after the merge, tag `vX.Y.Z` on the merge commit and create the
   GitHub Release from the matching `CHANGELOG.md` section
   (`node scripts/release/release.mjs notes`).
5. **Deploy**: Vercel deploys `main` to production; Render auto-deploys the
   backend from `main`; numbered migrations are applied to Supabase
   (`supabase db push` or the reviewed MCP/SQL editor path), then advisors are
   re-run.
6. **Mobile**: `cd apps/mobile && eas build -p android --profile production`,
   then `eas submit -p android --profile production` (internal track). Promote
   internal → closed → production in Play Console with a staged rollout. iOS
   follows the same path with `-p ios` once the Apple account is active.

`versionCode` must always exceed what Play already has (currently 3).
`eas.json` uses `appVersionSource: local` with `autoIncrement: false`, so the
release tool is the single owner of version numbers.

## Rollback

- Web: promote the previous production deployment in Vercel.
- Backend: redeploy the previous Render deploy.
- Mobile: halt the staged rollout in Play Console and ship a fixed build with a
  higher `versionCode` (Play does not allow downgrades).
- Database: write a forward migration; never edit applied migrations.
