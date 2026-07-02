import { growattConfig, type ApiSettingsResponse } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { GrowattForm } from "../../../src/components/settings/forms";
import { useI18n } from "../../../src/lib/i18n";
import { useCore } from "../../../src/lib/useCore";

export default function GrowattScreen() {
  const { settings } = useCore();
  const { t } = useI18n();
  // Shares the ["api-settings"] cache with the Settings hub, which owns the
  // realtime subscription (subscribing again here collides on the same channel).
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  const gc = growattConfig(api);

  return (
    <SubScreen title={t("settings.growatt")} subtitle={t("settings.solarProductionSource")}>
      <GrowattForm
        key={gc.key}
        initialEmail={gc.email}
        connected={gc.configured}
        settings={settings}
        onSaved={refetch}
      />
    </SubScreen>
  );
}
