import {
  getDataMode,
  getDataConfig,
  getApiEndpoint,
  shouldUseDevelopmentData,
  getConfigInfo,
} from '../services/dataConfig';

// babel-preset-expo rewrites `process.env.EXPO_PUBLIC_*` reads to the virtual
// `expo/virtual/env` module (which snapshots env at load). Proxy it to live
// `process.env` so tests can drive the mode/endpoints at runtime.
jest.mock('expo/virtual/env', () => ({
  get env() {
    return process.env;
  },
}));

describe('dataConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Fresh copy of env for every test so mutations don't leak.
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('getDataMode', () => {
    it('returns "production" when EXPO_PUBLIC_DATA_MODE is "production"', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      expect(getDataMode()).toBe('production');
    });

    it('returns "development" when EXPO_PUBLIC_DATA_MODE is "development"', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'development';
      expect(getDataMode()).toBe('development');
    });

    it('defaults to "development" when the env var is unset', () => {
      delete process.env.EXPO_PUBLIC_DATA_MODE;
      expect(getDataMode()).toBe('development');
    });

    it('defaults to "development" for any unrecognised value', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'staging';
      expect(getDataMode()).toBe('development');
    });
  });

  describe('getDataConfig', () => {
    it('uses the production default endpoint when no override is set', () => {
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      expect(getDataConfig().apiEndpoints.production).toBe(
        'https://weatherapi-sbwb.onrender.com/api'
      );
    });

    it('honours the production endpoint override', () => {
      process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION = 'https://example.test/api';
      expect(getDataConfig().apiEndpoints.production).toBe('https://example.test/api');
    });

    it('uses the development default endpoint when no override is set', () => {
      delete process.env.EXPO_PUBLIC_DEVELOPMENT_API;
      expect(getDataConfig().apiEndpoints.development).toBe('http://localhost:5000/api');
    });

    it('honours the development endpoint override', () => {
      process.env.EXPO_PUBLIC_DEVELOPMENT_API = 'http://127.0.0.1:9999/api';
      expect(getDataConfig().apiEndpoints.development).toBe('http://127.0.0.1:9999/api');
    });
  });

  describe('getApiEndpoint', () => {
    it('returns the production endpoint in production mode', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      expect(getApiEndpoint()).toBe('https://weatherapi-sbwb.onrender.com/api');
    });

    it('returns the development endpoint in development mode', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'development';
      delete process.env.EXPO_PUBLIC_DEVELOPMENT_API;
      expect(getApiEndpoint()).toBe('http://localhost:5000/api');
    });
  });

  describe('shouldUseDevelopmentData', () => {
    it('is true in development mode', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'development';
      expect(shouldUseDevelopmentData()).toBe(true);
    });

    it('is false in production mode', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      expect(shouldUseDevelopmentData()).toBe(false);
    });
  });

  describe('getConfigInfo', () => {
    it('includes the mode and endpoint in the summary string', () => {
      process.env.EXPO_PUBLIC_DATA_MODE = 'production';
      delete process.env.EXPO_PUBLIC_WEATHER_API_PRODUCTION;
      const info = getConfigInfo();
      expect(info).toContain('Mode: production');
      expect(info).toContain('https://weatherapi-sbwb.onrender.com/api');
    });
  });
});
