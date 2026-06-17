import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import GlassCard from '../../premium/GlassCard';
import { premiumTheme } from '../../../theme/premiumTheme';

interface SettingsSectionProps {
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  gradient: readonly string[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional element rendered on the right of the header. */
  headerRight?: React.ReactNode;
}

/**
 * Premium settings card with a gradient icon header.
 * Used by all sections of the redesigned settings page.
 */
export default function SettingsSection({
  icon,
  gradient,
  title,
  subtitle,
  children,
  headerRight,
}: SettingsSectionProps) {
  return (
    <GlassCard strong style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.icon}
        >
          <FontAwesome5 name={icon} size={16} color={premiumTheme.text.inverse} solid />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerRight}
      </View>
      <View style={styles.body}>{children}</View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: premiumTheme.text.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  body: { marginTop: 18 },
});
