import { DeleteAccountForm } from "../../../src/components/settings/DeleteAccountForm";
import { SubScreen } from "../../../src/components/settings/SubScreen";
import { useI18n } from "../../../src/lib/i18n";
import { useCore } from "../../../src/lib/useCore";

export default function DeleteAccountScreen() {
  const { account } = useCore();
  const { t } = useI18n();
  return (
    <SubScreen title={t("settings.deleteAccount")} subtitle={t("settings.deleteAccountSubtitle")}>
      <DeleteAccountForm account={account} />
    </SubScreen>
  );
}
