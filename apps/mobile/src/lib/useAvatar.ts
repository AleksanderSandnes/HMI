import type { AvatarUpload, UserProfile } from "@hmi/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useCore } from "./useCore";

/**
 * Supabase-backed profile picture. The avatar URI is the user's `avatarUrl`
 * from their profile (fetched via the shared `["profile"]` React-Query key, so
 * this dedupes with the Settings screen's existing query). Picking a photo
 * uploads it to Supabase and reads it back, syncing across devices/platforms.
 */
export function useAvatar() {
  const { account } = useCore();
  const qc = useQueryClient();
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });

  const setAvatar = useCallback(
    async (upload: AvatarUpload) => {
      const updated = await account.uploadAvatar(upload);
      qc.setQueryData(["profile"], updated);
      await qc.invalidateQueries({ queryKey: ["profile"] });
    },
    [account, qc],
  );

  const removeAvatar = useCallback(async () => {
    const updated = await account.removeAvatar();
    qc.setQueryData(["profile"], updated);
    await qc.invalidateQueries({ queryKey: ["profile"] });
  }, [account, qc]);

  return { uri: profile?.avatarUrl ?? null, setAvatar, removeAvatar };
}

export default useAvatar;
