export const colors = {
  primary: {
    main: '#00bfa5',
    light: '#64ffda',
    dark: '#00897b',
    gradient: ['#00bfa5', '#26a69a', '#4db6ac'],
  },
  secondary: {
    main: '#6200ea',
    light: '#9c47ff',
    dark: '#3700b3',
    gradient: ['#6200ea', '#7c4dff', '#9c47ff'],
  },
  background: {
    dark: 'rgba(0, 0, 0, 0.6)',
    light: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    tertiary: 'rgba(255, 255, 255, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.8)',
  },
  button: {
    primary: {
      background: '#00bfa5',
      border: 'rgba(0, 191, 165, 0.3)',
      text: '#ffffff',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.6)',
      text: '#ffffff',
    },
  },
};

export const shadows = {
  text: {
    color: 'rgba(0, 0, 0, 0.8)',
    offset: { width: 2, height: 2 },
    radius: 10,
  },
  textLight: {
    color: 'rgba(0, 0, 0, 0.6)',
    offset: { width: 1, height: 1 },
    radius: 5,
  },
  button: {
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.3,
    radius: 6,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  sizes: {
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
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
