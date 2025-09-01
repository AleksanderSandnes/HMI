import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logInfo, logError, logWarn } from '../services/graylogService';

/**
 * Settings Redux Slice
 * Manages application settings including data mode
 */

const SETTINGS_STORAGE_KEY = '@solar_dashboard_settings';

// Initial state - use environment variable as default, fallback to development for safety
const getInitialDataMode = () => {
  const envMode = process.env.EXPO_PUBLIC_DATA_MODE;
  if (envMode === 'production' || envMode === 'development') {
    return envMode;
  }
  return 'development'; // Safe fallback
};

const initialState = {
  dataMode: getInitialDataMode(),
  isLoading: false,
  error: null,
};

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDataMode: (state, action) => {
      state.dataMode = action.payload;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetSettings: () => {
      return initialState;
    },
  },
});

// Action creators
export const { setDataMode, setLoading, setError, resetSettings } =
  settingsSlice.actions;

// Async thunks for persistence
export const loadSettings = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);

    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      if (
        parsedSettings.dataMode &&
        ['production', 'development'].includes(parsedSettings.dataMode)
      ) {
        dispatch(setDataMode(parsedSettings.dataMode));
      }
    }
  } catch (error) {
    logError('Error loading settings:', 'Settings', error);
    dispatch(setError('Failed to load settings'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const saveDataMode = (dataMode) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    // Validate data mode
    if (!['production', 'development'].includes(dataMode)) {
      throw new Error('Invalid data mode');
    }

    // Save to AsyncStorage
    const settings = { dataMode };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    // Update Redux state
    dispatch(setDataMode(dataMode));

    logInfo('Data mode saved: ${dataMode}', 'Settings');
  } catch (error) {
    logError('Error saving data mode:', 'Settings', error);
    dispatch(setError('Failed to save settings'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Selectors
export const selectDataMode = (state) => state.settings.dataMode;
export const selectSettingsLoading = (state) => state.settings.isLoading;
export const selectSettingsError = (state) => state.settings.error;

// Reducer
export const settingsReducer = settingsSlice.reducer;
