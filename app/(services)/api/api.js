import axios from 'axios';
import CryptoJS from 'crypto-js';

// API Configuration
const API_CONFIG = {
  BACKEND_URL:
    process.env.EXPO_PUBLIC_DEVELOPMENT_API?.replace('/api', '') ||
    'http://localhost:5000',
  GROWATT_API_URL:
    process.env.EXPO_PUBLIC_GROWATT_API?.replace('/api', '') ||
    'http://localhost:8080',
  HEADERS: {
    'Content-Type': 'application/json',
  },
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
const createApiRequest = (url, method = 'GET', logPrefix = '') => {
  return async (data = null) => {
    try {
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

// User Authentication API endpoints
export const registerUser = createApiRequest(
  `${API_CONFIG.BACKEND_URL}/api/user/register`,
  'POST'
);

export const loginUser = createApiRequest(
  `${API_CONFIG.BACKEND_URL}/api/user/login`,
  'POST'
);

// Growatt API endpoints (Java Spring Boot)
export const growattLogin = async (credentials) => {
  try {
    // Hash the password with MD5 as expected by the backend
    const hashedPassword = CryptoJS.MD5(credentials.password).toString();

    const loginData = {
      account: credentials.account,
      passwordCrc: hashedPassword,
    };

    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/login`,
      loginData,
      { headers: API_CONFIG.HEADERS }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt login', error);
  }
};

export const getGrowattTotalData = async (request) => {
  try {
    console.log('[API] Sending totalData request:', request);

    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/totalData`,
      request,
      { headers: API_CONFIG.HEADERS }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt total data', error);
  }
};

export const getGrowattDayChart = async (request) => {
  try {
    console.log('[API] Sending dayChart request:', request);

    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/dayChart`,
      request,
      { headers: API_CONFIG.HEADERS }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt day chart', error);
  }
};

export const getGrowattMonthChart = async (request) => {
  try {
    console.log('[API] Sending monthChart request:', request);

    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/monthChart`,
      request,
      { headers: API_CONFIG.HEADERS }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt month chart', error);
  }
};

export const getGrowattYearChart = async (request) => {
  try {
    console.log('[API] Sending yearChart request:', request);

    const response = await axios.post(
      `${API_CONFIG.GROWATT_API_URL}/api/growatt/yearChart`,
      request,
      { headers: API_CONFIG.HEADERS }
    );
    return response.data;
  } catch (error) {
    handleApiError('Growatt year chart', error);
  }
};

// Weather API endpoints
export const getWeatherData = createApiRequest(
  `${API_CONFIG.BACKEND_URL}/api/weather/current`,
  'GET'
);
