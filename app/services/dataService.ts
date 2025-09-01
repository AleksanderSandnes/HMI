/**
 * Unified Data Service
 * Strict mode - NO FALLBACKS - Each mode uses only its designated data source
 */

import { getDataMode, getConfigInfo } from './dataConfig';
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
  source: 'production' | 'development';
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
