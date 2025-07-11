/**
 * Java API Service
 * Calls the Java Growatt API (localhost:8080) for solar data
 */

const JAVA_API_BASE = 'http://localhost:8080';

/**
 * Fetch solar data from Java API
 * @param {string} username - Growatt username
 * @param {string} password - Growatt password
 * @param {string} plantId - Growatt plant ID
 * @param {Date} date - Date to fetch data for
 * @returns {Object} Solar data in the expected format
 */
async function fetchPlantData(username, password, plantId, date) {
  console.log(
    `[JavaAPI] Fetching solar data for ${date.toISOString().split('T')[0]} with plantId: ${plantId}`
  );

  try {
    // Login to get session
    const loginResponse = await fetch(`${JAVA_API_BASE}/api/growatt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: username,
        password: password,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error('[JavaAPI] Login failed:', loginResponse.status, errorData);
      throw new Error(
        `Java API login failed: ${loginResponse.status} ${errorData}`
      );
    }

    const loginData = await loginResponse.text();
    console.log('[JavaAPI] Login successful');

    // Format date for API call
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get day chart data
    const dayChartResponse = await fetch(
      `${JAVA_API_BASE}/api/growatt/getDayChart`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plantId: plantId,
          date: dateStr,
        }),
      }
    );

    if (!dayChartResponse.ok) {
      const errorData = await dayChartResponse.text();
      console.error(
        '[JavaAPI] Day chart failed:',
        dayChartResponse.status,
        errorData
      );
      throw new Error(`Java API day chart failed: ${dayChartResponse.status}`);
    }

    const dayChartData = await dayChartResponse.json();
    console.log('[JavaAPI] Day chart data received');

    // Get total data
    const totalDataResponse = await fetch(
      `${JAVA_API_BASE}/api/growatt/getTotalData`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!totalDataResponse.ok) {
      const errorData = await totalDataResponse.text();
      console.error(
        '[JavaAPI] Total data failed:',
        totalDataResponse.status,
        errorData
      );
      throw new Error(
        `Java API total data failed: ${totalDataResponse.status}`
      );
    }

    const totalData = await totalDataResponse.json();
    console.log('[JavaAPI] Total data received');

    // Transform the data to match the expected format
    const transformedData = {
      date: date,
      labels: dayChartData.labels || [],
      values: dayChartData.values || [],
      metrics: {
        todayGeneration: totalData.todayGeneration || 0,
        totalGeneration: totalData.totalGeneration || 0,
        todayRevenue: totalData.todayRevenue || 0,
        totalRevenue: totalData.totalRevenue || 0,
      },
    };

    console.log('[JavaAPI] Data transformation complete');
    return transformedData;
  } catch (error) {
    console.error('[JavaAPI] Error fetching solar data:', error);
    throw error;
  }
}

module.exports = {
  fetchPlantData,
};
