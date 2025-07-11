import { useWindowDimensions } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../constants';

export const useResponsiveLayout = () => {
  const windowDimensions = useWindowDimensions();

  const isMobile = windowDimensions.width <= 768;
  const isTablet =
    windowDimensions.width > 768 && windowDimensions.width <= 1024;
  const isDesktop = windowDimensions.width > 1024;

  const getResponsiveSize = (mobileSize, tabletSize, desktopSize) => {
    if (isMobile) return mobileSize;
    if (isTablet) return tabletSize || desktopSize;
    return desktopSize;
  };

  const getResponsiveSpacing = (multiplier = 1) => ({
    xs: SPACING.xs * multiplier,
    sm: SPACING.sm * multiplier,
    md: SPACING.md * multiplier,
    lg: SPACING.lg * multiplier,
    xl: SPACING.xl * multiplier,
    xxl: SPACING.xxl * multiplier,
  });

  const getResponsiveTypography = () => ({
    hero: isMobile
      ? TYPOGRAPHY.sizes.mobile.hero
      : TYPOGRAPHY.sizes.desktop.hero,
    title: isMobile
      ? TYPOGRAPHY.sizes.mobile.title
      : TYPOGRAPHY.sizes.desktop.title,
    subtitle: isMobile
      ? TYPOGRAPHY.sizes.mobile.subtitle
      : TYPOGRAPHY.sizes.desktop.subtitle,
    body: isMobile
      ? TYPOGRAPHY.sizes.mobile.body
      : TYPOGRAPHY.sizes.desktop.body,
    caption: isMobile
      ? TYPOGRAPHY.sizes.mobile.caption
      : TYPOGRAPHY.sizes.desktop.caption,
  });

  const getContainerStyles = () => ({
    paddingHorizontal: isMobile ? SPACING.md : SPACING.lg,
    paddingVertical: isMobile ? SPACING.md : SPACING.xl,
    maxWidth: isDesktop ? 1200 : '100%',
    alignSelf: 'center',
  });

  const getGridColumns = (
    mobileColumns = 1,
    tabletColumns = 2,
    desktopColumns = 3
  ) => {
    if (isMobile) return mobileColumns;
    if (isTablet) return tabletColumns;
    return desktopColumns;
  };

  return {
    windowDimensions,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveSize,
    getResponsiveSpacing,
    getResponsiveTypography,
    getContainerStyles,
    getGridColumns,
    breakpoints: {
      mobile: 768,
      tablet: 1024,
    },
  };
};

export default useResponsiveLayout;
