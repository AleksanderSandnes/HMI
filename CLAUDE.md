# HMI monorepo

Turborepo: `packages/core` (`@hmi/core`, platform-agnostic TS), `apps/web` (Next.js),
`apps/mobile` (Expo / React Native). The shared `@hmi/core` layer is the single source of truth
for types, validation, API factories, and chart/weather helpers — consume it from both apps rather
than duplicating logic.

## Code Quality

## Release workflow

- Start from updated `main`; use `task/<descriptiveShortName>` branches.
- Use Conventional Commits. Never add Claude attribution trailers.
- Run `npm run check` and `npm run test` before every commit; never commit failed checks.
- Push task branches and merge verified tasks into `test`.
- Merge `test` into `main` only after explicit user approval.
- Install repository hooks with `git config core.hooksPath .githooks`; Gitleaks must be on PATH.
- Ask before branch renames/deletions, DNS changes, paid services, store submissions,
  or production secret rotation.

## Quality requirements

Always:

- Run `npm run check` before finishing a task (Prettier + ESLint + typecheck across all packages).
- Never disable ESLint rules.
- Never use `any` unless absolutely necessary.
- Prefer interfaces over types for object shapes.
- Keep functions under ~80 lines.
- Prefer composition over inheritance.
- Remove unused imports.
- Await all promises.
- Write readable code over clever code.
- Follow import ordering.
- Do not commit if lint, typecheck, or formatting fails.

## Tooling

- **Format:** Prettier (`.prettierrc` — double quotes, `printWidth` 100, trailing commas). Run
  `npm run format` to fix, `npm run format:check` to verify.
- **Lint:** ESLint 9 flat config, one per package (each layers the shared rules in
  `eslint.config.base.mjs` onto its framework preset — Next for web, Expo/RN for mobile). Run via
  `npm run lint` (turbo). Type-aware rules are on (`no-floating-promises`, `no-misused-promises`).
- **Types:** `npm run typecheck` (turbo, `tsc --noEmit` per package).
- **Tests:** `npm run test` (turbo) — core/web Vitest, mobile jest-expo.
