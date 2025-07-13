import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import { clearStoredCredentials } from '../services/credentialsService';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          return Promise.resolve();
        }
      },
    };
  }
  return AsyncStorage;
};

const storage = getStorage();

const loadUserFromStorage = async () => {
  try {
    const userInfo = await storage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error loading user from storage:', error);
    return null;
  }
};

const saveUserToStorage = async (userInfo) => {
  try {
    await storage.setItem('userInfo', JSON.stringify(userInfo));
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

const removeUserFromStorage = async () => {
  try {
    await storage.removeItem('userInfo');
  } catch (error) {
    console.error('Error removing user from storage:', error);
  }
};

const initialState = {
  user: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    loginUserAction: (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      saveUserToStorage(action.payload);
    },
    logoutAction: (state) => {
      state.user = null;
      state.isLoading = false;
      removeUserFromStorage();
      clearStoredCredentials();
    },
    setUserAction: (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
    },
    setLoadingAction: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  loginUserAction,
  logoutAction,
  setUserAction,
  setLoadingAction,
} = authSlice.actions;

export const authReducer = authSlice.reducer;

export const loadUser = () => async (dispatch) => {
  try {
    dispatch(setLoadingAction(true));
    const userInfo = await loadUserFromStorage();
    if (userInfo) {
      dispatch(setUserAction(userInfo));
    } else {
      dispatch(setLoadingAction(false));
    }
  } catch (error) {
    console.error('Error loading user:', error);
    dispatch(setLoadingAction(false));
  }
};
