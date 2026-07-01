import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const KEY = "avatar.uri";

/**
 * Device-local profile picture (a picked image URI persisted in AsyncStorage).
 * Backed by a shared React-Query cache so setting it on the Account screen
 * updates the Dashboard/Settings avatars immediately.
 */
export function useAvatar() {
  const qc = useQueryClient();
  const { data } = useQuery<string | null>({
    queryKey: ["avatar"],
    queryFn: async () => (await AsyncStorage.getItem(KEY)) ?? null,
    staleTime: Infinity,
  });

  const setAvatar = useCallback(
    async (uri: string | null) => {
      if (uri) await AsyncStorage.setItem(KEY, uri);
      else await AsyncStorage.removeItem(KEY);
      qc.setQueryData(["avatar"], uri);
    },
    [qc],
  );

  return { uri: data ?? null, setAvatar };
}

export default useAvatar;
