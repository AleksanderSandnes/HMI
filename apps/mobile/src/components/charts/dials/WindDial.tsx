import { windCompass } from "@hmi/core";
import { Canvas, Circle, Group, Path, LinearGradient, vec } from "@shopify/react-native-skia";
import { View, Text } from "react-native";

import { toNum } from "../../../lib/format";
import { GlassCard } from "../../ui/GlassCard";

const SIZE = 100;
const ARROW = "M50 4 L44 18 L50 14.5 L56 18 Z M48.4 14 L51.6 14 L51.6 28 L48.4 28 Z";

/**
 * Circular wind compass (Skia port of web ui/WindDial): a dial whose arrow
 * rotates to the wind direction (points toward where the wind comes FROM), the
 * speed in the centre, and the cardinal + gust below. Cardinal letters and the
 * centre value are RN text overlays (matching web's HTML-over-SVG approach).
 */
export function WindDial({
  degrees,
  speed,
  gust,
  unit = "km/h",
}: {
  degrees?: number | null;
  speed?: number | null;
  gust?: number | null;
  unit?: string;
}) {
  const deg = toNum(degrees);
  const spd = toNum(speed);
  const gst = toNum(gust);
  const dir = deg != null ? windCompass(deg) : null;

  return (
    <GlassCard strong className="h-full min-w-0 flex-1 items-center justify-center gap-2 p-3.5">
      <View style={{ width: SIZE, height: SIZE }}>
        <Canvas style={{ flex: 1 }}>
          <Circle cx={50} cy={50} r={46} color="rgba(255,255,255,0.03)" />
          <Circle
            cx={50}
            cy={50}
            r={46}
            style="stroke"
            strokeWidth={1}
            color="rgba(255,255,255,0.12)"
          />
          {deg != null ? (
            <Group origin={vec(50, 50)} transform={[{ rotate: (deg * Math.PI) / 180 }]}>
              <Path path={ARROW}>
                <LinearGradient
                  start={vec(50, 4)}
                  end={vec(50, 28)}
                  colors={["#fde047", "#f59e0b"]}
                />
              </Path>
            </Group>
          ) : null}
        </Canvas>

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
          <Text className="text-[26px] font-extrabold leading-none text-text-primary">
            {spd != null ? Math.round(spd) : "—"}
          </Text>
          <Text className="text-[10px] font-bold text-text-muted">{unit}</Text>
        </View>
      </View>

      <Text className="text-[12px] font-semibold text-text-secondary">
        {dir ? `from ${dir}` : "Direction n/a"}
        {gst != null ? ` · gust ${Math.round(gst)}` : ""}
      </Text>
    </GlassCard>
  );
}

export default WindDial;
