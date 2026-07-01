import { LinearGradient } from "expo-linear-gradient";
import {
  Text,
  Pressable,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { cn } from "../../lib/cn";
import { BUTTON_GRADIENTS, type ButtonGradient } from "../../lib/gradients";
import { useThemeColors, type ThemeColors } from "../../lib/theme";

import type { IconRender } from "./types";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconRender;
  loading?: boolean;
  disabled?: boolean;
  /** Gradient for the primary variant (default solar). */
  gradient?: ButtonGradient;
  /** Layout classes (e.g. 'w-full' / 'flex-1'). */
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function labelColor(variant: Variant, colors: ThemeColors): string {
  if (variant === "primary") return colors.textInverse;
  if (variant === "danger") return colors.negative;
  return colors.textPrimary;
}

/** Border/fill for the non-primary (ghost/danger) variants. */
function nonPrimaryDecoration(
  variant: Variant,
  colors: ThemeColors,
): { style?: StyleProp<ViewStyle>; className?: string } {
  if (variant === "danger") {
    return { style: { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBg } };
  }
  if (variant === "ghost") {
    return { className: "border-glass-border-strong bg-glass-fill" };
  }
  return {};
}

function ButtonContent({
  label,
  icon,
  loading,
  color,
}: {
  label: string;
  icon?: IconRender;
  loading: boolean;
  color: string;
}) {
  return (
    <View className="flex-row items-center justify-center gap-2.5">
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon ? icon({ color, size: 15 }) : null}
          <Text
            numberOfLines={1}
            style={{ color }}
            className="text-[15px] font-extrabold tracking-[0.2px]"
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );
}

/**
 * Action button (mirrors apps/web/components/ui/Button.tsx):
 * - primary: solar (or chosen) gradient fill
 * - ghost: translucent glass
 * - danger: red-tinted glass
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  gradient = "solar",
  className,
  style,
}: ButtonProps) {
  const { colors } = useThemeColors();
  const isDisabled = disabled || loading;
  const color = labelColor(variant, colors);
  const inner = <ButtonContent label={label} icon={icon} loading={loading} color={color} />;

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        style={style}
        className={cn("overflow-hidden rounded-md", isDisabled && "opacity-50", className)}
      >
        <LinearGradient
          colors={BUTTON_GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
          }}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  const decoration = nonPrimaryDecoration(variant, colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[decoration.style, style]}
      className={cn(
        "min-h-12 items-center justify-center rounded-md border px-4",
        decoration.className,
        isDisabled && "opacity-50",
        className,
      )}
    >
      {inner}
    </Pressable>
  );
}

export default Button;
