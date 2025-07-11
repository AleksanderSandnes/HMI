import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { solarTheme } from '../../theme/solarTheme';
import { useResponsive } from '../../utils/responsive';

interface SmallBoxProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function SmallBox({
  children,
  variant = 'primary',
}: SmallBoxProps) {
  const { isMobile } = useResponsive();

  const getBackgroundColor = () => {
    if (variant === 'secondary') {
      return solarTheme.background.cardLight;
    }
    return solarTheme.background.card;
  };

  const boxStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: getBackgroundColor(),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: solarTheme.border.primary,
    overflow: 'hidden',
    ...solarTheme.shadow,
    minHeight: isMobile ? 120 : 300,
    paddingVertical: isMobile ? 16 : 24,
    paddingHorizontal: 16,
  };

  return <Box style={boxStyle}>{children}</Box>;
}
