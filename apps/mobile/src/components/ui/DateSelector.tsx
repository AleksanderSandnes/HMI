import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS } from "../../lib/gradients";

import { Calendar } from "./Calendar";
import { GlassCard } from "./GlassCard";

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  disabled?: boolean;
}

const QUICK = [
  { label: "Today", daysAgo: 0 },
  { label: "Yesterday", daysAgo: 1 },
  { label: "7d ago", daysAgo: 7 },
  { label: "30d ago", daysAgo: 30 },
];

const toISO = (d: Date) => d.toISOString().split("T")[0];

const quickIso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toISO(d);
};

function DateTrigger({
  relative,
  absolute,
  disabled,
  onPress,
}: {
  relative: string;
  absolute: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <GlassCard strong>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="flex-row items-center gap-3.5 px-4 py-3.5"
      >
        <LinearGradient
          colors={GRADIENTS.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="calendar" size={18} color="#0a1124" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-text-primary">{relative}</Text>
          <Text className="mt-0.5 text-[12.5px] text-text-muted">{absolute}</Text>
        </View>
        <Ionicons name="chevron-down" size={14} color="#71809a" />
      </Pressable>
    </GlassCard>
  );
}

interface QuickSheetProps {
  visible: boolean;
  width: number;
  selectedDate: string;
  onClose: () => void;
  onPick: (daysAgo: number) => void;
  onCustom: () => void;
}

function QuickSheet({ visible, width, selectedDate, onClose, onPick, onCustom }: QuickSheetProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center p-6">
        <BlurView
          intensity={14}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          className="bg-[rgba(4,7,16,0.7)]"
        />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <GlassCard
            strong
            elevated
            className="p-[22px]"
            style={{ width: Math.min(420, width - 48) }}
          >
            <View className="mb-[18px] flex-row items-center justify-between">
              <Text className="text-[19px] font-extrabold text-text-primary">Select date</Text>
              <Pressable
                onPress={onClose}
                className="h-[34px] w-[34px] items-center justify-center rounded-pill border border-glass-border bg-glass-fill-strong"
              >
                <Ionicons name="close" size={15} color="#aeb8cc" />
              </Pressable>
            </View>

            <Text className="mb-3 text-xs font-bold uppercase tracking-[0.5px] text-text-muted">
              Quick select
            </Text>
            <View className="mb-[22px] flex-row flex-wrap gap-2.5">
              {QUICK.map((q) => {
                const act = quickIso(q.daysAgo) === selectedDate;
                return (
                  <Pressable
                    key={q.label}
                    onPress={() => onPick(q.daysAgo)}
                    className={cn(
                      "grow basis-[40%] items-center rounded-md border py-3",
                      act ? "border-solar bg-solar-soft" : "border-glass-border bg-glass-fill",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-bold",
                        act ? "text-solar-light" : "text-text-secondary",
                      )}
                    >
                      {q.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mb-3 text-xs font-bold uppercase tracking-[0.5px] text-text-muted">
              Custom
            </Text>
            <Pressable onPress={onCustom} className="overflow-hidden rounded-md">
              <LinearGradient
                colors={GRADIENTS.solar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  paddingVertical: 15,
                }}
              >
                <Ionicons name="calendar-outline" size={15} color="#0a1124" />
                <Text className="text-[15px] font-extrabold text-text-inverse">
                  Pick a custom date
                </Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export function DateSelector({ selectedDate, onDateSelect, disabled = false }: DateSelectorProps) {
  const { width } = useWindowDimensions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedObj = new Date(selectedDate);

  const relative = (() => {
    const diff = Math.floor((Date.now() - selectedObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff > 1 && diff <= 7) return `${diff} days ago`;
    return selectedObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  })();

  const absolute = selectedObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pickQuick = (daysAgo: number) => {
    onDateSelect(quickIso(daysAgo));
    setSheetOpen(false);
  };

  return (
    <>
      <DateTrigger
        relative={relative}
        absolute={absolute}
        disabled={disabled}
        onPress={() => setSheetOpen(true)}
      />

      <QuickSheet
        visible={sheetOpen}
        width={width}
        selectedDate={selectedDate}
        onClose={() => setSheetOpen(false)}
        onPick={pickQuick}
        onCustom={() => {
          setSheetOpen(false);
          setPickerOpen(true);
        }}
      />

      <Calendar
        visible={pickerOpen}
        value={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelect={(iso) => {
          setPickerOpen(false);
          onDateSelect(iso);
        }}
      />
    </>
  );
}

export default DateSelector;
