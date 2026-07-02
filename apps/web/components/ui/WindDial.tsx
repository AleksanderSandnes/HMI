"use client";

import { windCompass } from "@hmi/core";

import { GlassCard } from "./GlassCard";

import { toNum } from "@/lib/format";

/** Cardinal rim labels; N is solar-tinted, the rest muted. */
const CARDINALS = [
  { label: "N", x: 50, y: 14.5, size: 8.5, fill: "var(--color-solar-light)" },
  { label: "E", x: 88, y: 53, size: 7.5, fill: "var(--color-text-muted)" },
  { label: "S", x: 50, y: 91, size: 7.5, fill: "var(--color-text-muted)" },
  { label: "W", x: 12, y: 53, size: 7.5, fill: "var(--color-text-muted)" },
];

/**
 * Circular wind compass as a single centered object: a dial with an arrow that
 * rotates to the wind direction (points toward where the wind comes FROM), the
 * speed in the centre, and the cardinal + gust below.
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
    <GlassCard
      strong
      className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-2 p-3.5"
    >
      <div className="relative h-[96px] w-[96px]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="wind-arrow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="var(--color-dial-fill)"
            stroke="var(--color-dial-ring)"
            strokeWidth="1"
          />
          {CARDINALS.map((c) => (
            <text
              key={c.label}
              x={c.x}
              y={c.y}
              textAnchor="middle"
              fontSize={c.size}
              fontWeight="700"
              fill={c.fill}
            >
              {c.label}
            </text>
          ))}
          {/* Arrow on the rim only, so the centre stays clear for the speed. */}
          {deg != null && (
            <g
              transform={`rotate(${deg} 50 50)`}
              style={{ transition: "transform 0.6s cubic-bezier(.2,.8,.2,1)" }}
            >
              <path d="M50 4 L44 18 L50 14.5 L56 18 Z" fill="url(#wind-arrow)" />
              <rect x="48.4" y="14" width="3.2" height="14" rx="1.6" fill="url(#wind-arrow)" />
            </g>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-extrabold leading-none text-text-primary">
            {spd != null ? Math.round(spd) : "—"}
          </span>
          <span className="text-[10px] font-bold text-text-muted">{unit}</span>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-text-secondary">
        {dir ? `from ${dir}` : "Direction n/a"}
        {gst != null ? ` · gust ${Math.round(gst)}` : ""}
      </p>
    </GlassCard>
  );
}

export default WindDial;
