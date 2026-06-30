# HMI — Home Management Interface

A personal home-energy dashboard that brings **solar production** and **local weather** together in one clean, responsive interface. HMI pulls live data from a Growatt solar inverter and a Weather.com personal weather station (PWS), caches it, and visualises it across day / week / month / year charts — on the web, tablet, and mobile.

🔗 **Live demo:** https://hmi-seven.vercel.app

> ⚠️ The backend services run on Render's free tier and may take **30–60 seconds** to wake from cold start. The first request after a period of inactivity will be slow.

---

## ✨ Features

- **☀️ Solar monitoring** — real-time and historical production from a Growatt plant, with day, week, month, and year charts plus lifetime totals.
- **🌦️ Weather station** — current conditions and hourly / daily history from a Weather.com PWS, with weekly hourly breakdowns.
- **🔐 Authentication** — JWT-based login and registration; every data route is scoped to the signed-in user.
- **🗝️ Encrypted credential storage** — users supply their own Growatt and Weather.com credentials; the weather API key is encrypted at rest.
- **🔔 Notifications** — an in-app notification centre (web) and Expo push notifications (mobile/tablet), backed by daily background jobs.
- **🚀 Smart caching** — historical solar and weather data is cached in MongoDB so repeated views don't re-hit the upstream APIs.
- **📱 Responsive UI** — a Next.js web app and an Expo iOS/Android app sharing business logic.

---

## 🗂️ Monorepo

A Turborepo + npm-workspaces monorepo (laid out like the Catalyst project):

```
apps/
  web/     Next.js 16 (App Router) web app — Vercel
  mobile/  Expo / React Native iOS + Android app — EAS
packages/
  core/    @hmi/core — platform-agnostic shared logic (types, chart math,
           validation, framework-agnostic API clients) bundled into each app
backend/growattAPI/   Java Growatt service (Render)   ·   supabase/   (unchanged)
```

`@hmi/core` is a compile-time library (not a server): the `api/*` modules are
client-side helpers that call Supabase + the Java Growatt service.

---

## 🏗️ Architecture

HMI runs on **Supabase** as its platform, with one dedicated integration service (the Java
Growatt API) for the part Supabase can't host.

```
┌──────────────────┐        ┌──────────────────────────────────────────┐
│   Frontend       │───────►│   Supabase                               │
│   Next.js web    │        │   • Auth (GoTrue, ES256 JWT)             │
│   (Vercel) +     │◄──────►│   • Postgres + RLS (users/settings/      │
│   Expo mobile    │        │     notifications/weather/solar cache)   │
│ • Solar charts   │        │   • Realtime (notification center)       │
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
│ • Day/Week/Month/Yr  │
│ • Total & inverter   │
│ • Solar backfill job │
└──────────────────────┘
```

- The **frontend** talks to **Supabase** for auth, settings, weather, and notifications, and to the **Growatt API** (with its Supabase JWT) for solar charts.
- The **Growatt API** is the one component kept on Render: it needs egress-IP/proxy control because Growatt IP-blocks. It authenticates the Supabase JWT, logs into Growatt **server-side** using the user's Vault-stored credentials, and reads/writes the same Supabase Postgres (solar cache, notifications).
- The retired **Node weatherAPI** and **MongoDB** have been replaced by Supabase. Weather.com fetches run in Edge Functions; historical reads come straight from Postgres via PostgREST.

---

## 🛠️ Tech stack

| Layer            | Technologies                                                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**     | React Native 0.81, Expo SDK 54, React 19, Expo Router, TypeScript, Redux Toolkit, TanStack React Query, Gluestack UI, `react-native-chart-kit`, Formik + Yup, Axios, `crypto-js`, `expo-notifications`, `expo-video` |
| **Weather API**  | Node.js, Express 4, Mongoose 8, JWT (`jsonwebtoken`), `bcrypt`, `node-cron`, Axios                                                                                                                                   |
| **Growatt API**  | Java 17, Spring Boot, Spring Security, Spring Data MongoDB, Maven, Lombok                                                                                                                                            |
| **Data & infra** | MongoDB Atlas, Vercel (frontend), Render (both backends, Docker for Java)                                                                                                                                            |

---

## 📁 Repository structure

```
HMI/
├── app/                      # Expo Router routes ONLY (every file here is a route)
│   ├── (tabs)/               # Growatt, Weather Station, Notifications, Settings
│   ├── auth/                 # Login & register screens
│   ├── pages/                # "Premium" page implementations
│   ├── api/swagger.tsx       # Web-only Swagger UI page (/api/swagger)
│   ├── index.js              # Landing screen
│   └── _layout.tsx           # Root layout
├── src/                      # Non-route application code
│   ├── components/           # Shared UI components
│   ├── services/             # Data-mode + per-domain service layer
│   ├── redux/                # Redux store, auth slice, app wrapper
│   ├── context/  hooks/      # React context & hooks
│   ├── constants/  theme/  utils/  interface/
│   ├── api/openapi.ts        # OpenAPI spec powering the Swagger page
│   └── __tests__/            # Frontend Jest tests
├── backend/
│   ├── weatherAPI/           # Node.js / Express service
│   │   ├── controllers/  routes/  services/  models/
│   │   ├── middleware/  cron/  utils/  database/
│   │   ├── __tests__/        # Jest tests
│   │   └── server.js
│   └── growattAPI/           # Java / Spring Boot service
│       ├── src/main/java/    # controllers, entities, services, repositories
│       ├── src/test/java/    # JUnit 5 tests
│       ├── Dockerfile
│       └── pom.xml
├── assets/                   # Icons, splash, images
├── app.json                  # Expo config
├── jest.config.js            # Frontend Jest config
├── vercel.json               # Vercel build config
└── render.yaml               # Render service config
```

---

## 🚀 Getting started

### Prerequisites

- **Node.js 18+**
- **Java 17+** and **Maven** (for the Growatt API)
- **MongoDB** — a local instance for development, or a MongoDB Atlas cluster for production
- A **Growatt account** and a **Weather.com PWS API key** (entered per-user in the app's Settings)

### 1. Clone

```bash
git clone https://github.com/APSandnes/HMI.git
cd HMI
```

### 2. Weather API (Node.js)

```bash
cd backend/weatherAPI
npm install
# create a .env file (see variables below)
npm run dev        # nodemon, or `npm start` for a plain node process
```

**Environment variables**

| Variable                      | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `NODE_ENV`                    | `development` (local MongoDB) or `production` (Atlas cluster)                 |
| `PORT`                        | API port (default `5000`)                                                     |
| `MONGODB_LOCAL_URI`           | Local Mongo URI for development (default `mongodb://localhost:27017/hmi-dev`) |
| `DB_USERNAME` / `DB_PASSWORD` | Atlas credentials (production)                                                |
| `JWT_SECRET`                  | Secret for signing JWTs                                                       |
| `ENCRYPTION_KEY`              | Key used to encrypt stored Weather API keys                                   |
| `FRONTEND_URL`                | Allowed CORS origin for the deployed frontend                                 |

### 3. Growatt API (Java / Spring Boot)

```bash
cd backend/growattAPI
mvn clean package -DskipTests
mvn spring-boot:run          # or: java -jar target/growatt-1.0-SNAPSHOT.jar
```

**Environment variables**

| Variable                       | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `SERVER_PORT`                  | API port (default `8080`)                                                 |
| `SPRING_PROFILES_ACTIVE`       | `production` to use the production profile                                |
| `MONGODB_URI`                  | Mongo connection string (defaults to `mongodb://localhost:27017/hmi-dev`) |
| `GROWATT_CACHE_ENABLED`        | `true` to cache Growatt responses, `false` to always hit the live API     |
| `FRONTEND_URL` / `BACKEND_URL` | CORS / cross-service URLs                                                 |
| `PROXY_URL` / `PROXY_PORT`     | Optional outbound proxy for Growatt requests                              |

### 4. Frontend (Expo)

```bash
# from the repo root
npm install
npm run web:dev      # web against local backends (development data mode)
npm run start:dev    # Expo dev server for native (iOS/Android)
```

The data mode is controlled by `EXPO_PUBLIC_DATA_MODE`:

- **`development`** — targets local backends (`http://localhost:5000` and `http://localhost:8080`).
- **`production`** — targets the deployed Render services.

Use `npm run web:prod` / `npm run start:prod` to run the frontend against production backends. Production API URLs can be overridden with `EXPO_PUBLIC_WEATHER_API_PRODUCTION` and `EXPO_PUBLIC_JAVA_API`.

---

## 🧪 Testing

Each stack has its own independent test runner — run them from the locations below.

| Stack           | Command                             | Framework          | Test location                       |
| --------------- | ----------------------------------- | ------------------ | ----------------------------------- |
| **Frontend**    | `npm test` (from repo root)         | Jest + `jest-expo` | `src/__tests__/`                    |
| **Weather API** | `cd backend/weatherAPI && npm test` | Jest (node)        | `backend/weatherAPI/__tests__/`     |
| **Growatt API** | `cd backend/growattAPI && mvn test` | JUnit 5            | `backend/growattAPI/src/test/java/` |

Frontend extras: `npm run test:watch` (watch mode) and `npm run test:coverage` (coverage report).

> ℹ️ The Growatt API includes a live-API integration test (`GrowattWebClientTest`) that is
> `@Disabled` by default so it never breaks the build. To run it locally, add real credentials
> to `backend/growattAPI/src/test/resources/application.properties` and remove the `@Disabled`
> annotation. `MD5Test` reaches out to Growatt's servers and is skipped automatically when offline.

### Linting

```bash
npm run lint        # ESLint (Expo config) over app/ and src/
npm run lint:fix    # auto-fix where possible
```

---

## 📡 API reference

> 🔎 **Interactive docs:** when signed in on the web app, visit **`/api/swagger`** for a live
> Swagger UI covering every endpoint below (auth, account, weather, settings, notifications, and
> Growatt). The page is web-only and requires authentication.

### Weather API — `weatherAPI` (base `/api`)

| Method           | Endpoint                                      | Description                                    |
| ---------------- | --------------------------------------------- | ---------------------------------------------- |
| `GET`            | `/health`                                     | Service health check                           |
| `POST`           | `/user/register`                              | Register a new account                         |
| `POST`           | `/user/login`                                 | Log in, returns a JWT                          |
| `GET`            | `/user/account`                               | Get the current user's profile                 |
| `PUT`            | `/user/account/profile`                       | Update profile                                 |
| `PUT`            | `/user/account/password`                      | Change password                                |
| `GET`            | `/weather/current`                            | Current PWS observation                        |
| `GET`            | `/weather/hourly/:date`                       | Hourly history for a day                       |
| `GET`            | `/weather/all/:date`                          | Full history for a day                         |
| `GET`            | `/weather/weekly/:date?`                      | 7-day daily summaries                          |
| `GET`            | `/weather/weekly-hourly/:date`                | Selected hours across a week                   |
| `GET/PUT/DELETE` | `/settings/api`                               | Read / update / clear a user's API credentials |
| `GET`            | `/notifications` · `/notifications/count`     | List notifications / unread count              |
| `DELETE`         | `/notifications/clear` · `/notifications/:id` | Clear all / remove one                         |
| `POST/DELETE`    | `/notifications/push-token`                   | Register / remove an Expo push token           |

### Growatt API — `growattAPI` (base `/api/growatt`)

| Method | Endpoint                           | Description                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| `GET`  | `/health` (and `/actuator/health`) | Service health check                          |
| `POST` | `/login`                           | Authenticate with Growatt, returns plant info |
| `POST` | `/totalData`                       | Lifetime / total plant data                   |
| `POST` | `/dayChart`                        | Daily production chart                        |
| `POST` | `/weekChart`                       | Weekly production chart                       |
| `POST` | `/monthChart`                      | Monthly production chart                      |
| `POST` | `/yearChart`                       | Yearly production chart                       |
| `POST` | `/invTotalData`                    | Inverter total data                           |

---

## ☁️ Deployment

Both backends are described in `render.yaml`, and the frontend in `vercel.json`. Pushes to `main` trigger auto-deploys.

| Service     | Platform                      | Health check                 |
| ----------- | ----------------------------- | ---------------------------- |
| Frontend    | Vercel (`expo export -p web`) | https://hmi-seven.vercel.app |
| Weather API | Render (Node)                 | `/api/health`                |
| Growatt API | Render (Docker / Java)        | `/actuator/health`           |

---

## 🔐 Security notes

- All weather, settings, and notification routes require a valid JWT.
- Each user stores their own Growatt and Weather.com credentials; the Weather API key is encrypted at rest using `ENCRYPTION_KEY`.
- CORS is restricted to known frontend origins.
- Secrets are supplied via environment variables and are never committed to the repo.

---

## 📄 License

This is a personal project and is not currently published under an open-source license. Please contact the author before reusing the code.
