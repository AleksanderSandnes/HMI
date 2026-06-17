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
- **📱 Responsive UI** — a single Expo codebase serving web, iOS, and Android from the same components.

---

## 🏗️ Architecture

HMI is a monorepo with three deployable services backed by a shared MongoDB database.

```
┌──────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│   Frontend       │      │   Weather API        │      │   Growatt API        │
│   Expo + RN web  │◄────►│   Node.js / Express  │      │   Java / Spring Boot │
│   (Vercel)       │      │   (Render)           │      │   (Render, Docker)   │
│                  │      │                      │      │                      │
│ • Solar charts   │      │ • Auth (JWT)         │      │ • Growatt login      │
│ • Weather views  │      │ • User & settings    │      │ • Day/Week/Month/    │
│ • Notifications  │      │ • Weather.com PWS    │      │   Year charts        │
│ • Settings       │      │ • Notifications/push │      │ • Total & inverter   │
└──────────────────┘      │ • Backfill cron      │      │ • Backfill job       │
        │                 └──────────┬───────────┘      └──────────┬───────────┘
        │                            │                             │
        └────────────► Growatt API ◄─┘                             │
                                     ▼                             ▼
                            ┌────────────────────────────────────────┐
                            │            MongoDB (Atlas)             │
                            │  users · settings · notifications ·    │
                            │  cached weather · cached solar data    │
                            └────────────────────────────────────────┘
```

- The **frontend** talks to the Weather API for auth, user data, weather, and notifications, and directly to the Growatt API for solar charts.
- Both backends share a single MongoDB database (`HMI` in production, `hmi-dev` locally), so the `notifications` collection and cache indexes are coordinated between them.

---

## 🛠️ Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React Native 0.74, Expo 51, Expo Router, TypeScript, Redux Toolkit, TanStack React Query, Gluestack UI, `react-native-chart-kit`, Formik + Yup, Axios, `crypto-js`, `expo-notifications` |
| **Weather API** | Node.js, Express 4, Mongoose 8, JWT (`jsonwebtoken`), `bcrypt`, `node-cron`, Axios |
| **Growatt API** | Java 17, Spring Boot, Spring Security, Spring Data MongoDB, Maven, Lombok |
| **Data & infra** | MongoDB Atlas, Vercel (frontend), Render (both backends, Docker for Java) |

---

## 📁 Repository structure

```
HMI/
├── app/                      # Expo Router frontend
│   ├── (tabs)/               # Growatt, Weather Station, Notifications, Settings
│   ├── (services)/api/       # Axios API client
│   ├── (redux)/              # Redux store, auth slice, app wrapper
│   ├── auth/                 # Login & register screens
│   ├── pages/                # "Premium" page implementations
│   ├── components/           # Shared UI components
│   ├── context/ hooks/       # React context & hooks
│   └── services/             # Data-mode + per-domain service layer
├── backend/
│   ├── weatherAPI/           # Node.js / Express service
│   │   ├── controllers/  routes/  services/  models/
│   │   ├── middleware/  cron/  utils/  database/
│   │   └── server.js
│   └── growattAPI/           # Java / Spring Boot service
│       ├── src/main/java/    # controllers, entities, services, repositories
│       ├── Dockerfile
│       └── pom.xml
├── assets/                   # Icons, splash, images
├── app.json                  # Expo config
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

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` (local MongoDB) or `production` (Atlas cluster) |
| `PORT` | API port (default `5000`) |
| `MONGODB_LOCAL_URI` | Local Mongo URI for development (default `mongodb://localhost:27017/hmi-dev`) |
| `DB_USERNAME` / `DB_PASSWORD` | Atlas credentials (production) |
| `JWT_SECRET` | Secret for signing JWTs |
| `ENCRYPTION_KEY` | Key used to encrypt stored Weather API keys |
| `FRONTEND_URL` | Allowed CORS origin for the deployed frontend |

### 3. Growatt API (Java / Spring Boot)

```bash
cd backend/growattAPI
mvn clean package -DskipTests
mvn spring-boot:run          # or: java -jar target/growatt-1.0-SNAPSHOT.jar
```

**Environment variables**

| Variable | Description |
|----------|-------------|
| `SERVER_PORT` | API port (default `8080`) |
| `SPRING_PROFILES_ACTIVE` | `production` to use the production profile |
| `MONGODB_URI` | Mongo connection string (defaults to `mongodb://localhost:27017/hmi-dev`) |
| `GROWATT_CACHE_ENABLED` | `true` to cache Growatt responses, `false` to always hit the live API |
| `FRONTEND_URL` / `BACKEND_URL` | CORS / cross-service URLs |
| `PROXY_URL` / `PROXY_PORT` | Optional outbound proxy for Growatt requests |

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

## 📡 API reference

### Weather API — `weatherAPI` (base `/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/user/register` | Register a new account |
| `POST` | `/user/login` | Log in, returns a JWT |
| `GET` | `/user/account` | Get the current user's profile |
| `PUT` | `/user/account/profile` | Update profile |
| `PUT` | `/user/account/password` | Change password |
| `GET` | `/weather/current` | Current PWS observation |
| `GET` | `/weather/hourly/:date` | Hourly history for a day |
| `GET` | `/weather/all/:date` | Full history for a day |
| `GET` | `/weather/weekly/:date?` | 7-day daily summaries |
| `GET` | `/weather/weekly-hourly/:date` | Selected hours across a week |
| `GET/PUT/DELETE` | `/settings/api` | Read / update / clear a user's API credentials |
| `GET` | `/notifications` · `/notifications/count` | List notifications / unread count |
| `DELETE` | `/notifications/clear` · `/notifications/:id` | Clear all / remove one |
| `POST/DELETE` | `/notifications/push-token` | Register / remove an Expo push token |

### Growatt API — `growattAPI` (base `/api/growatt`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` (and `/actuator/health`) | Service health check |
| `POST` | `/login` | Authenticate with Growatt, returns plant info |
| `POST` | `/totalData` | Lifetime / total plant data |
| `POST` | `/dayChart` | Daily production chart |
| `POST` | `/weekChart` | Weekly production chart |
| `POST` | `/monthChart` | Monthly production chart |
| `POST` | `/yearChart` | Yearly production chart |
| `POST` | `/invTotalData` | Inverter total data |

---

## ☁️ Deployment

Both backends are described in `render.yaml`, and the frontend in `vercel.json`. Pushes to `main` trigger auto-deploys.

| Service | Platform | Health check |
|---------|----------|--------------|
| Frontend | Vercel (`expo export -p web`) | https://hmi-seven.vercel.app |
| Weather API | Render (Node) | `/api/health` |
| Growatt API | Render (Docker / Java) | `/actuator/health` |

---

## 🔐 Security notes

- All weather, settings, and notification routes require a valid JWT.
- Each user stores their own Growatt and Weather.com credentials; the Weather API key is encrypted at rest using `ENCRYPTION_KEY`.
- CORS is restricted to known frontend origins.
- Secrets are supplied via environment variables and are never committed to the repo.

---

## 📄 License

This is a personal project and is not currently published under an open-source license. Please contact the author before reusing the code.
