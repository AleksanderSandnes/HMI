import { StyleSheet } from 'react-native';

/**
 * Creates responsive styles based on screen width breakpoints
 * @param {Object} styles - Object containing styles for different breakpoints
 * @param {number} screenWidth - Current screen width
 * @returns {Object} - Computed styles for current screen size
 */
export const createResponsiveStyles = (styles, screenWidth) => {
  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1024;
  const isDesktop = screenWidth > 1024;

  const computedStyles = {};

  Object.keys(styles).forEach((key) => {
    const style = styles[key];

    if (typeof style === 'object' && !Array.isArray(style)) {
      computedStyles[key] = {};

      // Apply base styles first
      if (style.base) {
        Object.assign(computedStyles[key], style.base);
      }

      // Apply responsive styles
      if (isMobile && style.mobile) {
        Object.assign(computedStyles[key], style.mobile);
      } else if (isTablet && style.tablet) {
        Object.assign(computedStyles[key], style.tablet);
      } else if (isDesktop && style.desktop) {
        Object.assign(computedStyles[key], style.desktop);
      }

      // Apply web-specific styles
      if (!isMobile && style.web) {
        Object.assign(computedStyles[key], style.web);
      }
    } else {
      computedStyles[key] = style;
    }
  });

  return StyleSheet.create(computedStyles);
};

/**
 * Creates a responsive value based on screen width
 * @param {*} mobileValue - Value for mobile screens
 * @param {*} tabletValue - Value for tablet screens (optional)
 * @param {*} desktopValue - Value for desktop screens
 * @param {number} screenWidth - Current screen width
 * @returns {*} - Responsive value
 */
export const getResponsiveValue = (
  mobileValue,
  tabletValue,
  desktopValue,
  screenWidth
) => {
  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1024;

  if (isMobile) return mobileValue;
  if (isTablet) return tabletValue || desktopValue;
  return desktopValue;
};

/**
 * Creates platform-specific styles
 * @param {Object} styles - Object containing platform-specific styles
 * @returns {Object} - Platform-specific styles
 */
export const createPlatformStyles = (styles) => {
  const platformStyles = {};

  Object.keys(styles).forEach((key) => {
    const style = styles[key];

    if (typeof style === 'object' && !Array.isArray(style)) {
      platformStyles[key] = {};

      // Apply base styles first
      if (style.base) {
        Object.assign(platformStyles[key], style.base);
      }

      // Apply platform-specific styles
      if (style.web && typeof window !== 'undefined') {
        Object.assign(platformStyles[key], style.web);
      }

      if (style.native && typeof window === 'undefined') {
        Object.assign(platformStyles[key], style.native);
      }
    } else {
      platformStyles[key] = style;
    }
  });

  return StyleSheet.create(platformStyles);
};

export default {
  createResponsiveStyles,
  getResponsiveValue,
  createPlatformStyles,
};
