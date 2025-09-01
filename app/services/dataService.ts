import { logInfo, logError, logWarn } from '../services/graylogService';
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

  logInfo('${getConfigInfo()}', 'DataService');
  logInfo('Fetching ${timespan} data for ${date} in STRICT mode: ${dataMode}', 'DataService');

  try {
    switch (dataMode) {
      case 'development':
        logInfo('🟡 DEVELOPMENT MODE: Using Java API directly', 'DataService');
        const devResponse = await fetchGrowattData(timespan, date, isMobile);
        logInfo('✅ Successfully fetched from Java API', 'DataService');
        return { ...devResponse, source: 'development' };

      case 'production':
        logInfo('🟢 PRODUCTION MODE: Using Production API', 'DataService');
        const prodResponse = await fetchGrowattData(timespan, date, isMobile);
        logInfo('✅ Successfully fetched from Production API', 'DataService');
        return { ...prodResponse, source: 'production' };

      default:
        throw new Error(`Invalid data mode: ${dataMode}`);
    }
  } catch (error) {
    logError('❌ Error in ${dataMode} mode:', 'DataService', error);
    // Re-throw the error instead of falling back
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to fetch data in ${dataMode} mode: ${errorMessage}`
    );
  }
}
