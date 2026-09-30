# Contributing

## Branches

1. Start from an updated `main`: `git checkout main && git pull`.
2. Create `task/<descriptiveShortName>` (camelCase), e.g. `task/storeScreenshots`.
3. Open a pull request from the task branch into `test`. `test` and `main` are
   protected: CI must be green and the branch up to date. Never push to them.
4. `test` → `main` is the production promotion and happens only after explicit
   approval from the owner.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) — the release
version is computed from them (`feat` → minor, `fix`/`perf` → patch, `!` or
`BREAKING CHANGE:` → major). Never add AI co-author or attribution trailers;
the `commit-msg` hook rejects them.

## Local setup

```sh
git config core.hooksPath .githooks   # gitleaks pre-commit + commit-msg policy
npm ci
```

Gitleaks must be on `PATH`. The backend needs JDK 17 and Maven.

## Required checks before every commit

```sh
npm run check        # Prettier, ESLint, typecheck
npm run test         # core/web Vitest + mobile jest-expo (coverage gates)
npm run test:release # release tooling
(cd backend/growattAPI && mvn verify)   # when the backend changed
```

Do not commit when any check fails, and never disable lint rules.

See `docs/RELEASE.md` for releases and `docs/ENVIRONMENTS.md` for configuration.
