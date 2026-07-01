import { growattConfig, type ApiSettingsResponse } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { ConfiguredBadge, GrowattForm } from "../../../src/components/settings/forms";
import { useCore } from "../../../src/lib/useCore";

export default function GrowattScreen() {
  const { settings } = useCore();
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  useEffect(() => settings.subscribeSettings(() => void refetch()), [settings, refetch]);
  const gc = growattConfig(api);

  return (
    <SubScreen title="Growatt solar" subtitle="Used by the server to fetch your solar data">
      <View className="flex-row items-center gap-2.5">
        <Text className="text-sm text-text-secondary">Connection</Text>
        <ConfiguredBadge on={gc.configured} />
      </View>
      <GrowattForm key={gc.key} initialEmail={gc.email} settings={settings} onSaved={refetch} />
    </SubScreen>
  );
}
