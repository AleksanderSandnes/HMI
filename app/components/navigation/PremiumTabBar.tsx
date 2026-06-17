import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { premiumTheme, glassBlur, glow } from '../../theme/premiumTheme';

export const SIDEBAR_WIDTH_FULL = 248;
export const SIDEBAR_WIDTH_RAIL = 88;

export function navWidth(width: number): number {
  if (width <= 768) return 0;
  return width <= 1024 ? SIDEBAR_WIDTH_RAIL : SIDEBAR_WIDTH_FULL;
}

const ACTIVE = premiumTheme.solar.light;
const INACTIVE = premiumTheme.text.muted;

export default function PremiumTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const mode: 'bottom' | 'rail' | 'full' =
    width <= 768 ? 'bottom' : width <= 1024 ? 'rail' : 'full';

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label =
      typeof options.title === 'string' ? options.title : route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    const color = focused ? ACTIVE : INACTIVE;
    const icon = options.tabBarIcon
      ? options.tabBarIcon({ focused, color, size: 22 })
      : null;

    return { key: route.key, label, focused, onPress, icon, color };
  });

  /* ---------- Mobile bottom bar ---------- */
  if (mode === 'bottom') {
    return (
      <View
        style={[
          styles.bottomBar,
          glassBlur(20),
          { paddingBottom: Math.max(insets?.bottom ?? 0, 8) },
        ]}
      >
        {items.map((it) => (
          <Pressable
            key={it.key}
            style={styles.bottomItem}
            onPress={it.onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: it.focused }}
          >
            {it.focused && <View style={styles.bottomActiveDot} />}
            {it.icon}
          </Pressable>
        ))}
      </View>
    );
  }

  /* ---------- Web / tablet sidebar ---------- */
  const full = mode === 'full';
  return (
    <View
      style={[
        styles.sidebar,
        { width: full ? SIDEBAR_WIDTH_FULL : SIDEBAR_WIDTH_RAIL },
        glassBlur(24),
        glow(),
      ]}
    >
      {/* Brand */}
      <View style={[styles.brand, !full && styles.brandRail]}>
        <LinearGradient
          colors={premiumTheme.solar.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandMark}
        >
          <FontAwesome6 name="solar-panel" size={18} color="#0a1124" />
        </LinearGradient>
        {full && (
          <View>
            <Text style={styles.brandName}>HPI</Text>
            <Text style={styles.brandTag}>Home Production Interface</Text>
          </View>
        )}
      </View>

      {/* Nav */}
      <View style={[styles.nav, !full && styles.navRail]}>
        {items.map((it) =>
          full ? (
            <Pressable
              key={it.key}
              onPress={it.onPress}
              style={[styles.navItem, it.focused && styles.navItemActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: it.focused }}
            >
              <View style={styles.navIcon}>{it.icon}</View>
              <Text
                numberOfLines={1}
                style={[styles.navLabel, { color: it.color }]}
              >
                {it.label}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              key={it.key}
              onPress={it.onPress}
              style={[styles.railItem, it.focused && styles.railItemActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: it.focused }}
            >
              {it.icon}
              <Text
                numberOfLines={1}
                style={[styles.railLabel, { color: it.color }]}
              >
                {it.label}
              </Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* sidebar shell */
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(8, 12, 22, 0.72)',
    borderRightWidth: 1,
    borderRightColor: premiumTheme.glass.border,
    paddingVertical: 22,
    paddingHorizontal: 14,
    zIndex: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 30,
  },
  brandRail: { justifyContent: 'center', paddingHorizontal: 0 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: premiumTheme.text.primary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTag: {
    color: premiumTheme.text.muted,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },

  nav: { gap: 8 },
  navRail: { alignItems: 'center', gap: 12 },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: premiumTheme.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: premiumTheme.solar.soft,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  navIcon: { width: 24, alignItems: 'center' },
  navLabel: { fontSize: 14.5, fontWeight: '700' },

  railItem: {
    width: 62,
    paddingVertical: 12,
    borderRadius: premiumTheme.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 5,
  },
  railItemActive: {
    backgroundColor: premiumTheme.solar.soft,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  railLabel: { fontSize: 10.5, fontWeight: '700' },

  /* mobile bottom bar */
  bottomBar: {
    flexDirection: 'row',
    backgroundColor:
      Platform.OS === 'web'
        ? 'rgba(8, 12, 22, 0.82)'
        : 'rgba(8, 12, 22, 0.98)',
    borderTopWidth: 1,
    borderTopColor: premiumTheme.glass.border,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomActiveDot: {
    position: 'absolute',
    top: -2,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACTIVE,
  },
});
