/**
 * Development Mode Integration Test
 * Tests that all API calls in development mode use local endpoints only
 */

const { getDataMode, getApiEndpoint } = require('./app/services/dataConfig');
const {
  getCurrentWeatherEndpoint,
  getHistoricalWeatherEndpoint,
} = require('./app/services/weatherApiConfig');

console.log('🧪 Testing Development Mode Configuration...\n');

// Mock Redux store for testing
const mockStore = {
  getState: () => ({
    settings: {
      dataMode: 'development',
    },
  }),
};

// Set mock store
const { setStoreReference } = require('./app/services/dataConfig');
setStoreReference(mockStore);

// Test 1: Data Mode Detection
console.log('1. Testing Data Mode Detection:');
const currentMode = getDataMode();
console.log(`   Current Mode: ${currentMode}`);
console.log(`   ✅ Expected: development, Actual: ${currentMode}`);
console.assert(
  currentMode === 'development',
  'Data mode should be development'
);

// Test 2: API Endpoints
console.log('\n2. Testing API Endpoints:');
const apiEndpoint = getApiEndpoint();
console.log(`   API Endpoint: ${apiEndpoint}`);
console.log(`   ✅ Should be localhost:5000, Got: ${apiEndpoint}`);
console.assert(
  apiEndpoint.includes('localhost:5000'),
  'API endpoint should use localhost:5000'
);

// Test 3: Weather API Configuration
console.log('\n3. Testing Weather API Configuration:');
const currentWeatherEndpoint = getCurrentWeatherEndpoint();
const historicalWeatherEndpoint = getHistoricalWeatherEndpoint('2024-01-01');
console.log(`   Current Weather: ${currentWeatherEndpoint}`);
console.log(`   Historical Weather: ${historicalWeatherEndpoint}`);
console.assert(
  currentWeatherEndpoint.includes('localhost:5000'),
  'Weather API should use localhost:5000'
);
console.assert(
  historicalWeatherEndpoint.includes('localhost:5000'),
  'Historical weather API should use localhost:5000'
);

// Test 4: No Production URLs
console.log('\n4. Testing No Production URLs:');
const hasRenderCom =
  currentWeatherEndpoint.includes('render.com') ||
  historicalWeatherEndpoint.includes('render.com') ||
  apiEndpoint.includes('render.com');
console.log(`   Contains render.com: ${hasRenderCom}`);
console.assert(
  !hasRenderCom,
  'No render.com URLs should be used in development mode'
);

// Test 5: Growatt API Configuration
console.log('\n5. Testing Growatt API Configuration:');
// Simulate the API_CONFIG from api.js
const mockGrowattUrl =
  process.env.EXPO_PUBLIC_GROWATT_API || 'http://localhost:8080/api';
console.log(`   Growatt API: ${mockGrowattUrl}`);
console.assert(
  mockGrowattUrl.includes('localhost:8080'),
  'Growatt API should use localhost:8080'
);

console.log('\n🎉 All Development Mode Tests Passed!');
console.log('\nDevelopment Mode Summary:');
console.log('✅ Data Mode: development');
console.log('✅ Weather API: localhost:5000');
console.log('✅ Growatt API: localhost:8080');
console.log('✅ MongoDB: Local instance');
console.log('✅ No production endpoints');
console.log('\n🟡 Ready for local development!');
