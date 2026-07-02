import { type UserProfile } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { AccountForm } from "../../../src/components/settings/forms";
import { useI18n } from "../../../src/lib/i18n";
import { useCore } from "../../../src/lib/useCore";

export default function ProfileScreen() {
  const { account } = useCore();
  const { t } = useI18n();
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });

  return (
    <SubScreen title={t("settings.account")} subtitle={t("settings.yourProfile")}>
      {profile ? (
        <AccountForm username={profile.username} email={profile.email} account={account} />
      ) : (
        <Text className="text-sm text-text-muted">{t("common.loading")}</Text>
      )}
    </SubScreen>
  );
}
