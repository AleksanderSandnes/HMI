# HMI monorepo

Turborepo: `packages/core` (`@hmi/core`, platform-agnostic TS), `apps/web` (Next.js),
`apps/mobile` (Expo / React Native). The shared `@hmi/core` layer is the single source of truth
for types, validation, API factories, and chart/weather helpers — consume it from both apps rather
than duplicating logic.

## Code Quality

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
