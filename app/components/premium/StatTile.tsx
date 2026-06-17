import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { premiumTheme } from '../../theme/premiumTheme';

interface StatTileProps {
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  gradient: readonly string[];
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  /** Percentage change vs previous period. */
  delta?: number | null;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    flex: 1,
    minWidth: 150,
  },
  cardCompact: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: premiumTheme.radius.pill,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: premiumTheme.text.muted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: premiumTheme.text.secondary,
  },
  sublabel: {
    fontSize: 12,
    color: premiumTheme.text.muted,
    marginTop: 6,
  },
});

export default function StatTile({
  icon,
  gradient,
  label,
  value,
  unit,
  sublabel,
  delta,
  loading = false,
  compact = false,
  style,
}: StatTileProps) {
  const hasDelta = delta !== null && delta !== undefined && isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  const deltaColor = positive ? premiumTheme.positive : premiumTheme.negative;

  return (
    <GlassCard
      strong
      style={[styles.card, compact && styles.cardCompact, style]}
    >
      <View style={styles.row}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrap}
        >
          <FontAwesome5 name={icon} size={17} color="#0a1124" solid />
        </LinearGradient>

        {hasDelta && (
          <View
            style={[styles.deltaPill, { backgroundColor: deltaColor + '22' }]}
          >
            <FontAwesome5
              name={positive ? 'arrow-up' : 'arrow-down'}
              size={9}
              color={deltaColor}
              solid
            />
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {Math.abs(delta as number).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{loading ? '—' : value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
    </GlassCard>
  );
}
