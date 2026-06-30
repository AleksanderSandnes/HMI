import {
  Canvas,
  Group,
  Path,
  Line as SkiaLine,
  Circle,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { View, Text } from "react-native";

import { clamp, round, toNum } from "../../../lib/format";
import { GlassCard } from "../../ui/GlassCard";

// Typical sea-level pressure range (hPa) over a 270° arc — mirrors web DualBaro.
const P_MIN = 960;
const P_MAX = 1060;
const START = -135;
const SWEEP = 270;
const SIZE = 92;
const SCALE = SIZE / 100;

function pointAt(angleDeg: number, r: number, cx = 50, cy = 50) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

const ARC = (() => {
  const s = pointAt(START, 42);
  const e = pointAt(START + SWEEP, 42);
  return `M ${s.x} ${s.y} A 42 42 0 1 1 ${e.x} ${e.y}`;
})();

const TICKS = Array.from({ length: 11 }, (_, i) => {
  const ang = START + (i / 10) * SWEEP;
  const major = i % 5 === 0;
  const o = pointAt(ang, 42);
  const inr = pointAt(ang, major ? 33 : 37);
  return { p1: vec(o.x, o.y), p2: vec(inr.x, inr.y), major };
});

function Gauge({ value }: { value: number | null }) {
  const frac = value != null ? clamp((value - P_MIN) / (P_MAX - P_MIN), 0, 1) : null;
  const ang = frac != null ? START + frac * SWEEP : null;

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Canvas style={{ flex: 1 }}>
        <Group transform={[{ scale: SCALE }]}>
          <Path
            path={ARC}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            color="rgba(255,255,255,0.12)"
          />
          {TICKS.map((t, i) => (
            <SkiaLine
              key={i}
              p1={t.p1}
              p2={t.p2}
              strokeWidth={t.major ? 1.4 : 1}
              color={t.major ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.16)"}
            />
          ))}
          {ang != null ? (
            <Group origin={vec(50, 50)} transform={[{ rotate: (ang * Math.PI) / 180 }]}>
              <Path path="M50 53 L50 16" style="stroke" strokeWidth={3} strokeCap="round">
                <LinearGradient
                  start={vec(50, 16)}
                  end={vec(50, 53)}
                  colors={["#fde047", "#f59e0b"]}
                />
              </Path>
              <Path path="M50 10 L45 23 L50 19 L55 23 Z">
                <LinearGradient
                  start={vec(50, 10)}
                  end={vec(50, 23)}
                  colors={["#fde047", "#f59e0b"]}
                />
              </Path>
            </Group>
          ) : null}
          <Circle cx={50} cy={50} r={3.5} color="#0a1124" />
          <Circle
            cx={50}
            cy={50}
            r={3.5}
            style="stroke"
            strokeWidth={1}
            color="rgba(255,255,255,0.32)"
          />
        </Group>
      </Canvas>
    </View>
  );
}

function Module({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
}) {
  const v = toNum(value);
  const r = round(v, 1);
  return (
    <View className="min-w-0 flex-1 items-center justify-center gap-1.5">
      <Text className="text-[11px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </Text>
      <Gauge value={v} />
      <Text className="text-[17px] font-extrabold leading-none text-text-primary">
        {r != null ? r : "—"}
        <Text className="text-[10px] font-bold text-text-muted"> {unit}</Text>
      </Text>
    </View>
  );
}

/**
 * Pressure tile with two barometer gauges side by side — Now and Week average —
 * split by a divider (Skia port of web ui/DualBaro).
 */
export function DualBaro({
  now,
  avg,
  unit = "hPa",
}: {
  now?: number | null;
  avg?: number | null;
  unit?: string;
}) {
  return (
    <GlassCard strong className="h-full min-w-0 flex-1 flex-row items-stretch p-4">
      <Module label="Now" value={now} unit={unit} />
      <View className="mx-3 w-px self-stretch bg-glass-border" />
      <Module label="Week average" value={avg} unit={unit} />
    </GlassCard>
  );
}

export default DualBaro;
