import React from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { premiumTheme } from '../../theme/premiumTheme';

type Variant = 'primary' | 'ghost' | 'danger';

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: React.ComponentProps<typeof FontAwesome5>['name'];
  loading?: boolean;
  disabled?: boolean;
  gradient?: readonly string[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium action button.
 * - primary: solar gradient fill
 * - ghost: translucent glass
 * - danger: red-tinted glass (used for destructive actions like Logout)
 */
export default function PremiumButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  gradient,
  style,
}: PremiumButtonProps) {
  const isDisabled = disabled || loading;
  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? premiumTheme.text.inverse : premiumTheme.text.primary}
        />
      ) : (
        <>
          {icon ? (
            <FontAwesome5
              name={icon}
              size={14}
              color={
                variant === 'primary'
                  ? premiumTheme.text.inverse
                  : variant === 'danger'
                  ? premiumTheme.negative
                  : premiumTheme.text.primary
              }
              solid
            />
          ) : null}
          <Text
            style={[
              styles.label,
              variant === 'primary' && styles.labelPrimary,
              variant === 'danger' && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, isDisabled && styles.disabled, style]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={gradient ?? premiumTheme.solar.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles.fill,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: premiumTheme.radius.md,
    overflow: 'hidden',
  },
  fill: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ghost: {
    backgroundColor: premiumTheme.glass.fill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.borderStrong,
  },
  danger: {
    backgroundColor: 'rgba(251, 113, 133, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.35)',
  },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: 0.2,
  },
  labelPrimary: { color: premiumTheme.text.inverse },
  labelDanger: { color: premiumTheme.negative },
});
