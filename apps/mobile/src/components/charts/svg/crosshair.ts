import { useMemo, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import type { ChartGeometry } from "./scales";

/**
 * Scrub crosshair: a Pan gesture that reports the nearest data index under the
 * finger (and clears it on release). Shared by the solar and weather charts.
 */
export function useCrosshair(geo: ChartGeometry) {
  const [index, setIndex] = useState<number | null>(null);
  const gesture = useMemo(() => {
    const select = (px: number) => {
      const i = Math.round(geo.invertX(px));
      setIndex(Math.max(0, Math.min(geo.count - 1, i)));
    };
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => runOnJS(select)(e.x))
      .onUpdate((e) => runOnJS(select)(e.x))
      .onFinalize(() => runOnJS(setIndex)(null));
  }, [geo]);
  return { index, gesture };
}
