# HMI — Home Management Interface

A personal home-energy dashboard that brings **solar production** and **local weather** together in
one clean, responsive interface. HMI pulls live data from a Growatt solar inverter and a Weather.com
personal weather station (PWS), caches it, and visualises it across hour / week / month / year / 5-year
charts — on the web, tablet, and mobile.

🔗 **Live website:** https://hmi-seven.vercel.app

> ⚠️ The Growatt service runs on Render's free tier and may take **30–60 seconds** to wake from a cold
> start. The first solar request after a period of inactivity will be slow.

---

## ✨ Features

- **☀️ Solar monitoring** — real-time and historical production from a Growatt plant (hourly, weekly,
  monthly, yearly, 5-year) plus lifetime totals, peak markers, and utilisation.
- **🌦️ Weather station** — current conditions plus hourly and weekly history from a Weather.com PWS.
  On phones the weekly view collapses to 7 daily min/max/avg bands; tablets show the dense series.
- **🔐 Authentication** — Supabase Auth (GoTrue, ES256 JWT); every row is scoped to the signed-in user.
- **🗝️ Encrypted credential storage** — users supply their own Growatt and Weather.com credentials;
  secrets live in Supabase **Vault**, never in plaintext columns or on the client.
- **🔔 Notifications** — a Realtime in-app notification centre (web) and Expo push (mobile/tablet),
  driven by daily background jobs (pg_cron + Edge Functions).
- **🚀 Smart caching** — historical solar/weather data is cached in Postgres so repeat views don't
  re-hit the upstream APIs.
- **📱 Responsive UI** — a Next.js web app and an Expo iOS/Android app sharing one business-logic layer.

---

## 🗂️ Monorepo

A **Turborepo + npm-workspaces** monorepo:

```
apps/
  web/      Next.js 16 (App Router) web app — deployed on Vercel
  mobile/   Expo SDK 54 / React Native iOS + Android app — built with EAS
packages/
  core/     @hmi/core — platform-agnostic shared logic (types, validation, chart math,
            weather/solar helpers, framework-agnostic API clients) bundled into each app
backend/
  growattAPI/   Java 17 / Spring Boot — the one dedicated integration service (Render)
  weatherAPI/   ⚠️ RETIRED Node service, kept for reference only (replaced by Supabase)
supabase/   Postgres schema, RLS, Auth, Realtime, Edge Functions, pg_cron, Vault
```

`@hmi/core` is a **compile-time library**, not a server: its `api/*` modules are client-side helpers
that call Supabase + the Java Growatt service. Both apps consume it as the single source of truth —
neither duplicates types, validation, or chart logic.

---

## 🏗️ Architecture

HMI runs on **Supabase** as its platform, with one dedicated integration service (the Java Growatt
API) for the part Supabase can't host.

```
┌──────────────────┐        ┌──────────────────────────────────────────┐
│   Frontend       │───────►│   Supabase                               │
│   Next.js web    │        │   • Auth (GoTrue, ES256 JWT)             │
│   (Vercel) +     │◄──────►│   • Postgres + RLS (profiles/settings/   │
│   Expo mobile    │        │     notifications/weather + solar cache) │
│ • Solar charts   │        │   • Realtime (notification centre)       │
│ • Weather views  │        │   • Edge Functions: weather-current /    │
│ • Notifications  │        │     weather-history / weather-backfill / │
│ • Settings       │        │     send-push / outage-monitor           │
└──────┬───────────┘        │   • pg_cron · Vault (secrets)            │
       │                    └──────────────────────────────────────────┘
       │  Supabase JWT                         ▲ reads/writes Postgres
       ▼                                       │
┌──────────────────────┐                       │
│   Growatt API        │───────────────────────┘
│   Java / Spring Boot │
│   (Render, Docker)   │──► server.growatt.com  (server-side login from Vault)
│ • Hour/Wk/Mo/Yr/5yr  │
│ • Total & inverter   │
└──────────────────────┘
```

- The **frontend** talks to **Supabase** for auth, settings, weather, and notifications, and to the
  **Growatt API** (presenting its Supabase JWT) for solar charts.
- The **Growatt API** is the one component kept on Render: it needs egress-IP/proxy control because
  Growatt IP-blocks. It validates the Supabase JWT (against the project JWKS), logs into Growatt
  **server-side** with the user's Vault-stored credentials, and reads/writes the same Supabase
  Postgres (solar cache, notifications).
- **Weather.com** is a plain REST API (no IP-blocking), so its fetches run in Supabase **Edge
  Functions**; historical reads come straight from Postgres via PostgREST.
- The old **Node weatherAPI** and **MongoDB** are **retired** — replaced by Supabase. The
  `backend/weatherAPI/` directory remains only for historical reference and is not deployed.

---

## 🛠️ Tech stack

| Layer           | Technologies                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Web**         | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, TanStack Query, Recharts                  |
| **Mobile**      | Expo SDK 54, React Native 0.81, Expo Router, NativeWind v4, Victory Native XL + Skia, TanStack Query  |
| **Shared**      | `@hmi/core` — TypeScript, Yup validation, pure chart/weather/solar helpers                            |
| **Growatt API** | Java 17, Spring Boot, Spring Security (OAuth2 resource server / JWKS), Spring Data JPA, Maven, Lombok |
| **Platform**    | Supabase (Postgres + Auth + Realtime + Storage + Edge Functions + pg_cron + Vault)                    |
| **Infra**       | Vercel (web), EAS (mobile), Render (Java, Docker)                                                     |
| **Tooling**     | Turborepo, ESLint 9 (flat config), Prettier, Vitest (core/web), jest-expo (mobile), GitHub Actions    |

---

## 🚀 Local development

The whole stack runs locally. Minimum to see the app working: **Supabase (local) + one of the apps**.
Add the **Java Growatt service** when you want live solar charts.

### Prerequisites

| Tool                       | Version        | Needed for                                            |
| -------------------------- | -------------- | ----------------------------------------------------- |
| **Node.js**                | 22 (LTS)       | everything (web, mobile, core, tooling)               |
| **npm**                    | 10+            | workspaces                                            |
| **Supabase CLI**           | ≥ 2.108        | local Supabase stack (`supabase start`)               |
| **Docker** (or Podman)     | running daemon | **required** by the local Supabase stack              |
| **Java JDK + Maven**       | 17+            | the Growatt API (optional — only for live solar data) |
| **Watchman** (recommended) | latest         | faster Metro file-watching for mobile                 |

> 💡 The Supabase CLI is already present at `~/.local/bin/supabase`. Docker is **not** installed by
> default on this machine — install Docker Desktop / `docker` and start the daemon before
> `supabase start`, or the local stack won't come up.

### 1. Install dependencies

```bash
git clone https://github.com/AleksanderSandnes/HMI.git
cd HMI
npm install        # installs every workspace (web, mobile, core)
```

### 2. Start Supabase locally

The local stack is fully described by `supabase/config.toml`, and the schema is applied from
`supabase/migrations/*` automatically.

```bash
supabase start     # boots Postgres, Auth, Realtime, Storage, Studio (needs Docker)
```

This prints (and `supabase status` re-prints) the local endpoints and keys:

| Service        | URL                                                       |
| -------------- | --------------------------------------------------------- |
| API gateway    | `http://127.0.0.1:54321`                                  |
| Postgres       | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio (GUI)   | `http://127.0.0.1:54323`                                  |
| Mailpit (SMTP) | `http://127.0.0.1:54324` (catches auth emails)            |

Copy the printed **`anon key`** — you'll paste it into the app env files below. Email confirmation is
disabled locally, so registering returns a session immediately.

Useful commands:

```bash
supabase status                         # show URLs + keys again
supabase db reset                       # re-apply all migrations from scratch
supabase functions serve                # run Edge Functions locally (weather-*, send-push, …)
supabase stop                           # tear the stack down
```

### 3. Configure environment

Copy the example files and point them at your **local** Supabase (`http://127.0.0.1:54321`) using the
`anon key` from `supabase status`.

```bash
cp apps/web/.env.example    apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

**`apps/web/.env.local`**

```bash
NEXT_PUBLIC_DATA_MODE=development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key from `supabase status`>
# Leave blank to call the local Java service at http://localhost:8080 in dev,
# or set https://growattapi.onrender.com to use the deployed solar backend.
NEXT_PUBLIC_JAVA_API=
```

**`apps/mobile/.env`** — same values with the `EXPO_PUBLIC_` prefix:

```bash
EXPO_PUBLIC_DATA_MODE=development
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local anon key from `supabase status`>
EXPO_PUBLIC_JAVA_API=
```

> 📱 **Devices can't reach `127.0.0.1`.** The iOS simulator and Expo web can, but an **Android
> emulator** needs `http://10.0.2.2:54321` and a **physical device** needs your machine's LAN IP
> (e.g. `http://192.168.1.20:54321`). Adjust `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_JAVA_API`
> accordingly.
>
> To develop against the **hosted** Supabase project instead of a local stack, point the URL/anon-key
> at it and keep `DATA_MODE=development`.

### 4. Run an app (development mode)

**Web** (Next.js, http://localhost:3000):

```bash
npm run web            # → next dev in apps/web
```

**Mobile** (Expo dev server):

```bash
npm run mobile         # → expo start in apps/mobile
# or target a platform directly:
npm --workspace @hmi/mobile run ios       # iOS simulator
npm --workspace @hmi/mobile run android   # Android emulator
npm --workspace @hmi/mobile run web       # Expo web
```

> Charts use Victory Native XL + Skia, which need a **dev build** (not Expo Go) — `expo-dev-client`
> is already configured; build it once with EAS or `expo run:ios` / `expo run:android`.

### 5. (Optional) Run the Growatt API for live solar data

Auth, weather, settings, and notifications work with Supabase alone. The Java service is only needed
for **Solar** charts. It connects to your local Supabase Postgres and validates local Supabase JWTs:

```bash
cd backend/growattAPI
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run      # serves http://localhost:8080
```

The bundled `local` profile (`src/main/resources/application-local.properties`) defaults to the local
Supabase Postgres (`localhost:54322`, `postgres`/`postgres`) and the local JWKS
(`http://localhost:54321/auth/v1/.well-known/jwks.json`) — no extra env needed. Override any value
with the matching `SPRING_DATASOURCE_*` / `SUPABASE_JWKS_URI` env var.

### 6. First run

1. Open the app → **Register** (returns you logged-in; no email step locally).
2. **Settings** → enter your Growatt account + password and Weather.com station id + API key. The
   plant id is derived server-side; secrets are stored in Vault.
3. Solar charts populate once the Growatt service can log in; weather populates via the Edge Functions
   (`supabase functions serve`).

---

## 🧪 Quality gate

Run the whole gate from the repo root (Turborepo fans out across `core`, `web`, `mobile`):

```bash
npm run check     # prettier --check + eslint (per package) + tsc --noEmit
npm run test      # vitest (core/web) + jest-expo (mobile)
```

Granular:

| Task        | Command                                                              |
| ----------- | -------------------------------------------------------------------- |
| Format      | `npm run format` (write) · `npm run format:check`                    |
| Lint (all)  | `npm run lint`                                                       |
| Lint (one)  | `npm run lint --workspace @hmi/core` (or `@hmi/web` / `@hmi/mobile`) |
| Typecheck   | `npm run typecheck`                                                  |
| Tests (all) | `npm run test`                                                       |
| Growatt API | `cd backend/growattAPI && mvn test`                                  |

CI (`.github/workflows/ci.yml`) runs a **per-package lint matrix** plus the **test** suites and a
Prettier + typecheck **quality** job on every push / PR to `main` and `test`.

---

## 🌿 Branching & deployment

Work flows **feature → `test` → `main`** — never commit straight to `main`.

| Target      | Platform                      | Trigger / health                                    |
| ----------- | ----------------------------- | --------------------------------------------------- |
| Web         | Vercel (Next.js)              | push to `main` · https://hmi-seven.vercel.app       |
| Mobile      | EAS                           | manual EAS build / submit                           |
| Growatt API | Render (Docker / Java)        | push to `main` (`render.yaml`) · `/actuator/health` |
| Supabase    | Supabase (GitHub integration) | `supabase/migrations/*` applied on merge            |

Deploy env vars are set in each platform's dashboard (never committed): Vercel gets `NEXT_PUBLIC_*`;
Render gets `SPRING_DATASOURCE_PASSWORD` (the Supabase DB password) and the rest from `render.yaml`.
After a fresh deploy, schedule the pg_cron jobs once via `supabase/post_deploy/cron_jobs.sql`.

---

## 🔐 Security notes

- Every table is protected by **RLS** (`auth.uid() = auth_id`); weather rows are readable by the user
  whose configured station matches.
- Each user stores their own Growatt and Weather.com credentials in **Supabase Vault** — never in
  plaintext columns or on the client.
- The Java service validates Supabase-issued JWTs against the project **JWKS** (ES256).
- CORS is restricted to known frontend origins; secrets come from environment variables / Vault and
  are never committed.

---

## 📄 License

This is a personal project and is not currently published under an open-source license. Please
contact the author before reusing the code.
