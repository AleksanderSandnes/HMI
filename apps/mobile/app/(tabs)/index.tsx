import { Ionicons } from "@expo/vector-icons";
import { type UserProfile } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationsOverlay } from "../../src/components/NotificationsOverlay";
import { DashboardTopbar } from "../../src/components/dashboard/DashboardTopbar";
import { SolarHeroCard } from "../../src/components/dashboard/SolarHeroCard";
import { WeatherSummaryCard } from "../../src/components/dashboard/WeatherSummaryCard";
import { useCore } from "../../src/lib/useCore";
import { useDashboardData } from "../../src/lib/useDashboardData";
import { useNotifications } from "../../src/lib/useNotifications";

function SectionLabel({
  icon,
  text,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Ionicons name={icon} size={14} color="#fbbf24" />
      <Text className="text-[11.5px] font-extrabold uppercase tracking-[0.7px] text-text-secondary">
        {text}
      </Text>
      <View className="h-px flex-1 bg-glass-border" />
      {right ? <Text className="text-[11px] font-bold text-text-muted">{right}</Text> : null}
    </View>
  );
}

export default function Dashboard() {
  const { account } = useCore();
  const model = useDashboardData();
  const { items, count, clearAll, dismiss } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
    staleTime: Infinity,
  });

  const { device, capacityKw, obs } = model;
  const solarRight = [device?.model, capacityKw != null ? `${capacityKw} kW` : null]
    .filter(Boolean)
    .join(" · ");
  const updated = obs?.obsTimeLocal ? `updated ${obs.obsTimeLocal.split(" ")[1] ?? ""}` : undefined;

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <View className="flex-1 gap-3 px-4 pb-3 pt-1">
        <DashboardTopbar
          username={profile?.username}
          notifCount={count}
          online={device?.online}
          onBellPress={() => setNotifOpen(true)}
        />

        <SectionLabel icon="sunny" text="Solar" right={solarRight || undefined} />
        <SolarHeroCard model={model} />

        <SectionLabel icon="partly-sunny" text="Weather" right={updated} />
        <WeatherSummaryCard model={model} />
      </View>

      <NotificationsOverlay
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        items={items}
        onClear={() => void clearAll()}
        onDismiss={(id) => void dismiss(id)}
      />
    </SafeAreaView>
  );
}
