import { Ionicons } from "@expo/vector-icons";
import { BREAKPOINTS, type LayoutMode, type UserProfile } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationsOverlay } from "../../src/components/NotificationsOverlay";
import { DashboardTopbar } from "../../src/components/dashboard/DashboardTopbar";
import { SolarHeroCard } from "../../src/components/dashboard/SolarHeroCard";
import {
  WeatherSummaryCard,
  type WeatherSummaryVariant,
} from "../../src/components/dashboard/WeatherSummaryCard";
import { useI18n } from "../../src/lib/i18n";
import { useThemeColors } from "../../src/lib/theme";
import { useCore } from "../../src/lib/useCore";
import { useDashboardData, type DashboardModel } from "../../src/lib/useDashboardData";
import { useLayoutMode } from "../../src/lib/useLayoutMode";
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
  const { colors } = useThemeColors();
  return (
    <View className="flex-row items-center gap-2.5">
      <Ionicons name={icon} size={14} color={colors.solarTint} />
      <Text className="text-[11.5px] font-extrabold uppercase tracking-[0.7px] text-text-secondary">
        {text}
      </Text>
      <View className="h-px flex-1 bg-glass-border" />
      {right ? <Text className="text-[11px] font-bold text-text-muted">{right}</Text> : null}
    </View>
  );
}

/**
 * Weather-card presentation for the current window. Landscape phones shrink
 * the card to fit the short viewport; wide portrait tablets (>= web md
 * breakpoint) get the rich 2×2 widget; other tablets keep the phone card but
 * let the dial absorb the roomier card (more so in landscape, where the
 * two-column card is tall and wide).
 */
function weatherCardFor(
  mode: LayoutMode,
  width: number,
): { variant: WeatherSummaryVariant; dialSize?: number } {
  if (mode.isPhoneLandscape) return { variant: "compact" };
  if (!mode.isLandscape && width >= BREAKPOINTS.mobile) return { variant: "rich" };
  if (mode.isTablet) return { variant: "default", dialSize: mode.isLandscape ? 230 : 190 };
  return { variant: "default" };
}

/** Section-label captions: "MID 12KTL3-XL · 12 kW" and the updated-at clock. */
function labelMeta(model: DashboardModel) {
  const { device, capacityKw, obs } = model;
  const solarRight = [device?.model, capacityKw != null ? `${capacityKw} kW` : null]
    .filter(Boolean)
    .join(" · ");
  return { solarRight: solarRight || undefined, updatedTime: obs?.obsTimeLocal?.split(" ")[1] };
}

export default function Dashboard() {
  const { account } = useCore();
  const { t } = useI18n();
  const mode = useLayoutMode();
  const { width } = useWindowDimensions();
  const twoCol = mode.columns === 2;
  const weatherCard = weatherCardFor(mode, width);
  const model = useDashboardData();
  const { items, count, clearAll, dismiss } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
    staleTime: Infinity,
  });

  const { solarRight, updatedTime } = labelMeta(model);
  const updated = updatedTime ? `${t("dashboard.updated")} ${updatedTime}` : undefined;

  // Section fragments shared by both arrangements: a single portrait column,
  // or solar | weather side by side when the window is wide (columns === 2).
  const solarSection = (
    <>
      <SectionLabel icon="sunny" text={t("dashboard.solar")} right={solarRight} />
      <SolarHeroCard model={model} />
    </>
  );
  const weatherSection = (
    <>
      <SectionLabel icon="partly-sunny" text={t("dashboard.weather")} right={updated} />
      <WeatherSummaryCard
        model={model}
        variant={weatherCard.variant}
        dialSize={weatherCard.dialSize}
      />
    </>
  );

  return (
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
      <View className="flex-1 gap-3 px-4 pb-3 pt-1">
        {/* Landscape phones need the height for the two cards (mirrors web,
            which hides the hero topbar in landscape); the bell is reachable
            in portrait. */}
        {!mode.isPhoneLandscape ? (
          <DashboardTopbar
            username={profile?.username}
            notifCount={count}
            online={model.device?.online}
            onBellPress={() => setNotifOpen(true)}
          />
        ) : null}

        {twoCol ? (
          <View className="min-h-0 flex-1 flex-row gap-3">
            <View className="min-w-0 flex-1 gap-3">{solarSection}</View>
            <View className="min-w-0 flex-1 gap-3">{weatherSection}</View>
          </View>
        ) : (
          <>
            {solarSection}
            {weatherSection}
          </>
        )}
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
