import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

import GlassCard from '../components/premium/GlassCard';
import { premiumTheme } from '../theme/premiumTheme';

/**
 * Notification Center (web only) — placeholder for the upcoming feature.
 * Will surface daily data-sync results and other alerts once cron jobs land.
 */
export default function NotificationsCenter(): React.ReactElement {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const isWide = width >= 1600;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={premiumTheme.bg.gradient} style={StyleSheet.absoluteFill} />
      <Blob color={premiumTheme.bg.glowViolet} top={-120} right={-100} size={360} />
      <Blob color={premiumTheme.bg.glowEnergy} bottom={-140} left={-120} size={380} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: isMobile ? 16 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, isWide && styles.titleWide]}>Notifications</Text>
            <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
              Daily data-sync results and system alerts
            </Text>
          </View>

          <GlassCard strong style={styles.emptyCard}>
            <LinearGradient
              colors={premiumTheme.accent.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <FontAwesome5 name="bell" size={26} color={premiumTheme.text.inverse} solid />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              Once scheduled data syncs are running, you'll see a daily recap here
              confirming whether solar and weather data saved successfully — plus
              alerts if anything needs your attention.
            </Text>
            <View style={styles.badge}>
              <FontAwesome5 name="hard-hat" size={12} color={premiumTheme.solar.light} solid />
              <Text style={styles.badgeText}>Coming soon</Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

function Blob({
  color,
  size,
  top,
  bottom,
  left,
  right,
}: {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          bottom,
          left,
          right,
          opacity: 0.9,
        },
        Platform.OS === 'web' ? ({ filter: `blur(90px)` } as object) : { opacity: 0.35 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: premiumTheme.bg.base },
  scroll: {
    paddingTop: Platform.OS === 'web' ? 28 : 54,
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: premiumTheme.space.lg,
  },
  header: { marginBottom: 2 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.8,
  },
  titleWide: { fontSize: 38, letterSpacing: -1 },
  subtitle: {
    fontSize: 14.5,
    color: premiumTheme.text.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  subtitleWide: { fontSize: 16.5, marginTop: 6 },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: premiumTheme.text.muted,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 460,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: premiumTheme.radius.pill,
    backgroundColor: premiumTheme.solar.soft,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    color: premiumTheme.solar.light,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
