/**
 * Unified Box Component
 * A responsive box component that adapts to mobile and web layouts
 */

import React, { ReactNode } from 'react';
import { Box } from '@gluestack-ui/themed';
import { ViewStyle } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { solarTheme } from '../../theme/solarTheme';

interface UnifiedBoxProps {
  children: ReactNode;
  variant?: 'small' | 'big';
  style?: ViewStyle;
}

export default function UnifiedBox({
  children,
  variant = 'small',
  style,
}: UnifiedBoxProps) {
  const { isMobile } = useResponsive();

  const getBoxStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isMobile ? 'rgba(39,41,42,255)' : 'rgba(39,64,112,255)',
      borderRadius: 10,
      overflow: 'hidden',
      ...solarTheme.shadow,
    };

    if (variant === 'big') {
      return {
        ...baseStyle,
        flex: 1,
        minHeight: isMobile ? 200 : 300,
      };
    }

    // Small box variant
    return {
      ...baseStyle,
      flex: 1,
      minHeight: isMobile ? 150 : 300,
      paddingVertical: isMobile ? 20 : 0,
    };
  };

  return <Box style={[getBoxStyle(), style]}>{children}</Box>;
}
