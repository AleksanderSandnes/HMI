import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { solarTheme } from '../../theme/solarTheme';
import { SPACING } from '../../constants';

const AnimatedButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const ButtonContent = () => <Text style={textStyles}>{title}</Text>;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled}
        {...props}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={solarTheme.primary.gradient}
            style={styles.gradient}
          >
            <ButtonContent />
          </LinearGradient>
        ) : (
          <ButtonContent />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    elevation: solarTheme.shadow.elevation,
    shadowColor: solarTheme.shadow.color,
    shadowOffset: solarTheme.shadow.offset,
    shadowOpacity: solarTheme.shadow.opacity,
    shadowRadius: solarTheme.shadow.radius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  primary: {
    backgroundColor: solarTheme.button.primary.background,
    borderWidth: 2,
    borderColor: solarTheme.button.primary.border,
  },
  secondary: {
    backgroundColor: solarTheme.button.secondary.background,
    borderWidth: 2,
    borderColor: solarTheme.button.secondary.border,
    backdropFilter: 'blur(10px)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minWidth: 160,
  },
  small: {
    minWidth: 120,
  },
  medium: {
    minWidth: 160,
  },
  large: {
    minWidth: 200,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: solarTheme.background.cardLight,
  },
  buttonText: {
    color: solarTheme.button.primary.text,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  primaryText: {
    color: solarTheme.button.primary.text,
    fontSize: 16,
  },
  secondaryText: {
    color: solarTheme.button.secondary.text,
    fontSize: 16,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    color: solarTheme.text.tertiary,
  },
});

export default AnimatedButton;
