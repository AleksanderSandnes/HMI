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

const LABEL_COLOR: Record<Variant, string> = {
  primary: "#0a1124", // text-inverse
  ghost: "#f6f8fc", // text-primary
  danger: "#fb7185", // negative
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "",
  ghost: "border-glass-border-strong bg-glass-fill",
  danger: "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.10)]",
};

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
  const isDisabled = disabled || loading;
  const color = LABEL_COLOR[variant];
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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={style}
      className={cn(
        "min-h-12 items-center justify-center rounded-md border px-4",
        VARIANT_CLASS[variant],
        isDisabled && "opacity-50",
        className,
      )}
    >
      {inner}
    </Pressable>
  );
}

export default Button;
