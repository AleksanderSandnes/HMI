import { type UserProfile } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { AccountForm } from "../../../src/components/settings/forms";
import { useCore } from "../../../src/lib/useCore";

export default function ProfileScreen() {
  const { account } = useCore();
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });

  return (
    <SubScreen title="Profile" subtitle="Your account details">
      {profile ? (
        <AccountForm username={profile.username} email={profile.email} account={account} />
      ) : (
        <Text className="text-sm text-text-muted">Loading…</Text>
      )}
    </SubScreen>
  );
}
