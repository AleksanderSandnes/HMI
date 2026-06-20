/**
 * Phase 3 example: a service tested with its storage + env dependencies mocked.
 *
 * In the Jest (node) environment `localStorage` is undefined, so credentialsService
 * takes its AsyncStorage code path — we mock that module with an in-memory store.
 */
import {
  getGrowattCredentials,
  storeGrowattCredentials,
  clearStoredCredentials,
  hasStoredCredentials,
} from '../services/credentialsService';

jest.mock('expo/virtual/env', () => ({
  get env() {
    return process.env;
  },
}));

const memoryStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) =>
      Promise.resolve(key in memoryStore ? memoryStore[key] : null)
    ),
    setItem: jest.fn((key: string, value: string) => {
      memoryStore[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete memoryStore[key];
      return Promise.resolve();
    }),
  },
}));

describe('credentialsService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    for (const k of Object.keys(memoryStore)) delete memoryStore[k];
    process.env = { ...ORIGINAL_ENV };
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('stores and retrieves Growatt credentials round-trip', async () => {
    await storeGrowattCredentials({
      account: 'me@solar.com',
      password: 'pw',
      plantId: 'plant-9',
    });

    expect(await hasStoredCredentials()).toBe(true);

    const creds = await getGrowattCredentials();
    expect(creds).toEqual({
      account: 'me@solar.com',
      password: 'pw',
      plantId: 'plant-9',
    });
  });

  it('merges new Growatt settings with existing stored credentials', async () => {
    memoryStore.userCredentials = JSON.stringify({
      weather: { stationId: 'IXX' },
    });
    await storeGrowattCredentials({ account: 'a', password: 'b' });
    const stored = JSON.parse(memoryStore.userCredentials);
    expect(stored.weather).toEqual({ stationId: 'IXX' });
    expect(stored.growatt.account).toBe('a');
  });

  it('falls back to env credentials in development mode when nothing is stored', async () => {
    process.env.EXPO_PUBLIC_DATA_MODE = 'development';
    process.env.EXPO_PUBLIC_GROWATT_USERNAME = 'envuser';
    process.env.EXPO_PUBLIC_GROWATT_PASSWORD = 'envpass';
    process.env.EXPO_PUBLIC_GROWATT_PLANT_ID = 'envplant';

    const creds = await getGrowattCredentials();
    expect(creds).toEqual({
      account: 'envuser',
      password: 'envpass',
      plantId: 'envplant',
    });
  });

  it('does NOT use env credentials in production mode', async () => {
    process.env.EXPO_PUBLIC_DATA_MODE = 'production';
    process.env.EXPO_PUBLIC_GROWATT_USERNAME = 'envuser';
    process.env.EXPO_PUBLIC_GROWATT_PASSWORD = 'envpass';

    await expect(getGrowattCredentials()).rejects.toThrow(
      /No Growatt credentials available/
    );
  });

  it('throws when no credentials are available at all', async () => {
    process.env.EXPO_PUBLIC_DATA_MODE = 'development';
    delete process.env.EXPO_PUBLIC_GROWATT_USERNAME;
    delete process.env.EXPO_PUBLIC_GROWATT_PASSWORD;

    await expect(getGrowattCredentials()).rejects.toThrow(
      /No Growatt credentials available/
    );
  });

  it('hasStoredCredentials is false after clearing', async () => {
    await storeGrowattCredentials({ account: 'a', password: 'b' });
    expect(await hasStoredCredentials()).toBe(true);
    await clearStoredCredentials();
    expect(await hasStoredCredentials()).toBe(false);
  });
});
