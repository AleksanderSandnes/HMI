import { logInfo, logError, logWarn } from '../services/graylogService';
/**
 * Data Configuration Service
 * Manages data mode from Redux store - NO FALLBACKS
 */

export type DataMode = 'production' | 'development';

export interface DataConfig {
  mode: DataMode;
  apiEndpoints: {
    production: string;
    development: string;
  };
  environment: string;
}

// Store reference to be set by the app
let _store: any = null;

/**
 * Set the Redux store reference
 */
export function setStoreReference(store: any) {
  _store = store;
}

/**
 * Get the current data configuration from Redux store
 */
export function getDataConfig(): DataConfig {
  let mode: DataMode = 'development'; // Default to development mode

  // Try to get from Redux store first
  if (_store && _store.getState) {
    try {
      const state = _store.getState();
      if (state.settings && state.settings.dataMode) {
        mode = state.settings.dataMode;
      }
    } catch (error) {
      logWarn('Could not read from Redux store:', 'DataConfig', error);
    }
  }

  // Fallback to environment variable only if Redux is not available
  if (!_store) {
    const envMode = process.env.EXPO_PUBLIC_DATA_MODE as DataMode;
    if (envMode === 'production' || envMode === 'development') {
      mode = envMode;
    }
  }

  return {
    mode,
    apiEndpoints: {
      production:
        process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION ||
        'https://weatherapi-sbwb.onrender.com/api',
      development:
        process.env.EXPO_PUBLIC_DEVELOPMENT_API || 'http://localhost:5000/api',
    },
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Get the appropriate API endpoint based on current mode
 */
export function getApiEndpoint(): string {
  const config = getDataConfig();

  switch (config.mode) {
    case 'production':
      return config.apiEndpoints.production;
    case 'development':
      return config.apiEndpoints.development;
    default:
      return config.apiEndpoints.production;
  }
}

/**
 * Check if development data should be used
 */
export function shouldUseDevelopmentData(): boolean {
  return getDataConfig().mode === 'development';
}

/**
 * Get current data mode
 */
export function getDataMode(): DataMode {
  return getDataConfig().mode;
}

/**
 * Get configuration info for debugging
 */
export function getConfigInfo(): string {
  const config = getDataConfig();
  const endpoint = getApiEndpoint();
  return `Mode: ${config.mode}, API: ${endpoint || 'Development API'}, Environment: ${config.environment}`;
}
