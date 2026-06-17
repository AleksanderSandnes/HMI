import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { premiumTheme } from '../../theme/premiumTheme';

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { full: 'Hourly', short: 'Day', value: 'hourly' },
  { full: 'Weekly', short: 'Week', value: 'weekly' },
  { full: 'Monthly', short: 'Month', value: 'monthly' },
  { full: 'Yearly', short: 'Year', value: 'yearly' },
];

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: premiumTheme.radius.pill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: premiumTheme.radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: premiumTheme.radius.pill,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: premiumTheme.text.muted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: premiumTheme.text.inverse,
    fontWeight: '800',
  },
});

/**
 * iOS-style segmented control with a gradient pill for the active range.
 */
export default function SegmentedControl({
  value,
  onChange,
}: SegmentedControlProps) {
  const { width } = useWindowDimensions();
  const compact = width <= 420;

  return (
    <View style={styles.track}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={styles.segment}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active && (
              <LinearGradient
                colors={premiumTheme.solar.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeFill}
              />
            )}
            <Text style={[styles.label, active && styles.labelActive]}>
              {compact ? opt.short : opt.full}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
