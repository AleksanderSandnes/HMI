import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/** A boolean preference persisted on-device via AsyncStorage. */
export function usePreference(key: string, initial: boolean) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const v = await AsyncStorage.getItem(key);
      if (alive && v != null) setValue(v === "1");
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  const set = useCallback(
    (v: boolean) => {
      setValue(v);
      void AsyncStorage.setItem(key, v ? "1" : "0");
    },
    [key],
  );

  return [value, set] as const;
}

export default usePreference;
