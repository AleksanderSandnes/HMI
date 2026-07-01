import { windCompass } from "@hmi/core";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

import { toNum } from "../../../lib/format";
import { GlassCard } from "../../ui/GlassCard";

const SIZE = 100;
const ARROW = "M50 4 L44 18 L50 14.5 L56 18 Z M48.4 14 L51.6 14 L51.6 28 L48.4 28 Z";

interface WindDialProps {
  degrees?: number | null;
  speed?: number | null;
  gust?: number | null;
  unit?: string;
  /** Diameter in px (default 100). */
  size?: number;
}

/**
 * Wind compass dial + direction caption, without a surface. Embed inside any
 * card (e.g. the dashboard weather summary); `WindDial` wraps it in a GlassCard.
 */
export function WindDialFace({ degrees, speed, gust, unit = "km/h", size = SIZE }: WindDialProps) {
  const deg = toNum(degrees);
  const spd = toNum(speed);
  const gst = toNum(gust);
  const dir = deg != null ? windCompass(deg) : null;
  const bigFont = Math.round(size * 0.29);
  const unitFont = Math.round(size * 0.1);

  return (
    <View className="items-center gap-2">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient
              id="wind-arrow"
              gradientUnits="userSpaceOnUse"
              x1="50"
              y1="4"
              x2="50"
              y2="28"
            >
              <Stop offset="0" stopColor="#fde047" />
              <Stop offset="1" stopColor="#f59e0b" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={46} fill="rgba(255,255,255,0.03)" />
          <Circle
            cx={50}
            cy={50}
            r={46}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
          {deg != null ? (
            <G transform={`rotate(${deg} 50 50)`}>
              <Path d={ARROW} fill="url(#wind-arrow)" />
            </G>
          ) : null}
        </Svg>

        {/* Cardinal letters */}
        <View pointerEvents="none" className="absolute inset-0">
          <Text className="absolute left-0 right-0 top-[6px] text-center text-[9px] font-bold text-solar-light">
            N
          </Text>
          <Text className="absolute bottom-[5px] left-0 right-0 text-center text-[8px] font-bold text-text-muted">
            S
          </Text>
          <Text className="absolute right-[7px] top-1/2 -mt-2 text-[8px] font-bold text-text-muted">
            E
          </Text>
          <Text className="absolute left-[7px] top-1/2 -mt-2 text-[8px] font-bold text-text-muted">
            W
          </Text>
        </View>

        {/* Centre speed */}
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <Text
            style={{ fontSize: bigFont }}
            className="font-extrabold leading-none text-text-primary"
          >
            {spd != null ? Math.round(spd) : "—"}
          </Text>
          <Text style={{ fontSize: unitFont }} className="font-bold text-text-muted">
            {unit}
          </Text>
        </View>
      </View>

      <Text className="text-[12px] font-semibold text-text-secondary">
        {dir ? `from ${dir}` : "Direction n/a"}
        {gst != null ? ` · gust ${Math.round(gst)}` : ""}
      </Text>
    </View>
  );
}

/** Wind compass as a standalone glass tile (dashboard grid / legacy use). */
export function WindDial(props: WindDialProps) {
  return (
    <GlassCard strong className="h-full min-w-0 flex-1 items-center justify-center gap-2 p-3.5">
      <WindDialFace {...props} />
    </GlassCard>
  );
}

export default WindDial;
