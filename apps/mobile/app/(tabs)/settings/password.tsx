import { SubScreen } from "../../../src/components/settings/SubScreen";
import { PasswordForm } from "../../../src/components/settings/forms";
import { useCore } from "../../../src/lib/useCore";

export default function PasswordScreen() {
  const { account } = useCore();
  return (
    <SubScreen title="Change password" subtitle="Set a new password for your account">
      <PasswordForm account={account} />
    </SubScreen>
  );
}
