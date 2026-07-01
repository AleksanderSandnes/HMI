import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";

import { cn } from "../../lib/cn";
import { useThemeColors } from "../../lib/theme";

import type { IconRender } from "./types";

interface FieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  icon?: IconRender;
  /** Renders a password field with a show/hide toggle. */
  secure?: boolean;
  hint?: string;
  error?: string;
}

function RevealToggle({ reveal, onToggle }: { reveal: boolean; onToggle: () => void }) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={reveal ? "Hide password" : "Show password"}
      className="py-1.5 pl-2.5"
    >
      <Ionicons
        name={reveal ? "eye-off-outline" : "eye-outline"}
        size={16}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

function FieldHelp({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return <Text className="ml-0.5 mt-1.5 text-xs font-semibold text-negative">{error}</Text>;
  }
  if (hint) {
    return <Text className="mt-1.5 text-[11.5px] font-medium text-text-muted">{hint}</Text>;
  }
  return null;
}

/**
 * Labeled text input (mirrors apps/web/components/ui/Field.tsx) — glass fill,
 * hairline border, focus glow, optional leading icon and password toggle.
 */
export function Field({
  label,
  icon,
  secure = false,
  hint,
  error,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const { colors } = useThemeColors();

  return (
    <View className="mb-4">
      <Text className="mb-2 text-[12.5px] font-bold tracking-[0.3px] text-text-secondary">
        {label}
      </Text>
      <View
        className={cn(
          "flex-row items-center rounded-md border px-3.5",
          focused ? "border-solar bg-glass-fill" : "border-glass-border bg-glass-fill-subtle",
        )}
      >
        {icon ? (
          <View className="mr-2.5">
            {icon({ color: focused ? colors.solarTint : colors.textMuted, size: 14 })}
          </View>
        ) : null}
        <TextInput
          {...inputProps}
          secureTextEntry={secure && !reveal}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="flex-1 py-3 text-[15px] font-semibold text-text-primary"
        />
        {secure ? <RevealToggle reveal={reveal} onToggle={() => setReveal((r) => !r)} /> : null}
      </View>
      <FieldHelp error={error} hint={hint} />
    </View>
  );
}

export default Field;
