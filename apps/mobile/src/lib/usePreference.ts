import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/** A boolean preference persisted on-device via AsyncStorage. */
export function usePreference(key: string, initial: boolean) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const v = await AsyncStorage.getItem(key);
        if (alive && v != null) setValue(v === "1");
      } catch {
        // Keep the default when local preference storage is unavailable.
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  const set = useCallback(
    (v: boolean) => {
      setValue(v);
      void AsyncStorage.setItem(key, v ? "1" : "0").catch(() => {
        // The current session still uses the preference even if persistence fails.
      });
    },
    [key],
  );

  return [value, set] as const;
}

export default usePreference;
