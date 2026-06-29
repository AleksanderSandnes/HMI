"use client";

import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";

// Typical sea-level pressure range (hPa) over a 270° arc.
const P_MIN = 960;
const P_MAX = 1060;
const START = -135;
const SWEEP = 270;

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
  return { x1: o.x, y1: o.y, x2: inr.x, y2: inr.y, major };
});

function Gauge({ value }: { value: number | null }) {
  const frac =
    value != null ? Math.max(0, Math.min(1, (value - P_MIN) / (P_MAX - P_MIN))) : null;
  const ang = frac != null ? START + frac * SWEEP : null;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="baro-n" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d={ARC} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" strokeLinecap="round" />
      {TICKS.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.major ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.16)"}
          strokeWidth={t.major ? 1.4 : 1}
        />
      ))}
      {ang != null && (
        <g
          transform={`rotate(${ang} 50 50)`}
          style={{ transition: "transform 0.6s cubic-bezier(.2,.8,.2,1)" }}
        >
          <line x1="50" y1="53" x2="50" y2="16" stroke="url(#baro-n)" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 10 L45 23 L50 19 L55 23 Z" fill="url(#baro-n)" />
        </g>
      )}
      <circle cx="50" cy="50" r="3.5" fill="#0a1124" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
    </svg>
  );
}

function Module({
  label,
  value,
  unit,
  loading,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  loading?: boolean;
}) {
  const v = value == null || isNaN(Number(value)) ? null : Number(value);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </p>
      <div className="relative h-[92px] w-[92px]">
        <Gauge value={v} />
      </div>
      {loading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        <p className="text-[17px] font-extrabold leading-none text-text-primary">
          {v != null ? Math.round(v * 10) / 10 : "—"}
          <span className="ml-1 text-[10px] font-bold text-text-muted">{unit}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Pressure tile with two barometer gauges side by side — Now and Week average —
 * split by a divider. No header; fills its grid cell so the box height matches
 * the rest of the dashboard.
 */
export function DualBaro({
  now,
  avg,
  unit = "hPa",
  loading,
}: {
  now?: number | null;
  avg?: number | null;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <GlassCard strong className="flex h-full min-w-0 flex-1 items-stretch p-4">
      <Module label="Now" value={now} unit={unit} loading={loading} />
      <div className="mx-3 w-px self-stretch bg-glass-border" />
      <Module label="Week average" value={avg} unit={unit} loading={loading} />
    </GlassCard>
  );
}

export default DualBaro;
