import { Ionicons } from "@expo/vector-icons";
import { timeAgo, type NotificationItem, type NotificationLevel } from "@hmi/core";
import { LinearGradient } from "expo-linear-gradient";
import { Modal as RNModal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GRADIENTS } from "../lib/gradients";
import { useThemeColors } from "../lib/theme";

type Grad = readonly [string, string, string];

const LEVEL: Record<NotificationLevel, { grad: Grad; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { grad: GRADIENTS.energy, icon: "trending-up" },
  info: { grad: GRADIENTS.accent, icon: "information-circle" },
  warning: { grad: GRADIENTS.revenue, icon: "warning" },
  error: { grad: ["#fda4af", "#fb7185", "#f43f5e"], icon: "alert-circle" },
};

function Row({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const { colors } = useThemeColors();
  const { grad, icon } = LEVEL[item.level] ?? LEVEL.info;
  return (
    <View>
      <View className="flex-row items-center gap-3 px-3.5 py-3">
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={18} color="#0a1124" />
        </LinearGradient>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[13.5px] font-bold text-text-primary">
            {item.title}
          </Text>
          {item.message ? (
            <Text numberOfLines={2} className="mt-0.5 text-[11.5px] text-text-secondary">
              {item.message}
            </Text>
          ) : null}
          <Text className="mt-0.5 text-[10.5px] text-text-muted">{timeAgo(item.createdAt)}</Text>
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityLabel="Dismiss"
          className="h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-glass-fill"
        >
          <Ionicons name="close" size={15} color={colors.textMuted} />
        </Pressable>
      </View>
      <View className="ml-16 h-px bg-glass-border" />
    </View>
  );
}

function EmptyState() {
  const { colors } = useThemeColors();
  return (
    <View className="items-center gap-2.5 px-5 py-12">
      <Ionicons name="notifications-off-outline" size={26} color={colors.textMuted} />
      <Text className="text-[13px] font-semibold text-text-secondary">
        You&apos;re all caught up
      </Text>
    </View>
  );
}

/** Bell-triggered notifications panel on the Dashboard (design 1c). */
export function NotificationsOverlay({
  visible,
  onClose,
  items,
  onClear,
  onDismiss,
}: {
  visible: boolean;
  onClose: () => void;
  items: NotificationItem[];
  onClear: () => void;
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1"
        style={{ backgroundColor: colors.scrim, paddingTop: insets.top + 6, paddingHorizontal: 14 }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            className="max-h-[560px] overflow-hidden rounded-[20px] border border-glass-border-strong"
            style={{
              backgroundColor: colors.panelBg,
              shadowColor: "#000",
              shadowOpacity: 0.6,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 20 },
              elevation: 24,
            }}
          >
            <View className="flex-row items-center justify-between border-b border-glass-border px-4 py-3">
              <Text className="text-[15.5px] font-extrabold text-text-primary">Notifications</Text>
              {items.length > 0 ? (
                <Pressable onPress={onClear}>
                  <Text className="text-[12px] font-extrabold text-solar-light">Clear all</Text>
                </Pressable>
              ) : null}
            </View>
            {items.length === 0 ? (
              <EmptyState />
            ) : (
              <ScrollView>
                {items.map((item) => (
                  <Row key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
                ))}
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export default NotificationsOverlay;
