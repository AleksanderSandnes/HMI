/**
 * Unified Data Service
 * Strict mode - NO FALLBACKS - Each mode uses only its designated data source
 */

import { getDataMode, getConfigInfo } from './dataConfig';
import { getMockSolarData } from './mockDataService';
import { fetchSolarData as fetchGrowattData } from './growattApiService';

export interface SolarDataResponse {
  chartData: {
    labels: string[];
    datasets: {
      data: number[];
      color: () => string;
      strokeWidth: number;
    }[];
  };
  metrics: {
    todayGeneration: number;
    totalGeneration: number;
    todayRevenue: number;
    totalRevenue: number;
  };
  source: 'production' | 'development' | 'mock';
}

/**
 * Fetch solar data based on strict mode selection - NO FALLBACKS
 */
export async function fetchSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
): Promise<SolarDataResponse> {
  const dataMode = getDataMode();

  console.log(`[DataService] ${getConfigInfo()}`);
  console.log(
    `[DataService] Fetching ${timespan} data for ${date} in STRICT mode: ${dataMode}`
  );

  try {
    switch (dataMode) {
      case 'mock':
        console.log('[DataService] 🟠 MOCK MODE: Using mock data only');
        return getMockDataResponse(timespan, date, isMobile);

      case 'development':
        console.log(
          '[DataService] 🟡 DEVELOPMENT MODE: Using Java API directly'
        );
        const devResponse = await fetchGrowattData(timespan, date, isMobile);
        console.log('[DataService] ✅ Successfully fetched from Java API');
        return { ...devResponse, source: 'development' };

      case 'production':
        console.log('[DataService] 🟢 PRODUCTION MODE: Using Production API');
        const prodResponse = await fetchGrowattData(timespan, date, isMobile);
        console.log(
          '[DataService] ✅ Successfully fetched from Production API'
        );
        return { ...prodResponse, source: 'production' };

      default:
        throw new Error(`Invalid data mode: ${dataMode}`);
    }
  } catch (error) {
    console.error(`[DataService] ❌ Error in ${dataMode} mode:`, error);
    // Re-throw the error instead of falling back
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to fetch data in ${dataMode} mode: ${errorMessage}`
    );
  }
}

/**
 * Get mock data response
 */
function getMockDataResponse(
  timespan: string,
  date: string,
  isMobile: boolean
): SolarDataResponse {
  const mockData = getMockSolarData(timespan, date, isMobile);

  return {
    chartData: mockData.chartData,
    metrics: {
      todayGeneration: mockData.metrics.currentPeriod,
      totalGeneration: mockData.metrics.total,
      todayRevenue: mockData.metrics.revenue.current,
      totalRevenue: mockData.metrics.revenue.total,
    },
    source: 'mock',
  };
}
