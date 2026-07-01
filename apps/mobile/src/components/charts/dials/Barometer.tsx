import { View, Text } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from "react-native-svg";

import { clamp, round, toNum } from "../../../lib/format";
import { hairline, useThemeColors } from "../../../lib/theme";
import { GlassCard } from "../../ui/GlassCard";

// Typical sea-level pressure range (hPa) over a 270° arc — mirrors web DualBaro.
const P_MIN = 960;
const P_MAX = 1060;
const START = -135;
const SWEEP = 270;
const SIZE = 92;

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
  return { o, inr, major };
});

function Needle({ ang }: { ang: number }) {
  return (
    <G transform={`rotate(${ang} 50 50)`}>
      <Path d="M50 53 L50 16" stroke="url(#baro-needle)" strokeWidth={3} strokeLinecap="round" />
      <Path d="M50 10 L45 23 L50 19 L55 23 Z" fill="url(#baro-head)" />
    </G>
  );
}

function Gauge({ value }: { value: number | null }) {
  const { mode } = useThemeColors();
  const frac = value != null ? clamp((value - P_MIN) / (P_MAX - P_MIN), 0, 1) : null;
  const ang = frac != null ? START + frac * SWEEP : null;

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient
            id="baro-needle"
            gradientUnits="userSpaceOnUse"
            x1="50"
            y1="16"
            x2="50"
            y2="53"
          >
            <Stop offset="0" stopColor="#fde047" />
            <Stop offset="1" stopColor="#f59e0b" />
          </LinearGradient>
          <LinearGradient
            id="baro-head"
            gradientUnits="userSpaceOnUse"
            x1="50"
            y1="10"
            x2="50"
            y2="23"
          >
            <Stop offset="0" stopColor="#fde047" />
            <Stop offset="1" stopColor="#f59e0b" />
          </LinearGradient>
        </Defs>
        <Path
          d={ARC}
          fill="none"
          stroke={hairline(mode, 0.12)}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {TICKS.map((t, i) => (
          <Line
            key={i}
            x1={t.o.x}
            y1={t.o.y}
            x2={t.inr.x}
            y2={t.inr.y}
            strokeWidth={t.major ? 1.4 : 1}
            stroke={hairline(mode, t.major ? 0.4 : 0.16)}
          />
        ))}
        {ang != null ? <Needle ang={ang} /> : null}
        <Circle cx={50} cy={50} r={3.5} fill="#0a1124" />
        <Circle cx={50} cy={50} r={3.5} fill="none" stroke={hairline(mode, 0.32)} strokeWidth={1} />
      </Svg>
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
 * split by a divider (react-native-svg port of web ui/DualBaro).
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
