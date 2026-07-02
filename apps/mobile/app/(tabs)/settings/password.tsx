import { SubScreen } from "../../../src/components/settings/SubScreen";
import { PasswordForm } from "../../../src/components/settings/forms";
import { useI18n } from "../../../src/lib/i18n";
import { useCore } from "../../../src/lib/useCore";

export default function PasswordScreen() {
  const { account } = useCore();
  const { t } = useI18n();
  return (
    <SubScreen title={t("settings.changePassword")} subtitle={t("settings.updateYourPassword")}>
      <PasswordForm account={account} />
    </SubScreen>
  );
}
