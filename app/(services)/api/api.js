import axios from 'axios';
import CryptoJS from 'crypto-js';
import { getDataMode } from '../../services/dataConfig';

// API Configuration - respects data mode
const getApiConfig = () => {
  const dataMode = getDataMode();

  let backendUrl = 'http://localhost:5000';
  let growattUrl = 'http://localhost:8080';

  if (dataMode === 'production') {
    backendUrl =
      process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION ||
      'https://weatherapi-sbwb.onrender.com';
    growattUrl =
      process.env.EXPO_PUBLIC_JAVA_API || 'https://growattapi.onrender.com';
  } else if (dataMode === 'development') {
    backendUrl =
      process.env.EXPO_PUBLIC_DEVELOPMENT_API?.replace('/api', '') ||
      'http://localhost:5000';
    growattUrl =
      process.env.EXPO_PUBLIC_GROWATT_API?.replace('/api', '') ||
      'http://localhost:8080';
  }

  return {
    BACKEND_URL: backendUrl,
    GROWATT_API_URL: growattUrl,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  };
};

// Helper function for standardized error handling
const handleApiError = (operation, error) => {
  console.error(
    `${operation} API error:`,
    error.response?.data || error.message
  );
  throw error;
};

// Helper function to create consistent request function
const createApiRequest = (getUrl, method = 'GET', logPrefix = '') => {
  return async (data = null) => {
    try {
      const API_CONFIG = getApiConfig();
      const url = typeof getUrl === 'function' ? getUrl(API_CONFIG) : getUrl;

      if (logPrefix) {
        console.log(`[API] ${logPrefix}:`, data);
      }

      const config = {
        method,
        url,
        headers: API_CONFIG.HEADERS,
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      handleApiError(logPrefix || 'API Request', error);
    }
  };
};

// Helper to get JWT token from storage (web or React Native)
async function getAuthToken() {
  try {
    if (typeof window !== 'undefined') {
      // Web: Use localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.token || null;
      }
    } else {
      // React Native: Use AsyncStorage
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.token || null;
      }
    }
    return null;
  } catch (error) {
    console.error('[GrowattAPI] Error getting auth token:', error);
    return null;
  }
}

// User Authentication API endpoints
export const registerUser = createApiRequest(
  (config) => `${config.BACKEND_URL}/api/user/register`,
  'POST'
);

export const loginUser = createApiRequest(
  (config) => `${config.BACKEND_URL}/api/user/login`,
  'POST'
);

// Growatt API endpoints (Java Spring Boot)
export const growattLogin = async (credentials) => {
  try {
    const API_CONFIG = getApiConfig();
    // Hash the password with MD5 as expected by the backend
    const hashedPassword = CryptoJS.MD5(credentials.password).toString();

    const loginData = {
      account: credentials.account,
      passwordCrc: hashedPassword,
      // Add plantId if present
      ...(credentials.plantId ? { plantId: credentials.plantId } : {}),
    };

    const token = await getAuthToken();
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/login`,
      loginData,
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt login', error);
  }
};

export const getGrowattTotalData = async (request) => {
  try {
    const API_CONFIG = getApiConfig();
    console.log('[API] Sending totalData request:', request);
    const token = await getAuthToken();
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/totalData`,
      request,
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt total data', error);
  }
};

export const getGrowattDayChart = async (request) => {
  try {
    const API_CONFIG = getApiConfig();
    console.log('[API] Sending dayChart request:', request);
    const token = await getAuthToken();
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/dayChart`,
      request,
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt day chart', error);
  }
};

export const getGrowattMonthChart = async (request) => {
  try {
    const API_CONFIG = getApiConfig();
    console.log('[API] Sending monthChart request:', request);
    const token = await getAuthToken();
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/monthChart`,
      request,
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt month chart', error);
  }
};

export const getGrowattYearChart = async (request) => {
  try {
    const API_CONFIG = getApiConfig();
    console.log('[API] Sending yearChart request:', request);
    const token = await getAuthToken();
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/yearChart`,
      request,
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt year chart', error);
  }
};

// Weather API endpoints
export const getWeatherData = createApiRequest(
  (config) => `${config.BACKEND_URL}/api/weather/current`,
  'GET'
);
