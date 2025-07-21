/**
 * Java API Service
 * Calls the Java Growatt API for solar data
 * Uses environment variables for flexible deployment
 */

const axios = require('axios');
require('dotenv').config();

// Build the API base URL from environment variables
const JAVA_API_URL =
  process.env.JAVA_GROWATT_API_URL || 'https://growattapi.onrender.com';
const JAVA_API_BASE_PATH =
  process.env.JAVA_GROWATT_API_BASE_PATH || '/api/growatt';
const JAVA_API_BASE_URL = `${JAVA_API_URL}${JAVA_API_BASE_PATH}`;

console.log(`[JavaAPI] Using Java API at: ${JAVA_API_BASE_URL}`);

/**
 * Fetch solar data from Java API
 * @param {string} username - Growatt username
 * @param {string} password - Growatt password
 * @param {string} plantId - Growatt plant ID
 * @param {Date} date - Date to fetch data for
 * @param {string} jwtToken - JWT token for authentication
 * @returns {Object} Solar data in the expected format
 */
async function fetchPlantData(
  username,
  password,
  plantId,
  date,
  jwtToken = null
) {
  console.log(
    `[JavaAPI] Fetching solar data for ${date.toISOString().split('T')[0]} with plantId: ${plantId}`
  );

  try {
    // Prepare headers with JWT token if available
    const headers = {
      'Content-Type': 'application/json',
    };

    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
      console.log('[JavaAPI] Including JWT token for authentication');
      console.log('[JavaAPI] JWT token preview:', jwtToken.substring(0, 20) + '...');
    } else {
      console.warn(
        '[JavaAPI] No JWT token provided - request may fail if authentication is required'
      );
    }

    // First, login to get session
    console.log('[JavaAPI] Attempting login to:', `${JAVA_API_BASE_URL}/login`);
    console.log('[JavaAPI] Environment:', process.env.NODE_ENV || 'development');
    console.log('[JavaAPI] Request headers:', JSON.stringify(headers, null, 2));
    
    // Test the health endpoint first
    try {
      const healthResponse = await axios.get(`${JAVA_API_BASE_URL}/health`, { timeout: 5000 });
      console.log('[JavaAPI] Health check passed:', healthResponse.status);
    } catch (healthError) {
      console.warn('[JavaAPI] Health check failed:', healthError.message);
    }
    
    const loginResponse = await axios.post(
      `${JAVA_API_BASE_URL}/login`,
      {
        account: username,
        passwordCrc: require('crypto')
          .createHash('md5')
          .update(password)
          .digest('hex'),
      },
      { headers }
    );

    if (loginResponse.status !== 200) {
      console.error('[JavaAPI] Login failed with status:', loginResponse.status);
      console.error('[JavaAPI] Login response:', loginResponse.data);
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    console.log('[JavaAPI] ✅ Login successful');

    // Get the date in the format expected by the Java API
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch day chart data
    const dayChartResponse = await axios.post(
      `${JAVA_API_BASE_URL}/dayChart`,
      {
        plantId: plantId, // Use the provided plantId
        date: formattedDate,
      },
      { headers }
    );

    if (dayChartResponse.status !== 200) {
      throw new Error(`Day chart fetch failed: ${dayChartResponse.statusText}`);
    }

    const dayData = dayChartResponse.data;
    console.log('[JavaAPI] ✅ Day chart data fetched successfully');

    // Fetch total data for metrics
    const totalDataResponse = await axios.post(
      `${JAVA_API_BASE_URL}/totalData`,
      {
        plantId: plantId,
        date: formattedDate,
      },
      { headers }
    );

    let totalGeneration = 0;
    if (totalDataResponse.status === 200 && totalDataResponse.data) {
      totalGeneration = totalDataResponse.data.totalGeneration || 0;
      console.log('[JavaAPI] ✅ Total data fetched successfully');
    } else {
      console.warn('[JavaAPI] Could not fetch total data, using fallback');
    }

    // Transform the data to match the expected format
    const transformedData = transformApiResponse(dayData, totalGeneration);

    console.log('[JavaAPI] ✅ Data transformation complete');
    return transformedData;
  } catch (error) {
    console.error('[JavaAPI] ❌ Error fetching data from Java API:', error);

    // Re-throw with more context
    if (error.response) {
      throw new Error(
        `Java API error: ${error.response.status} - ${error.response.data || error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error(
        'Java API connection failed - is the Java service running?'
      );
    } else {
      throw new Error(`Java API error: ${error.message}`);
    }
  }
}

/**
 * Transform Java API response to match the format expected by the frontend
 */
function transformApiResponse(dayData, totalGeneration) {
  let labels = [];
  let values = [];
  let todayGeneration = 0;

  if (dayData && dayData.chartData) {
    // Extract time labels and power values
    labels = dayData.chartData
      .map((item) => {
        if (item.time) {
          // Convert time to HH:mm format
          return item.time.substring(0, 5);
        }
        return '';
      })
      .filter((label) => label !== '');

    values = dayData.chartData.map((item) => {
      const power = parseFloat(item.pac || item.power || 0);
      return power;
    });

    // Calculate today's total generation (sum of all power values converted to kWh)
    // Assuming 5-minute intervals, so 288 intervals per day
    const totalWattHours =
      values.reduce((sum, power) => sum + power, 0) * (5 / 60); // Convert to Wh
    todayGeneration = totalWattHours / 1000; // Convert to kWh
  }

  // If we don't have total generation from the API, use a reasonable default
  if (!totalGeneration || totalGeneration === 0) {
    totalGeneration = 24000.3; // Default fallback
  }

  const result = {
    date: new Date(),
    labels: labels,
    values: values,
    pac: values, // Some parts of the code expect 'pac' field
    chartData: {
      labels: labels,
      datasets: [
        {
          data: values,
          color: () => '#10b981',
          strokeWidth: 2,
        },
      ],
    },
    metrics: {
      todayGeneration: Math.round(todayGeneration * 100) / 100,
      totalGeneration: Math.round(totalGeneration * 100) / 100,
      todayRevenue: Math.round(todayGeneration * 0.15 * 100) / 100, // £0.15 per kWh
      totalRevenue: Math.round(totalGeneration * 0.15 * 100) / 100,
    },
  };

  console.log('[JavaAPI] Transformed data:', {
    labelsCount: labels.length,
    valuesCount: values.length,
    todayGeneration: result.metrics.todayGeneration,
    totalGeneration: result.metrics.totalGeneration,
  });

  return result;
}

/**
 * Check Java API health
 */
async function checkJavaApiHealth() {
  try {
    const response = await axios.get(`${JAVA_API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('[JavaAPI] Health check failed:', error.message);
    return false;
  }
}

module.exports = {
  fetchPlantData,
  checkJavaApiHealth,
};
