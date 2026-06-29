"use client";

import { windCompass } from "@hmi/core";
import { GlassCard } from "./GlassCard";

/**
 * Circular wind compass: a dial with an arrow that rotates to the wind direction
 * (meteorological — the arrow points toward where the wind is coming FROM), plus
 * the wind speed + gust readout. Styled to match the glass design system.
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
  const num = (v: number | null | undefined) =>
    v == null || isNaN(Number(v)) ? null : Number(v);

  const deg = num(degrees);
  const spd = num(speed);
  const gst = num(gust);
  const dir = deg != null ? windCompass(deg) : null;

  return (
    <GlassCard
      strong
      className="flex min-w-0 flex-1 items-center gap-3 p-3.5"
    >
      <div className="relative h-[74px] w-[74px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="wind-arrow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* Dial rings */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          {/* Cardinal markers (N highlighted as the reference) */}
          <text x="50" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fbbf24">N</text>
          <text x="87" y="53.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#71809a">E</text>
          <text x="50" y="92" textAnchor="middle" fontSize="8" fontWeight="700" fill="#71809a">S</text>
          <text x="13" y="53.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#71809a">W</text>

          {/* Needle — points toward the direction the wind comes from. */}
          {deg != null && (
            <g
              transform={`rotate(${deg} 50 50)`}
              style={{ transition: "transform 0.6s cubic-bezier(.2,.8,.2,1)" }}
            >
              <line x1="50" y1="50" x2="50" y2="27" stroke="url(#wind-arrow)" strokeWidth="3" strokeLinecap="round" />
              <path d="M50 17 L44 30 L50 26.5 L56 30 Z" fill="url(#wind-arrow)" />
              <line x1="50" y1="50" x2="50" y2="64" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}
          {/* Hub */}
          <circle cx="50" cy="50" r="3.4" fill="#0a1124" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-text-muted">
          Wind
        </p>
        <p className="mt-0.5 text-[21px] font-extrabold leading-none text-text-primary">
          {spd != null ? Math.round(spd) : "—"}
          <span className="ml-1 text-[11px] font-bold text-text-muted">{unit}</span>
        </p>
        <p className="mt-1 truncate text-[10.5px] font-semibold text-text-secondary">
          {dir ? `from ${dir}` : "Direction n/a"}
          {gst != null ? ` · gust ${Math.round(gst)}` : ""}
        </p>
      </div>
    </GlassCard>
  );
}

export default WindDial;
