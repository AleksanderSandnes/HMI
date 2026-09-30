import { coreErrorMessage, type AccountApi } from "@hmi/core";
import { useState } from "react";
import { Text, View } from "react-native";

import { useI18n } from "../../lib/i18n";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";

/**
 * Two-step permanent account deletion. On success core signs the session out
 * locally, and the auth provider's SIGNED_OUT handling returns to login and
 * clears cached queries.
 */
export function DeleteAccountForm({ account }: { account: AccountApi }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setError(null);
    setDeleting(true);
    try {
      await account.deleteAccount();
    } catch (e) {
      setError(coreErrorMessage(e, t, t("error.accountDeletionFailed")));
      setDeleting(false);
    }
  }

  return (
    <GlassCard strong className="gap-4 p-5">
      {confirming ? (
        <Text className="text-[16px] font-extrabold text-text-primary">
          {t("settings.deleteAccountConfirmTitle")}
        </Text>
      ) : null}
      <Text className="text-[14px] leading-5 text-text-secondary">
        {t("settings.deleteAccountConfirmBody")}
      </Text>
      {error ? <Text className="text-[13px] font-bold text-negative">{error}</Text> : null}
      {confirming ? (
        <View className="gap-2.5">
          <Button
            label={t("settings.deleteAccountConfirm")}
            variant="danger"
            loading={deleting}
            onPress={() => void remove()}
            className="w-full"
          />
          <Button
            label={t("common.cancel")}
            variant="ghost"
            disabled={deleting}
            onPress={() => setConfirming(false)}
            className="w-full"
          />
        </View>
      ) : (
        <Button
          label={t("settings.deleteAccount")}
          variant="danger"
          onPress={() => setConfirming(true)}
          className="w-full"
        />
      )}
    </GlassCard>
  );
}
