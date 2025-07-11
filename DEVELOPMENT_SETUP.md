# Development Mode Setup Guide

This guide will help you set up the Solar Power Dashboard in development mode with local endpoints only.

## Security Notice 🔒

**Credential Management:**

- Never commit real credentials to version control
- Use the in-app Credentials Settings (Settings → API Credentials) for secure storage
- Environment variables are fallback only
- Credentials are stored securely on device using encrypted storage

## Prerequisites

1. **MongoDB Local Instance**

   - Install MongoDB locally
   - Start MongoDB service: `mongod --dbpath /your/db/path`
   - Default URI: `mongodb://localhost:27017/hmi-dev`

2. **Node.js and Java**
   - Node.js 16+ for weather API
   - Java 17+ for Growatt API

## Backend Setup

### 1. Weather API (localhost:5000)

```bash
cd backend/weatherAPI
```

Create `.env` file:

```env
NODE_ENV=development
MONGODB_LOCAL_URI=mongodb://localhost:27017/hmi-dev
PORT=5000

# Production credentials (only for production)
# DB_USERNAME=your_atlas_username
# DB_PASSWORD=your_atlas_password
```

Start the server:

```bash
npm install
npm start
```

Verify: Visit `http://localhost:5000/api/health`

### 2. Growatt API (localhost:8080)

```bash
cd backend/growattAPI
```

Create `.env` file (copy from `.env.template`):

```env
# Growatt credentials - Use secure values, not defaults
GROWATT_USERNAME=your_secure_username@domain.com
GROWATT_PASSWORD=your_secure_password
```

Start the server:

```bash
mvn spring-boot:run
```

Verify: Visit `http://localhost:8080/api/growatt/health`

## Frontend Setup

### Environment Configuration

Set these environment variables or create `.env.local`:

```env
EXPO_PUBLIC_DATA_MODE=development
EXPO_PUBLIC_DEVELOPMENT_API=http://localhost:5000/api
EXPO_PUBLIC_WEATHER_API_DEVELOPMENT=http://localhost:5000
EXPO_PUBLIC_GROWATT_API=http://localhost:8080/api

# Growatt credentials (use your actual credentials)
EXPO_PUBLIC_GROWATT_USERNAME=your_secure_username@domain.com
EXPO_PUBLIC_GROWATT_PASSWORD=your_secure_password
```

### Start Frontend

```bash
npm install
npm run web
```

## Development Mode Features

✅ **Local MongoDB**: All data stored locally  
✅ **Local Weather API**: No external weather calls  
✅ **Local Growatt API**: Proxied through localhost:8080  
✅ **Local Authentication**: User management via local database  
✅ **Health Checks**: API availability monitoring

## Data Mode Configuration

In the app, go to **Settings** and select:

- 🟡 **Development Mode** for local APIs
- 🟠 **Mock Mode** for offline testing
- 🟢 **Production Mode** for live data

## Troubleshooting

### No Data Displayed

1. Check both backend services are running
2. Verify MongoDB is running locally
3. Check browser console for API errors
4. Ensure data mode is set to "Development"

### API Connection Errors

1. Check health endpoints:
   - Weather: `http://localhost:5000/api/health`
   - Growatt: `http://localhost:8080/api/growatt/health`
2. Verify ports are not in use by other services
3. Check firewall/antivirus blocking localhost

### Database Issues

1. Ensure MongoDB is running: `mongod --version`
2. Check connection string in backend logs
3. Verify database permissions

## API Endpoints in Development

### Weather API (localhost:5000)

- Health: `GET /api/health`
- Current Weather: `GET /api/weather/current`
- Historical: `GET /api/weather/all/{date}`
- User Auth: `POST /api/user/login`

### Growatt API (localhost:8080)

- Health: `GET /api/growatt/health`
- Login: `POST /api/growatt/login`
- Data: `POST /api/growatt/totalData`
- Charts: `POST /api/growatt/dayChart`

## Strict Mode Behavior

Development mode uses **strict routing** - no fallbacks to production:

- ❌ No render.com calls
- ❌ No production MongoDB
- ❌ No external API fallbacks
- ✅ Local endpoints only
- ✅ Clear error messages
- ✅ Development-specific logging
