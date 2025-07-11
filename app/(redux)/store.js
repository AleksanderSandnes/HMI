import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './authSlice';
import { settingsReducer } from './settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
  },
});
