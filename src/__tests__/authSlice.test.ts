import {
  authReducer,
  loginUserAction,
  logoutAction,
  setUserAction,
  setLoadingAction,
} from '../redux/authSlice';

// The reducers fire-and-forget persistence side effects; stub them so the
// reducer logic can be tested in isolation (pure state transitions).
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/credentialsService', () => ({
  clearStoredCredentials: jest.fn(() => Promise.resolve()),
}));

const USER = { id: '1', email: 'a@b.c', token: 'tok' };

describe('authReducer', () => {
  it('has the expected initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ user: null, isLoading: true });
  });

  describe('loginUserAction', () => {
    it('sets the user and clears loading', () => {
      const state = authReducer(undefined, loginUserAction(USER));
      expect(state.user).toEqual(USER);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logoutAction', () => {
    it('clears the user and loading flag', () => {
      const loggedIn = { user: USER, isLoading: false };
      const state = authReducer(loggedIn, logoutAction());
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setUserAction', () => {
    it('sets the user and clears loading', () => {
      const state = authReducer(
        { user: null, isLoading: true },
        setUserAction(USER)
      );
      expect(state.user).toEqual(USER);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setLoadingAction', () => {
    it('updates only the loading flag, preserving the user', () => {
      const start = { user: USER, isLoading: false };
      const loading = authReducer(start, setLoadingAction(true));
      expect(loading.isLoading).toBe(true);
      expect(loading.user).toEqual(USER);

      const done = authReducer(loading, setLoadingAction(false));
      expect(done.isLoading).toBe(false);
      expect(done.user).toEqual(USER);
    });
  });
});
