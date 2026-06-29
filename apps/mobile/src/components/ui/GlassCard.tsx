import { View, StyleSheet, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { cn } from '../../lib/cn';

interface GlassCardProps extends ViewProps {
  /** Stronger fill + border for primary surfaces. */
  strong?: boolean;
  /** Adds an elevated glow shadow. */
  elevated?: boolean;
  /** Override the blur intensity (0–100). */
  intensity?: number;
  /** Layout/padding classes applied to the card (mirrors web GlassCard). */
  className?: string;
}

const ELEVATED = StyleSheet.create({
  shadow: {
    shadowColor: '#020614',
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
}).shadow;

/**
 * Frosted-glass surface — the building block of every screen. Real backdrop blur
 * via expo-blur (native + web), a translucent fill tint, a hairline border, and
 * an optional glow. Mirrors apps/web/components/ui/GlassCard.tsx (which uses CSS
 * backdrop-filter); here the blur is a separate absolute layer behind content.
 */
export function GlassCard({
  strong = false,
  elevated = false,
  intensity,
  className,
  children,
  style,
  ...rest
}: GlassCardProps) {
  return (
    <View
      style={[elevated && ELEVATED, style]}
      className={cn(
        'overflow-hidden rounded-lg border',
        strong ? 'border-glass-border-strong' : 'border-glass-border',
        className,
      )}
      {...rest}
    >
      <BlurView
        intensity={intensity ?? (strong ? 30 : 20)}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        className={cn(
          'absolute inset-0',
          strong ? 'bg-glass-fill-strong' : 'bg-glass-fill',
        )}
      />
      {children}
    </View>
  );
}

export default GlassCard;
