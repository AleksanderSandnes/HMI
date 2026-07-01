import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Children, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS, type StatGradient } from "../../lib/gradients";
import { GlassCard } from "../ui/GlassCard";

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="ml-1 mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-muted">
      {children}
    </Text>
  );
}

/** Grouped glass list container; inserts hairline dividers between rows. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <GlassCard strong>
      {rows.map((row, i) => (
        <View key={i}>
          {row}
          {i < rows.length - 1 ? <View className="ml-[62px] h-px bg-glass-border" /> : null}
        </View>
      ))}
    </GlassCard>
  );
}

export function SettingsRow({
  icon,
  gradient,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: StatGradient;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <View className="flex-row items-center gap-3 px-3.5 py-3">
      <LinearGradient
        colors={GRADIENTS[gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color="#0a1124" />
      </LinearGradient>
      <View className="min-w-0 flex-1">
        <Text className="text-[14.5px] font-bold text-text-primary">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[11.5px] text-text-muted">{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color="#71809a" /> : null)}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

/** iOS-style switch used for the preference rows. */
export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || !onChange}
      onPress={() => onChange?.(!value)}
      className={cn(
        "h-7 w-[46px] justify-center rounded-pill p-[3px]",
        value ? "bg-solar" : "bg-glass-fill-strong border border-glass-border",
        disabled && "opacity-70",
      )}
    >
      <View className={cn("h-[22px] w-[22px] rounded-pill bg-white", value && "ml-auto")} />
    </Pressable>
  );
}
