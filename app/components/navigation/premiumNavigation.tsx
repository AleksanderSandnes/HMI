import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { solarTheme } from '../../theme/solarTheme';

const { width } = Dimensions.get('window');

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  iconFamily: 'MaterialIcons' | 'FontAwesome5' | 'FontAwesome6';
  isActive?: boolean;
  onPress: () => void;
}

interface PremiumNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    paddingBottom: 10,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  navContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    position: 'relative',
  },
  activeNavItem: {
    backgroundColor: 'rgba(79, 211, 204, 0.2)',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: solarTheme.secondary.accent,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(79, 211, 204, 0.3)',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: solarTheme.text.tertiary,
    textAlign: 'center',
  },
  activeNavLabel: {
    color: solarTheme.secondary.accent,
    fontWeight: '700',
  },

  // Floating action button style for center item
  centerNavItem: {
    backgroundColor: solarTheme.secondary.accent,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: solarTheme.secondary.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerIcon: {
    marginBottom: 0,
  },

  // Ripple effect
  ripple: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

const navigationItems: NavigationItem[] = [
  {
    id: 'growatt',
    label: 'Growatt',
    icon: 'solar-panel',
    iconFamily: 'FontAwesome6',
    onPress: () => {},
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    iconFamily: 'MaterialIcons',
    onPress: () => {},
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: 'cloud-sun',
    iconFamily: 'FontAwesome5',
    onPress: () => {},
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    iconFamily: 'MaterialIcons',
    onPress: () => {},
  },
];

function renderIcon(
  iconName: string,
  iconFamily: string,
  size: number,
  color: string
) {
  switch (iconFamily) {
    case 'MaterialIcons':
      return <MaterialIcons name={iconName as any} size={size} color={color} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={iconName as any} size={size} color={color} />;
    case 'FontAwesome6':
      return <FontAwesome6 name={iconName as any} size={size} color={color} />;
    default:
      return <MaterialIcons name={iconName as any} size={size} color={color} />;
  }
}

export default function PremiumNavigation({
  activeTab,
  onTabChange,
}: PremiumNavigationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.blurContainer}>
        <LinearGradient
          colors={[
            solarTheme.background.card,
            solarTheme.background.main + '90',
          ]}
          style={styles.gradientOverlay}
        />

        <View style={styles.navContainer}>
          {navigationItems.map((item, index) => {
            const isActive = activeTab === item.id;
            const isCenter = index === 1; // Dashboard is center

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  isActive && styles.activeNavItem,
                  isCenter && styles.centerNavItem,
                ]}
                onPress={() => onTabChange(item.id)}
                activeOpacity={0.7}
              >
                {isActive && !isCenter && (
                  <View style={styles.activeIndicator} />
                )}

                <View
                  style={[
                    styles.iconContainer,
                    isActive && !isCenter && styles.activeIconContainer,
                    isCenter && styles.centerIcon,
                  ]}
                >
                  {renderIcon(
                    item.icon,
                    item.iconFamily,
                    isCenter ? 24 : 20,
                    isCenter
                      ? solarTheme.text.primary
                      : isActive
                        ? solarTheme.secondary.accent
                        : solarTheme.text.tertiary
                  )}
                </View>

                {!isCenter && (
                  <Text
                    style={[styles.navLabel, isActive && styles.activeNavLabel]}
                  >
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
