import { Ionicons } from "@expo/vector-icons";
import { timeAgo, type NotificationItem, type NotificationLevel } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "../../src/components/ui/GlassCard";
import { useCore } from "../../src/lib/useCore";

const LEVEL: Record<NotificationLevel, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: "checkmark-circle", color: "#34d399" },
  error: { icon: "alert-circle", color: "#fb7185" },
  warning: { icon: "warning", color: "#fbbf24" },
  info: { icon: "information-circle", color: "#818cf8" },
};

function EmptyState() {
  return (
    <GlassCard className="items-center gap-3 p-12">
      <Ionicons name="notifications-outline" size={32} color="#71809a" />
      <Text className="text-sm font-semibold text-text-secondary">You&apos;re all caught up</Text>
      <Text className="text-center text-sm text-text-muted">
        Solar & weather sync alerts will appear here.
      </Text>
    </GlassCard>
  );
}

function NotificationRow({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const { icon, color } = LEVEL[item.level] ?? LEVEL.info;
  return (
    <GlassCard className="flex-row items-start gap-3.5 p-4">
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 2 }} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className="flex-1 font-bold text-text-primary">
            {item.title}
          </Text>
          <Text className="text-xs font-medium text-text-muted">{timeAgo(item.createdAt)}</Text>
        </View>
        {item.message ? (
          <Text className="mt-1 text-sm text-text-secondary">{item.message}</Text>
        ) : null}
      </View>
      <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
        <Ionicons name="close" size={16} color="#71809a" />
      </Pressable>
    </GlassCard>
  );
}

export default function Notifications() {
  const { notifications } = useCore();

  const { data, refetch, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => notifications.fetchNotifications(),
  });

  useEffect(() => {
    const unsub = notifications.subscribeNotifications(() => void refetch());
    return unsub;
  }, [notifications, refetch]);

  const items = data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-text-primary">
              Notifications
            </Text>
            <Text className="mt-1 text-[14px] font-medium text-text-muted">
              {items.length} {items.length === 1 ? "notification" : "notifications"}
            </Text>
          </View>
          {items.length > 0 ? (
            <Pressable
              onPress={async () => {
                await notifications.clearNotifications();
                void refetch();
              }}
              className="flex-row items-center gap-2 rounded-md border border-glass-border bg-glass-fill px-3.5 py-2"
            >
              <Ionicons name="trash-outline" size={15} color="#71809a" />
              <Text className="text-sm font-bold text-text-muted">Clear all</Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <GlassCard className="p-8">
            <Text className="text-center text-sm text-text-muted">Loading…</Text>
          </GlassCard>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onDismiss={async () => {
                  await notifications.dismissNotification(item.id);
                  void refetch();
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
