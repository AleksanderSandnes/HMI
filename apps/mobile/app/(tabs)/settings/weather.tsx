import { weatherConfig, type ApiSettingsResponse } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { WeatherForm } from "../../../src/components/settings/forms";
import { useI18n } from "../../../src/lib/i18n";
import { useCore } from "../../../src/lib/useCore";

export default function WeatherCredentialsScreen() {
  const { settings } = useCore();
  const { t } = useI18n();
  // Shares the ["api-settings"] cache with the Settings hub, which owns the
  // realtime subscription (subscribing again here collides on the same channel).
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  const wc = weatherConfig(api);

  return (
    <SubScreen title={t("settings.weatherStation")} subtitle={t("settings.personalWeatherStation")}>
      <WeatherForm
        key={wc.key}
        initialStationId={wc.station}
        connected={wc.configured}
        settings={settings}
        onSaved={refetch}
      />
    </SubScreen>
  );
}
