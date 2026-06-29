import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { premiumTheme, glassBlur, glow } from '../../theme/premiumTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stronger fill + border for primary surfaces. */
  strong?: boolean;
  /** Adds an elevated glow shadow. */
  elevated?: boolean;
  /** Blur radius for the web backdrop filter. */
  blur?: number;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: premiumTheme.radius.lg,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
    backgroundColor: premiumTheme.glass.fill,
    overflow: 'hidden',
  },
  strong: {
    backgroundColor: premiumTheme.glass.fillStrong,
    borderColor: premiumTheme.glass.borderStrong,
  },
});

/**
 * Frosted-glass surface — the building block of the premium dashboard.
 * Translucent fill + hairline border, web backdrop blur, optional glow.
 */
export default function GlassCard({
  children,
  style,
  strong = false,
  elevated = false,
  blur = 22,
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        strong && styles.strong,
        glassBlur(blur),
        elevated && glow(),
        style,
      ]}
    >
      {children}
    </View>
  );
}
