/**
 * Responsive Layout Utilities
 * Helper functions for responsive design across the application
 */

import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS, TYPOGRAPHY, SPACING } from '../constants';

export const useResponsive = () => {
  const windowDimensions = useWindowDimensions();
  const width = windowDimensions.width;

  const isMobile = width <= BREAKPOINTS.mobile;
  const isTablet = width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet;
  const isDesktop = width > BREAKPOINTS.tablet;

  const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
    if (isMobile) return mobileValue;
    if (isTablet) return tabletValue || mobileValue;
    return desktopValue || tabletValue || mobileValue;
  };

  const getFontSize = (type) => {
    return isMobile ? TYPOGRAPHY.mobile[type] : TYPOGRAPHY.desktop[type];
  };

  const getSpacing = (size) => {
    return SPACING[size] || size;
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height: windowDimensions.height,
    getResponsiveValue,
    getFontSize,
    getSpacing,
  };
};

export const createResponsiveStyle = (
  mobileStyle,
  tabletStyle,
  desktopStyle
) => {
  return (windowWidth) => {
    if (windowWidth <= BREAKPOINTS.mobile) return mobileStyle;
    if (windowWidth <= BREAKPOINTS.tablet) return tabletStyle || mobileStyle;
    return desktopStyle || tabletStyle || mobileStyle;
  };
};

export default {
  useResponsive,
  createResponsiveStyle,
};
