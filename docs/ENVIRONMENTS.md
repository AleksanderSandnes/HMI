# Environments and configuration

Names and locations only — never commit values. Local values live in ignored
`.env*` files; see `.gitignore`.

## Environments

| Environment | Web                                                                                  | Backend                                  | Database                            |
| ----------- | ------------------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------- |
| Local       | `npm run web` (localhost)                                                            | `SPRING_PROFILES_ACTIVE=local`           | `supabase start`                    |
| Preview     | Vercel preview for `test`/task branches (protected)                                  | —                                        | production project, read paths only |
| Production  | Vercel production from `main` (`hmi-six.vercel.app` until a custom domain is bought) | Render `growattAPI`, auto-deploys `main` | Supabase `xdttfrknoazcqcelieck`     |

## Web — Vercel project env (Production / Preview)

| Name                            | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase API URL (public)                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key (public by design)            |
| `NEXT_PUBLIC_JAVA_API`          | Growatt backend base URL                                    |
| `NEXT_PUBLIC_DATA_MODE`         | `production` in deployed builds; `development` only locally |

No service-role key may ever use a `NEXT_PUBLIC_*` name.

## Mobile — EAS environment `production`

| Name                            | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase API URL (public)                       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public by design)            |
| `EXPO_PUBLIC_JAVA_API`          | Growatt backend base URL                        |
| `EXPO_PUBLIC_DATA_MODE`         | Set per build profile in `apps/mobile/eas.json` |

Signing keys are managed by EAS credentials (`eas credentials`). The Play upload
service account is `apps/mobile/play-service-account.json` locally (ignored) or
the EAS submit profile.

## Backend — Render service `growattAPI`

| Name                                                  | Purpose                                                 |
| ----------------------------------------------------- | ------------------------------------------------------- |
| `SERVER_PORT`, `SPRING_PROFILES_ACTIVE`               | Runtime (in `render.yaml`)                              |
| `FRONTEND_URL`                                        | Allowed CORS origin — must be the production web domain |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` | Supabase pooler (in `render.yaml`)                      |
| `SPRING_DATASOURCE_PASSWORD`                          | **Secret**, Render dashboard only                       |
| `SUPABASE_JWKS_URI`, `SUPABASE_JWT_ISSUER`            | JWT validation (defaults to the production project)     |
| `DB_POOL_SIZE`                                        | Optional Hikari pool size (default 5)                   |
| `PROXY_URL`, `PROXY_PORT`                             | Optional outbound proxy                                 |

## Supabase

| Name                                                             | Where                                        | Purpose                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Injected into Edge Functions by the platform | Function clients                                                                       |
| `edge_service_role_key`                                          | Vault secret                                 | Used by `invoke_edge_function` for pg_cron jobs (`supabase/post_deploy/cron_jobs.sql`) |
| User Weather.com keys and Growatt passwords                      | Vault, one secret per user                   | Referenced by id from `user_settings`                                                  |

Auth settings (Site URL, redirect allow-list, SMTP, leaked-password protection)
are dashboard/Management API settings; see `docs/RELEASE_READINESS.md`.

## GitHub Actions

| Name                                                                     | Kind                             | Used by                                                         |
| ------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------- |
| `GITHUB_TOKEN`                                                           | automatic                        | CI, CodeQL, Security, releases                                  |
| `EXPO_TOKEN`                                                             | secret, `production` environment | Android store build after a release (optional until configured) |
| `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_EMAIL`, `E2E_PASSWORD` | secrets                          | Playwright smoke against a demo account (fictional data only)   |

## Release automation configuration

| Name                      | Kind                | Purpose                                                                           |
| ------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `RELEASE_PREPARE_ENABLED` | repository variable | `true` enables task release PR creation; otherwise patch preview only             |
| `RELEASE_DRAFT_ENABLED`   | repository variable | `true` enables tags and draft GitHub Releases after production CI                 |
| `RELEASE_BOT_TOKEN`       | optional secret     | scoped Contents/PR write token for release proposals with automatic CI; no bypass |

Configure the `production` environment and owner approval before activation.
No activation variables or credentials were added by preparing the workflows.
