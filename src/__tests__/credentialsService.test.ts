/* eslint-disable import/first -- jest.mock must precede the import it mocks */
/**
 * credentialsService is now a thin shim over Supabase: Growatt login happens server-side
 * from Vault, so the frontend no longer stores credentials locally. These tests mock the
 * Supabase client and assert the shim routes to the right calls.
 */
const mockRpc = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn((_cols?: string) => ({ maybeSingle: mockMaybeSingle }));

jest.mock('../services/supabaseClient', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => ({ select: (cols: string) => mockSelect(cols) }),
  },
}));

import {
  getGrowattCredentials,
  storeGrowattCredentials,
  clearStoredCredentials,
  hasStoredCredentials,
} from '../services/credentialsService';

describe('credentialsService (Supabase shim)', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockMaybeSingle.mockReset();
    mockSelect.mockClear();
    mockRpc.mockResolvedValue({ error: null });
  });

  it('storeGrowattCredentials routes the password to the Vault RPC', async () => {
    await storeGrowattCredentials({ account: 'me@solar.com', password: 'pw' });
    expect(mockRpc).toHaveBeenCalledWith('save_user_credentials', {
      p_growatt_email: 'me@solar.com',
      p_growatt_password: 'pw',
    });
  });

  it('storeGrowattCredentials throws if the RPC errors', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'denied' } });
    await expect(
      storeGrowattCredentials({ account: 'a', password: 'b' })
    ).rejects.toThrow('denied');
  });

  it('getGrowattCredentials returns the non-secret identity (never the password)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { growatt_email: 'me@solar.com', growatt_plant_id: 'plant-9' },
    });
    const creds = await getGrowattCredentials();
    expect(creds).toEqual({
      account: 'me@solar.com',
      password: '',
      plantId: 'plant-9',
    });
  });

  it('hasStoredCredentials reflects whether a Vault secret is configured', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { growatt_password_secret_id: 'a-uuid' },
    });
    expect(await hasStoredCredentials()).toBe(true);

    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    expect(await hasStoredCredentials()).toBe(false);
  });

  it('clearStoredCredentials is a no-op (logout must not wipe Vault data)', async () => {
    await expect(clearStoredCredentials()).resolves.toBeUndefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
