import { Ionicons } from "@expo/vector-icons";
import {
  growattConfig,
  weatherConfig,
  type ApiSettingsResponse,
  type UserProfile,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfiguredBadge } from "../../../src/components/settings/forms";
import {
  GroupLabel,
  SettingsGroup,
  SettingsRow,
  Toggle,
} from "../../../src/components/settings/list";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Button } from "../../../src/components/ui/Button";
import { GlassCard } from "../../../src/components/ui/GlassCard";
import { useAvatar } from "../../../src/lib/useAvatar";
import { useCore } from "../../../src/lib/useCore";
import { useLogout } from "../../../src/lib/useLogout";
import { usePreference } from "../../../src/lib/usePreference";

function initials(name?: string | null): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ProfileCard({ profile, onPress }: { profile?: UserProfile; onPress: () => void }) {
  const { uri } = useAvatar();
  return (
    <Pressable onPress={onPress}>
      <GlassCard strong className="flex-row items-center gap-3.5 p-3.5">
        <Avatar initials={initials(profile?.username)} uri={uri} size={52} />
        <View className="min-w-0 flex-1">
          <Text className="text-[16px] font-extrabold text-text-primary">
            {profile?.username ?? "Your profile"}
          </Text>
          <Text className="mt-0.5 text-[12.5px] text-text-muted">{profile?.email ?? "—"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71809a" />
      </GlassCard>
    </Pressable>
  );
}

export default function SettingsHub() {
  const router = useRouter();
  const { account, settings } = useCore();
  const logout = useLogout();
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

  const gc = growattConfig(api);
  const wc = weatherConfig(api);

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4">
        <View className="mb-1">
          <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-text-primary">
            Settings
          </Text>
          <Text className="mt-1 text-[14px] font-medium text-text-muted">
            Account & integrations
          </Text>
        </View>

        <ProfileCard profile={profile} onPress={() => router.push("/settings/profile")} />

        <GroupLabel>Integrations</GroupLabel>
        <SettingsGroup>
          <SettingsRow
            icon="sunny"
            gradient="energy"
            title="Growatt solar"
            subtitle="Production data source"
            right={<ConfiguredBadge on={gc.configured} />}
            onPress={() => router.push("/settings/growatt")}
          />
          <SettingsRow
            icon="cloud"
            gradient="solar"
            title="Weather.com station"
            subtitle="Local conditions source"
            right={<ConfiguredBadge on={wc.configured} />}
            onPress={() => router.push("/settings/weather")}
          />
        </SettingsGroup>

        <GroupLabel>Preferences</GroupLabel>
        <SettingsGroup>
          <SettingsRow
            icon="notifications"
            gradient="accent"
            title="Push notifications"
            subtitle="Alerts on this device"
            right={<Toggle value={pushOn} onChange={setPushOn} />}
          />
          <SettingsRow
            icon="moon"
            gradient="energy"
            title="Dark theme"
            subtitle="Match system · always on"
            right={<Toggle value disabled />}
          />
        </SettingsGroup>

        <GroupLabel>Account</GroupLabel>
        <SettingsGroup>
          <SettingsRow
            icon="lock-closed"
            gradient="revenue"
            title="Change password"
            onPress={() => router.push("/settings/password")}
          />
        </SettingsGroup>

        <Button label="Sign out" variant="danger" onPress={logout} className="mt-1 w-full" />
      </ScrollView>
    </SafeAreaView>
  );
}
