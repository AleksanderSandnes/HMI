/**
 * Common Constants and Configurations
 * Centralized constants for the Solar Dashboard application
 */

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

// Animation durations
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 600,
  extraSlow: 1000,
};

// Common spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography sizes
export const TYPOGRAPHY = {
  mobile: {
    hero: 42,
    title: 28,
    subtitle: 18,
    body: 16,
    caption: 14,
  },
  desktop: {
    hero: 68,
    title: 36,
    subtitle: 24,
    body: 18,
    caption: 16,
  },
};

// Common shadow configuration
export const SHADOW = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Chart configuration defaults
export const CHART_CONFIG = {
  backgroundGradientFrom: '#0f172a',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: 'rgba(30, 41, 59, 0.8)',
  backgroundGradientToOpacity: 0.5,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#10b981',
  },
};

// API Configuration
export const API_ENDPOINTS = {
  BACKEND_URL:
    process.env.EXPO_PUBLIC_DEVELOPMENT_API?.replace('/api', '') ||
    'http://localhost:5000',
  GROWATT_API_URL:
    process.env.EXPO_PUBLIC_GROWATT_API?.replace('/api', '') ||
    'http://localhost:8080',
};

export default {
  BREAKPOINTS,
  ANIMATION_DURATION,
  SPACING,
  TYPOGRAPHY,
  SHADOW,
  CHART_CONFIG,
  API_ENDPOINTS,
};
