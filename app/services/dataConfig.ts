/**
 * Data Configuration Service
 * The active data mode (production vs development) is selected purely at
 * BUILD TIME via the `EXPO_PUBLIC_DATA_MODE` environment variable.
 * There is no runtime toggle — set the env var via the build command
 * (see package.json `*:dev` / `*:prod` scripts, vercel.json, or Render env).
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

/**
 * Resolve the current data mode from the build-time environment variable.
 * Defaults to 'development' (local APIs) when unset.
 */
export function getDataMode(): DataMode {
  const envMode = process.env.EXPO_PUBLIC_DATA_MODE;
  return envMode === 'production' ? 'production' : 'development';
}

/**
 * Get the current data configuration.
 */
export function getDataConfig(): DataConfig {
  return {
    mode: getDataMode(),
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
 * Get configuration info for debugging
 */
export function getConfigInfo(): string {
  const config = getDataConfig();
  const endpoint = getApiEndpoint();
  return `Mode: ${config.mode}, API: ${endpoint || 'Development API'}, Environment: ${config.environment}`;
}
