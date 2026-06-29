"use client";

import { GlassCard } from "./GlassCard";

// Typical sea-level pressure range (hPa) mapped across a 270° arc.
const P_MIN = 960;
const P_MAX = 1060;

/** Point on a circle, angle measured from the top (0°), clockwise. */
function pointAt(angleDeg: number, r: number, cx = 50, cy = 50) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

const START = -135; // low end (down-left)
const SWEEP = 270; // up to +135 (down-right)

/**
 * Barometer gauge: a 270° dial with a needle pointing to the current pressure,
 * the value in the centre and the weekly average below. Sized like the WindDial
 * so it fills its grid cell without changing the row height.
 */
export function BaroDial({
  value,
  avg,
  unit = "hPa",
}: {
  value?: number | null;
  avg?: number | null;
  unit?: string;
}) {
  const num = (v: number | null | undefined) =>
    v == null || isNaN(Number(v)) ? null : Number(v);
  const p = num(value);
  const a = num(avg);

  const frac =
    p != null ? Math.max(0, Math.min(1, (p - P_MIN) / (P_MAX - P_MIN))) : null;
  const needleAngle = frac != null ? START + frac * SWEEP : null;

  const start = pointAt(START, 42);
  const end = pointAt(START + SWEEP, 42);
  const arcPath = `M ${start.x} ${start.y} A 42 42 0 1 1 ${end.x} ${end.y}`;

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const ang = START + (i / 10) * SWEEP;
    const major = i % 5 === 0;
    const o = pointAt(ang, 42);
    const inr = pointAt(ang, major ? 34 : 37);
    return { x1: o.x, y1: o.y, x2: inr.x, y2: inr.y, major };
  });

  const low = pointAt(START, 28);
  const high = pointAt(START + SWEEP, 28);

  return (
    <GlassCard
      strong
      className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1.5 p-3.5"
    >
      <div className="relative h-[96px] w-[96px]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="baro-needle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.major ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.16)"}
              strokeWidth={t.major ? 1.2 : 0.8}
            />
          ))}
          <text x={low.x} y={low.y + 2} textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#71809a">L</text>
          <text x={high.x} y={high.y + 2} textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#71809a">H</text>
          {needleAngle != null && (
            <g
              transform={`rotate(${needleAngle} 50 50)`}
              style={{ transition: "transform 0.6s cubic-bezier(.2,.8,.2,1)" }}
            >
              <line x1="50" y1="52" x2="50" y2="20" stroke="url(#baro-needle)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M50 15 L46.5 25 L50 22 L53.5 25 Z" fill="url(#baro-needle)" />
              <line x1="50" y1="52" x2="50" y2="60" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
          <circle cx="50" cy="50" r="3" fill="#0a1124" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[19px] font-extrabold leading-none text-text-primary">
          {p != null ? Math.round(p * 10) / 10 : "—"}
          <span className="ml-1 text-[11px] font-bold text-text-muted">{unit}</span>
        </p>
        <p className="mt-1 text-[11px] font-semibold text-text-secondary">
          {a != null ? `wk avg ${Math.round(a * 10) / 10}` : "Pressure"}
        </p>
      </div>
    </GlassCard>
  );
}

export default BaroDial;
