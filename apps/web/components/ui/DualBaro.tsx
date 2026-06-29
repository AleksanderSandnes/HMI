"use client";

import { type LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";
import type { StatGradient } from "./StatTile";

const GRADIENTS: Record<StatGradient, string> = {
  energy: "linear-gradient(135deg,#5eead4,#2dd4bf,#10b981)",
  revenue: "linear-gradient(135deg,#fde68a,#facc15,#eab308)",
  solar: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
  co2: "linear-gradient(135deg,#86efac,#4ade80,#16a34a)",
  accent: "linear-gradient(135deg,#a78bfa,#818cf8,#6366f1)",
};

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
          <line x1="50" y1="53" x2="50" y2="18" stroke="url(#baro-n)" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 12 L45 24 L50 20.5 L55 24 Z" fill="url(#baro-n)" />
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
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </p>
      <div className="relative h-[54px] w-[54px]">
        <Gauge value={v} />
      </div>
      {loading ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <p className="text-[15px] font-extrabold leading-none text-text-primary">
          {v != null ? Math.round(v * 10) / 10 : "—"}
          <span className="ml-0.5 text-[9px] font-bold text-text-muted">{unit}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Pressure tile with two barometer gauges side by side — Now and Week average —
 * split by a divider. Fills its grid cell (same height as the other boxes).
 */
export function DualBaro({
  icon: Icon,
  gradient,
  label,
  now,
  avg,
  unit = "hPa",
  loading,
}: {
  icon: LucideIcon;
  gradient: StatGradient;
  label: string;
  now?: number | null;
  avg?: number | null;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <GlassCard strong className="flex h-full min-w-0 flex-1 flex-col justify-center gap-2.5 p-4">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ backgroundImage: GRADIENTS[gradient] }}
        >
          <Icon size={16} className="text-[#0a1124]" />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-[0.3px] text-text-muted">
          {label}
        </span>
      </div>
      <div className="flex items-stretch">
        <Module label="Now" value={now} unit={unit} loading={loading} />
        <div className="mx-3 w-px self-stretch bg-glass-border" />
        <Module label="Week average" value={avg} unit={unit} loading={loading} />
      </div>
    </GlassCard>
  );
}

export default DualBaro;
