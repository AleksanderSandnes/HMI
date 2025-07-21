/**
 * Solar Dashboard Theme Configuration
 * Centralized theme constants for consistent styling across the application
 */

export const solarTheme = {
  primary: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    gradient: ['#1e40af', '#3b82f6', '#60a5fa'],
  },
  secondary: {
    main: '#1e293b',
    light: '#334155',
    dark: '#0f172a',
    accent: '#2563eb',
  },
  background: {
    main: '#0f172a',
    card: 'rgba(30, 41, 59, 0.8)',
    cardLight: 'rgba(51, 65, 85, 0.6)',
    glass: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.8)',
    input: 'rgba(30, 41, 59, 0.6)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    accent: '#4fd3cc',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  chart: {
    generation: '#10b981',
    grid: 'rgba(255, 255, 255, 0.1)',
    label: 'rgba(255, 255, 255, 0.8)',
  },
  metrics: {
    power: '#4fd3cc', // Teal color from PowerIcon
    revenue: '#eae20e', // Yellow color from DollarIcon
  },
  border: {
    primary: 'rgba(59, 130, 246, 0.3)',
    secondary: 'rgba(79, 211, 204, 0.3)',
    focus: '#3b82f6',
    error: '#ef4444',
  },
  button: {
    primary: {
      background: '#00bfa5',
      border: 'rgba(0, 191, 165, 0.3)',
      text: '#ffffff',
      hover: '#26a69a',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.6)',
      text: '#ffffff',
      hover: 'rgba(255, 255, 255, 0.25)',
    },
  },
  shadow: {
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.1,
    radius: 8,
    elevation: 5,
  },
};

export default solarTheme;
