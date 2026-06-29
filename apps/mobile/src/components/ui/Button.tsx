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
import { theme, type GradientColors } from '../../theme/theme';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: React.ComponentProps<typeof FontAwesome5>['name'];
  loading?: boolean;
  disabled?: boolean;
  gradient?: GradientColors;
  style?: StyleProp<ViewStyle>;
}

/**
 * Action button.
 * - primary: solar gradient fill
 * - ghost: translucent glass
 * - danger: red-tinted glass (used for destructive actions like Logout)
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  gradient,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.text.inverse : theme.text.primary}
        />
      ) : (
        <>
          {icon ? (
            <FontAwesome5
              name={icon}
              size={14}
              color={
                variant === 'primary'
                  ? theme.text.inverse
                  : variant === 'danger'
                  ? theme.negative
                  : theme.text.primary
              }
              solid
            />
          ) : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
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
          colors={gradient ?? theme.solar.gradient}
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
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  fill: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  ghost: {
    backgroundColor: theme.glass.fill,
    borderWidth: 1,
    borderColor: theme.glass.borderStrong,
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
    color: theme.text.primary,
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'center',
  },
  labelPrimary: { color: theme.text.inverse },
  labelDanger: { color: theme.negative },
});
