import {
  getWeatherApiConfig,
  getWeatherEndpointByTimeRange,
  getCurrentWeatherEndpoint,
  getHistoricalWeatherEndpoint,
} from '../services/weatherApiConfig';

// See dataConfig.test.ts — proxy the virtual env module to live process.env so
// EXPO_PUBLIC_* driven behaviour can be exercised at runtime.
jest.mock('expo/virtual/env', () => ({
  get env() {
    return process.env;
  },
}));

const PROD = 'https://weatherapi-sbwb.onrender.com';
const DEV = 'http://localhost:5000';

describe('weatherApiConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('getWeatherApiConfig', () => {
    it('uses the production base URL in production mode', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      expect(getWeatherApiConfig().baseUrl).toBe(PROD);
    });

    it('uses the development base URL in development mode', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'development';
      delete process.env.EXPO_PUBLIC_WEATHER_API_DEVELOPMENT;
      expect(getWeatherApiConfig().baseUrl).toBe(DEV);
    });

    it('honours the production base URL override', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION = 'https://custom.test';
      expect(getWeatherApiConfig().baseUrl).toBe('https://custom.test');
    });

    it('builds the current/historical/hourly endpoints from the base URL', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      const cfg = getWeatherApiConfig();
      expect(cfg.currentWeatherEndpoint).toBe(`${PROD}/api/weather/current`);
      expect(cfg.historicalWeatherEndpoint('20230619')).toBe(
        `${PROD}/api/weather/all/20230619`
      );
      expect(cfg.hourlyWeatherEndpoint('20230619')).toBe(
        `${PROD}/api/weather/hourly/20230619`
      );
    });

    it('returns the dated weekly-hourly endpoint when a date is given', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      const cfg = getWeatherApiConfig();
      expect(cfg.weeklyWeatherEndpoint('20230619')).toBe(
        `${PROD}/api/weather/weekly-hourly/20230619`
      );
    });

    it('returns the plain weekly endpoint when no date is given', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      const cfg = getWeatherApiConfig();
      expect(cfg.weeklyWeatherEndpoint()).toBe(`${PROD}/api/weather/weekly`);
    });
  });

  describe('getWeatherEndpointByTimeRange', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
    });

    it('returns the hourly endpoint for "hourly" with a date', () => {
      expect(getWeatherEndpointByTimeRange('hourly', '20230619')).toBe(
        `${PROD}/api/weather/hourly/20230619`
      );
    });

    it('returns the weekly endpoint for "weekly" with a date', () => {
      expect(getWeatherEndpointByTimeRange('weekly', '20230619')).toBe(
        `${PROD}/api/weather/weekly-hourly/20230619`
      );
    });

    it('returns the historical endpoint for an unknown range with a date', () => {
      expect(getWeatherEndpointByTimeRange('daily', '20230619')).toBe(
        `${PROD}/api/weather/all/20230619`
      );
    });

    it('returns the current endpoint for an unknown range without a date', () => {
      expect(getWeatherEndpointByTimeRange('daily')).toBe(
        `${PROD}/api/weather/current`
      );
    });
  });

  describe('convenience getters', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
    });

    it('getCurrentWeatherEndpoint matches the config', () => {
      expect(getCurrentWeatherEndpoint()).toBe(`${PROD}/api/weather/current`);
    });

    it('getHistoricalWeatherEndpoint matches the config', () => {
      expect(getHistoricalWeatherEndpoint('20230619')).toBe(
        `${PROD}/api/weather/all/20230619`
      );
    });
  });
});
