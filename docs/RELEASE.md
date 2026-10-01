# Releasing HMI

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

`mobile-release.yml` is a manual (`workflow_dispatch`) Android build through EAS. It is
inactive until `RELEASE_MOBILE_ENABLED=true` and only runs on `main`. `verify` requires the
production tip to pass every workflow in `pipeline.json` plus the version/build/changelog
checks. `build` runs in the `production` environment (owner approval): it pulls the EAS
production environment into a temporary file, validates it as data
(`scripts/release/client-config.mjs`: production project URL, publishable or anon key only,
no secret/service-role key, `EXPO_PUBLIC_DATA_MODE=production`), checks `app.json` against
the verified version and build, then runs `eas build --freeze-credentials` with the stored
signing credentials. The optional `play-internal` job needs the `submit_to_play` input,
`RELEASE_PLAY_ENABLED=true` and a `play-internal` environment approval. It has not been run
and no paid EAS build has been started; `EXPO_TOKEN` and the Play key are owner actions.

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
