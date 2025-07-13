# Production Deployment Guide for Render.com

This guide will help you deploy your HMI project to production on Render.com.

## 🚀 Deployment Overview

Your project consists of:

1. **Node.js Weather API** → Render.com Web Service (`weatherAPI.onrender.com`)
2. **Java Growatt API** → Render.com Web Service (`growattAPI.onrender.com`)
3. **React Native Frontend** → Vercel (`hmi-frontend.vercel.app`)

## 📋 Pre-Deployment Checklist

### 1. MongoDB Atlas Setup

- [ ] Create MongoDB Atlas cluster
- [ ] Create database user with read/write permissions
- [ ] Whitelist Render.com IP addresses (0.0.0.0/0 for simplicity)
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`

### 2. Environment Variables Setup

- [ ] Generate strong JWT secret (32+ characters)
- [ ] Generate encryption key (32 characters exactly)
- [ ] Have Growatt credentials ready
- [ ] Have Weather.com API credentials ready

## 🔧 Render.com Deployment Steps

### Step 1: Deploy Node.js Weather API

1. **Create New Web Service on Render.com**

   - Connect your GitHub repository
   - Select `backend/weatherAPI` as the root directory
   - Service name: `hmi-backend`

2. **Configure Environment Variables**

   ```
   NODE_ENV=production
   PORT=5000
   DB_USERNAME=your_mongodb_atlas_username
   DB_PASSWORD=your_mongodb_atlas_password
   JWT_SECRET=your_super_secure_jwt_secret_key_32_chars_min
   ENCRYPTION_KEY=your_32_character_encryption_key_exactly
   FRONTEND_URL=https://hmi-frontend.vercel.app
   ```

3. **Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`

### Step 2: Deploy Java Growatt API

1. **Create New Web Service on Render.com**

   - Connect your GitHub repository
   - Select `backend/growattAPI` as the root directory
   - Service name: `hmi-java-api`

2. **Configure Environment Variables**

   ```
   SERVER_PORT=8080
   SPRING_PROFILES_ACTIVE=production
   GROWATT_ACCOUNT=your_growatt_email@domain.com
   GROWATT_PASSWORD=your_growatt_password
   FRONTEND_URL=https://hmi-frontend.vercel.app
   ```

3. **Build Settings**
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/growatt-1.0-SNAPSHOT.jar`
   - Health Check Path: `/actuator/health`

### Step 3: Update Frontend Configuration

Update your frontend environment variables:

```env
EXPO_PUBLIC_DATA_MODE=production
EXPO_PUBLIC_PRODUCTION_API=https://hmi-backend.onrender.com/api
EXPO_PUBLIC_GROWATT_API_PRODUCTION=https://hmi-java-api.onrender.com/api
EXPO_PUBLIC_WEATHER_API_PRODUCTION=https://hmi-backend.onrender.com
```

## 🔄 Auto-Deployment Configuration

### ✅ Auto-Deployment is now configured for:

- **Frontend (Vercel)**: Deploys automatically on push to `main` branch
- **Node.js Backend (Render)**: Configured with `autoDeploy: true` and `branch: main`
- **Java API (Render)**: Configured with `autoDeploy: true` and `branch: main`

### Push to Deploy:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

All services will automatically update!

## 🔐 Security Improvements Applied

### ✅ Fixed Issues:

1. **Removed hardcoded Growatt credentials** from source code
2. **Credentials now fetched from MongoDB** user settings via authenticated API
3. **Environment-based configuration** for all sensitive data
4. **User-managed API keys** - users configure their own credentials

### User Flow:

1. User logs in to app
2. User configures Growatt credentials in Settings page
3. Credentials stored encrypted in MongoDB
4. App fetches credentials securely when needed

## 🌐 Production URLs

- **Frontend**: https://hmi-git-main-apsandnes-projects.vercel.app
- **Node.js Backend**: https://hmi-backend.onrender.com
- **Java API**: https://hmi-java-api.onrender.com

## 📊 Data Flow in Production

```
Frontend (Vercel)
    ↓ Authentication & Settings
Node.js Backend (Render) ↔ MongoDB Atlas
    ↓ User credentials
Java API (Render) → Growatt API
```

## 🚨 Important Notes

1. **First deployment**: Users need to configure their Growatt credentials in app settings
2. **No environment files needed**: All configuration via Render dashboard
3. **Health checks**: Both APIs include health endpoints for monitoring
4. **Automatic scaling**: Render handles traffic spikes automatically

## 🔐 Security Considerations

### User Credentials vs Environment Variables

Your app is designed to prefer **user-configured credentials** over environment variables:

1. **Production Priority**:

   - ✅ User credentials from app settings (stored encrypted in MongoDB)
   - ❌ Environment variables (used as fallback only)

2. **Benefits**:
   - Users can use their own API keys
   - No shared credentials
   - Secure encrypted storage
   - Individual rate limiting

### Environment Variable Generation

#### JWT Secret (32+ characters)

```bash
# Generate with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Encryption Key (exactly 32 characters)

```bash
# Generate with Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 🧪 Testing Your Deployment

### 1. Health Checks

Test your deployed services:

```bash
# Weather API Health
curl https://weatherAPI.onrender.com/api/health

# Java API Health
curl https://growattAPI.onrender.com/actuator/health
```

### 2. Frontend Testing

1. Deploy frontend to Vercel
2. Set data mode to "Production" in app settings
3. Test user registration/login
4. Configure API credentials in app
5. Verify data loading

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check username/password
   - Verify IP whitelist includes 0.0.0.0/0
   - Check database URL format

2. **CORS Errors**

   - Verify FRONTEND_URL environment variable
   - Check allowed origins in both APIs

3. **API Key Issues**

   - Use in-app credential settings instead of environment variables
   - Check encryption key is exactly 32 characters

4. **Java API Not Starting**
   - Check GROWATT_ACCOUNT and GROWATT_PASSWORD
   - Verify Java version (needs Java 17+)

### Debug Commands

```bash
# Check logs in Render dashboard
# Monitor health endpoints
# Test individual API endpoints
```

## 📱 Frontend Deployment (Vercel)

Your `vercel.json` is already configured. Simply:

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy from main branch

## 🔄 Continuous Deployment

Both services will auto-deploy when you push to your main branch. The `render.yaml` files are already configured for this.

## 📞 Support

If you encounter issues:

1. Check Render.com logs
2. Test health endpoints
3. Verify environment variables
4. Check MongoDB connection

Your app is designed to work primarily with user-configured credentials, making it more secure and flexible for production use.
