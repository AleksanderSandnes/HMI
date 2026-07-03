import { Ionicons } from "@expo/vector-icons";
import {
  deriveInitials,
  growattConfig,
  weatherConfig,
  type ApiSettingsResponse,
  type UserProfile,
} from "@hmi/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { cn } from "../../lib/cn";
import { useI18n } from "../../lib/i18n";
import { useThemeColors } from "../../lib/theme";
import { useAvatar } from "../../lib/useAvatar";
import { useCore } from "../../lib/useCore";
import { useLogout } from "../../lib/useLogout";
import { usePreference } from "../../lib/usePreference";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";

import { PreferencesGroup } from "./PreferencesGroup";
import { ConfiguredBadge } from "./forms";
import { GroupLabel, SettingsGroup, SettingsRow } from "./list";

/** Settings sub-screens reachable from the hub list. */
export type SettingsSubRoute = "profile" | "password" | "growatt" | "weather";

function ProfileCard({
  profile,
  onPress,
  active,
}: {
  profile?: UserProfile;
  onPress: () => void;
  active: boolean;
}) {
  const { uri } = useAvatar();
  const { colors } = useThemeColors();
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress}>
      <GlassCard
        strong
        className={cn(
          "flex-row items-center gap-3.5 p-3.5",
          active && "border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)]",
        )}
      >
        <Avatar initials={deriveInitials(profile?.username)} uri={uri} size={52} />
        <View className="min-w-0 flex-1">
          <Text className="text-[16px] font-extrabold text-text-primary">
            {profile?.username ?? t("settings.yourProfile")}
          </Text>
          <Text className="mt-0.5 text-[12.5px] text-text-muted">{profile?.email ?? "—"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </GlassCard>
    </Pressable>
  );
}

/** Account + integrations nav groups (the rows that open sub-screens). */
function HubNavGroups({
  activeRoute,
  onSelect,
  api,
}: {
  activeRoute?: SettingsSubRoute;
  onSelect: (route: SettingsSubRoute) => void;
  api: ApiSettingsResponse | null | undefined;
}) {
  const { t } = useI18n();
  const gc = growattConfig(api);
  const wc = weatherConfig(api);
  return (
    <>
      <GroupLabel>{t("settings.account")}</GroupLabel>
      <SettingsGroup>
        <SettingsRow
          icon="lock-closed"
          gradient="revenue"
          title={t("settings.changePassword")}
          active={activeRoute === "password"}
          onPress={() => onSelect("password")}
        />
      </SettingsGroup>

      <GroupLabel>{t("settings.integrations")}</GroupLabel>
      <SettingsGroup>
        <SettingsRow
          icon="sunny"
          gradient="energy"
          title={t("settings.growatt")}
          subtitle={t("settings.growattSubtitle")}
          right={<ConfiguredBadge on={gc.configured} />}
          active={activeRoute === "growatt"}
          onPress={() => onSelect("growatt")}
        />
        <SettingsRow
          icon="cloud"
          gradient="solar"
          title={t("settings.weatherStation")}
          subtitle={t("settings.weatherSubtitle")}
          right={<ConfiguredBadge on={wc.configured} />}
          active={activeRoute === "weather"}
          onPress={() => onSelect("weather")}
        />
      </SettingsGroup>
    </>
  );
}

/**
 * The settings hub content: profile card, account/integration rows,
 * preferences, sign out. Rendered as the whole Settings screen on phones and
 * as the persistent list column of the tablet master–detail split, so
 * navigation goes through `onSelect` and the selected row via `activeRoute`.
 */
export function SettingsHubList({
  activeRoute,
  onSelect,
  showTitle = false,
}: {
  activeRoute?: SettingsSubRoute;
  onSelect: (route: SettingsSubRoute) => void;
  showTitle?: boolean;
}) {
  const { t } = useI18n();
  const { account, settings } = useCore();
  const logout = useLogout();
  const tabBarHeight = useBottomTabBarHeight();
  const [pushOn, setPushOn] = usePreference("pref.push", true);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  useEffect(() => settings.subscribeSettings(() => void refetch()), [settings, refetch]);

  return (
    <ScrollView
      contentContainerClassName="gap-3 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
    >
      {showTitle ? (
        <View className="mb-1">
          <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-text-primary">
            {t("settings.title")}
          </Text>
          <Text className="mt-1 text-[14px] font-medium text-text-muted">
            {t("settings.subtitle")}
          </Text>
        </View>
      ) : null}

      <ProfileCard
        profile={profile}
        active={activeRoute === "profile"}
        onPress={() => onSelect("profile")}
      />

      <HubNavGroups activeRoute={activeRoute} onSelect={onSelect} api={api} />

      <GroupLabel>{t("settings.preferences")}</GroupLabel>
      <PreferencesGroup pushOn={pushOn} setPushOn={setPushOn} />

      <Button
        label={t("settings.signOut")}
        icon={({ color, size }) => <Ionicons name="log-out" size={size} color={color} />}
        variant="danger"
        onPress={logout}
        className="mt-1 w-full"
      />
    </ScrollView>
  );
}
