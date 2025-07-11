# Solar Dashboard Data Modes Guide

## 🎯 Overview

The Solar Power Dashboard supports **3 distinct data modes** with intelligent priority handling:

1. **🟢 Production Mode** - Uses live production API (render.com)
2. **🟡 Development Mode** - Uses local development API (Growatt)
3. **🔴 Mock Mode** - Uses simulated realistic data

## 🚀 Quick Start Commands

### Production Mode (Default)

Uses production API with fallback to development then mock:

```bash
npm start           # Default mode (production)
npm run web         # Web with production API
npm run android     # Android with production API
npm run ios         # iOS with production API
```

### Development Mode

Uses development API with fallback to mock:

```bash
npm run start:dev   # Development API mode
npm run web:dev     # Web with development API
npm run android:dev # Android with development API
npm run ios:dev     # iOS with development API
```

### Mock Mode

Uses only mock data (no API calls):

```bash
npm run start:mock   # Mock data only
npm run web:mock     # Web with mock data
npm run android:mock # Android with mock data
npm run ios:mock     # iOS with mock data
```

## 🔄 Data Priority System

### Production Mode Priority

1. **🟢 Production API** (render.com) - Primary source
2. **🟡 Development API** (Growatt) - Fallback if production fails
3. **🔴 Mock Data** - Last resort if both APIs fail

### Development Mode Priority

1. **🟡 Development API** (Growatt) - Primary source
2. **🔴 Mock Data** - Fallback if development API fails

### Mock Mode

- **🔴 Mock Data** - Always uses realistic simulated data

## 📊 Data Sources Explained

### 🟢 Production API (render.com)

- **Purpose**: Live production data from deployed API
- **Endpoint**: `https://solar-api.onrender.com/api`
- **Use Case**: Production deployment, live data monitoring
- **Features**: Real-time solar generation data, historical analytics

### 🟡 Development API (Growatt)

- **Purpose**: Local development with real Growatt integration
- **Endpoint**: `http://localhost:3000/api`
- **Use Case**: Development testing with real hardware data
- **Features**: Direct Growatt API integration, local testing

### 🔴 Mock Data

- **Purpose**: Realistic simulated data for development/testing
- **Use Case**: Offline development, UI testing, demos
- **Features**:
  - Seasonal solar variations
  - Realistic daily power curves
  - Weather simulation effects
  - Time-accurate data for all ranges

## 🛠️ Configuration

### Environment Variables

Set these in your `.env` file or environment:

```bash
# Data mode (production | development | mock)
EXPO_PUBLIC_DATA_MODE=production

# API endpoints
EXPO_PUBLIC_PRODUCTION_API=https://solar-api.onrender.com/api
EXPO_PUBLIC_DEVELOPMENT_API=http://localhost:3000/api

# Growatt credentials (for development mode)
EXPO_PUBLIC_GROWATT_USERNAME=your_username
EXPO_PUBLIC_GROWATT_PASSWORD=your_password
```

### Manual Mode Override

You can override the mode programmatically:

```javascript
// In your code
process.env.EXPO_PUBLIC_DATA_MODE = 'development';
```

## 📱 Visual Indicators

The dashboard displays the current data source:

- **🟢 Production API** - Green indicator in header
- **🟡 Development API** - Yellow indicator in header
- **🔴 Mock Data** - Red indicator in header

## 🔍 Debugging & Monitoring

### Console Logs

Monitor the console for detailed information:

```
[DataService] Mode: production, API: https://solar-api.onrender.com/api
[DataService] 🟢 Production mode: attempting Production API first
[DataService] ✅ Successfully fetched from Production API
```

### Health Checks

The system automatically performs health checks:

- Production API health validation
- Development API connectivity tests
- Graceful fallback handling

## 🎨 Mock Data Features

The mock data service provides:

### Realistic Patterns

- **Seasonal Variations**: Higher generation in summer, lower in winter
- **Daily Curves**: Realistic bell curve patterns (sunrise to sunset)
- **Weather Effects**: Random cloud cover simulation
- **Time Accuracy**: Correct data for any date/time range

### Data Types

- **Hourly**: Real-time power output (Watts)
- **Daily**: Hourly breakdown for selected day
- **Weekly**: Daily aggregations for 7 days
- **Monthly**: Daily aggregations for selected month
- **Yearly**: Monthly aggregations for selected year

## 🚨 Error Handling

### Automatic Fallbacks

1. If production API fails → Try development API
2. If development API fails → Use mock data
3. If all fail → Display error with mock data

### Manual Recovery

- Check network connectivity
- Verify API endpoints
- Restart in mock mode for immediate functionality

## 📋 Development Workflow

### For UI Development

```bash
npm run web:mock    # Fast, reliable mock data
```

### For API Testing

```bash
npm run web:dev     # Test with local APIs
```

### For Production Testing

```bash
npm run web:prod    # Test with live production APIs
```

## 🔧 Troubleshooting

### Common Issues

1. **Production API timeout**

   - Mode automatically falls back to development
   - Check render.com service status

2. **Development API connection failed**

   - Ensure local server is running
   - Check localhost:3000 availability
   - Verify Growatt credentials

3. **Mock data not loading**
   - Check console for errors
   - Restart in explicit mock mode
   - Clear app cache

### Support Commands

```bash
# Check current configuration
npm run start:mock  # Force mock mode
npm run start:dev   # Force development mode
npm run start:prod  # Force production mode
```

## 📈 Performance Notes

- **Mock Mode**: Fastest startup, no network requests
- **Development Mode**: Medium performance, local API calls
- **Production Mode**: Variable performance, depends on API health

The system is optimized for graceful degradation and maintains functionality regardless of network conditions.
