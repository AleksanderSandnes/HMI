import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

import GlassCard from '../../src/components/premium/GlassCard';
import { premiumTheme } from '../../src/theme/premiumTheme';
import { useNotifications } from '../../src/context/NotificationsContext';
import {
  NotificationItem,
  NotificationLevel,
  NotificationType,
} from '../../src/services/notificationsApiService';

/** Visual treatment per outcome severity. */
const LEVEL_STYLES: Record<
  NotificationLevel,
  { gradient: readonly string[]; soft: string; ring: string; tint: string }
> = {
  success: {
    gradient: premiumTheme.energy.gradient,
    soft: premiumTheme.energy.soft,
    ring: 'rgba(45, 212, 191, 0.35)',
    tint: premiumTheme.energy.light,
  },
  error: {
    gradient: ['#fda4af', '#fb7185', '#f43f5e'] as const,
    soft: 'rgba(251, 113, 133, 0.12)',
    ring: 'rgba(251, 113, 133, 0.4)',
    tint: premiumTheme.negative,
  },
  warning: {
    gradient: premiumTheme.solar.gradient,
    soft: premiumTheme.solar.soft,
    ring: 'rgba(245, 158, 11, 0.4)',
    tint: premiumTheme.solar.light,
  },
  info: {
    gradient: premiumTheme.accent.gradient,
    soft: premiumTheme.accent.soft,
    ring: 'rgba(129, 140, 248, 0.4)',
    tint: premiumTheme.accent.light,
  },
};

/** Icon per source, overridden to an alert glyph on errors. */
function iconFor(type: NotificationType, level: NotificationLevel): string {
  if (level === 'error') return 'exclamation-triangle';
  switch (type) {
    case 'weather_sync':
      return 'cloud-sun';
    case 'solar_sync':
      return 'solar-panel';
    default:
      return 'bell';
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsCenter(): React.ReactElement {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width <= 768;
  const isWide = width >= 1600;

  const { notifications, count, loading, error, refresh, dismiss, clearAll } =
    useNotifications();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const hasItems = notifications.length > 0;

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
          {
            paddingTop: (Platform.OS === 'web' ? 28 : 14) + insets.top,
            paddingBottom: 48 + insets.bottom,
            paddingLeft: (isMobile ? 16 : 24) + insets.left,
            paddingRight: (isMobile ? 16 : 24) + insets.right,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && hasItems}
            onRefresh={onRefresh}
            tintColor={premiumTheme.text.muted}
          />
        }
      >
        <View style={styles.column}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, isWide && styles.titleWide]}>
                  Notifications
                </Text>
                {count > 0 && (
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{count}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
                Daily data-sync results and system alerts
              </Text>
            </View>

            {hasItems && (
              <Pressable
                onPress={clearAll}
                style={({ hovered }: any) => [
                  styles.clearBtn,
                  hovered && styles.clearBtnHover,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <FontAwesome5 name="check-double" size={13} color={premiumTheme.text.secondary} solid />
                <Text style={styles.clearBtnText}>Mark all read</Text>
              </Pressable>
            )}
          </View>

          {error && (
            <GlassCard style={styles.errorCard}>
              <FontAwesome5 name="exclamation-circle" size={14} color={premiumTheme.negative} solid />
              <Text style={styles.errorText}>{error}</Text>
            </GlassCard>
          )}

          {/* Body */}
          {!hasItems && loading ? (
            <GlassCard strong style={styles.loadingCard}>
              <ActivityIndicator color={premiumTheme.solar.light} />
              <Text style={styles.loadingText}>Loading notifications…</Text>
            </GlassCard>
          ) : !hasItems ? (
            <EmptyState />
          ) : (
            <View style={styles.list}>
              {notifications.map((item) => (
                <NotificationCard key={item.id} item={item} onDismiss={dismiss} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function NotificationCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const level = LEVEL_STYLES[item.level] ?? LEVEL_STYLES.info;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardRow}>
        <LinearGradient
          colors={level.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardIcon}
        >
          <FontAwesome5
            name={iconFor(item.type, item.level)}
            size={17}
            color={premiumTheme.text.inverse}
            solid
          />
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{relativeTime(item.createdAt)}</Text>
          </View>
          {!!item.message && (
            <Text style={styles.cardMessage}>{item.message}</Text>
          )}
        </View>

        <Pressable
          onPress={() => onDismiss(item.id)}
          style={({ hovered }: any) => [
            styles.dismissBtn,
            { borderColor: level.ring, backgroundColor: level.soft },
            hovered && styles.dismissBtnHover,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Mark as read"
          hitSlop={6}
        >
          <FontAwesome5 name="check" size={12} color={level.tint} solid />
        </Pressable>
      </View>
    </GlassCard>
  );
}

function EmptyState() {
  return (
    <GlassCard strong style={styles.emptyCard}>
      <LinearGradient
        colors={premiumTheme.accent.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIcon}
      >
        <FontAwesome5 name="bell-slash" size={26} color={premiumTheme.text.inverse} solid />
      </LinearGradient>
      <Text style={styles.emptyTitle}>You're all caught up</Text>
      <Text style={styles.emptyText}>
        No new notifications. After each nightly data sync you'll see a recap here
        confirming whether solar and weather data saved successfully — plus alerts
        if anything needs your attention.
      </Text>
    </GlassCard>
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
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: premiumTheme.space.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 4,
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.8,
  },
  titleWide: { fontSize: 38, letterSpacing: -1 },
  countPill: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: premiumTheme.radius.pill,
    backgroundColor: premiumTheme.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14.5,
    color: premiumTheme.text.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  subtitleWide: { fontSize: 16.5, marginTop: 6 },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: premiumTheme.radius.pill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
    backgroundColor: premiumTheme.glass.fill,
    marginTop: 6,
  },
  clearBtnHover: { borderColor: premiumTheme.glass.borderStrong },
  clearBtnText: {
    color: premiumTheme.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  errorText: {
    color: premiumTheme.text.secondary,
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },

  list: { gap: 12 },

  card: { paddingVertical: 16, paddingHorizontal: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: premiumTheme.text.primary,
    letterSpacing: -0.2,
  },
  cardTime: {
    fontSize: 12,
    color: premiumTheme.text.muted,
    fontWeight: '600',
    marginTop: 1,
  },
  cardMessage: {
    fontSize: 13.5,
    color: premiumTheme.text.secondary,
    fontWeight: '500',
    lineHeight: 20,
  },
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dismissBtnHover: { opacity: 0.85 },

  loadingCard: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 48,
  },
  loadingText: {
    color: premiumTheme.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },

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
});
