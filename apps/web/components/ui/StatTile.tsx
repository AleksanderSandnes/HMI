import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

export type StatGradient = "energy" | "revenue" | "solar" | "co2";

const GRADIENTS: Record<StatGradient, string> = {
  energy: "linear-gradient(135deg,#5eead4,#2dd4bf,#10b981)",
  revenue: "linear-gradient(135deg,#fde68a,#facc15,#eab308)",
  solar: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
  co2: "linear-gradient(135deg,#86efac,#4ade80,#16a34a)",
};

interface StatTileProps {
  icon: LucideIcon;
  gradient: StatGradient;
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  /** Percentage change vs previous period. */
  delta?: number | null;
  loading?: boolean;
}

/** Metric tile (web port of mobile ui/StatTile.tsx). */
export function StatTile({
  icon: Icon,
  gradient,
  label,
  value,
  unit,
  sublabel,
  delta,
  loading = false,
}: StatTileProps) {
  const hasDelta = delta !== null && delta !== undefined && isFinite(delta);
  const positive = (delta ?? 0) >= 0;

  return (
    <GlassCard strong className="min-w-[150px] flex-1 p-[18px]">
      <div className="mb-3.5 flex items-center justify-between">
        <div
          className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px]"
          style={{ backgroundImage: GRADIENTS[gradient] }}
        >
          <Icon size={17} className="text-[#0a1124]" />
        </div>
        {hasDelta ? (
          <div
            className={`flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 ${
              positive
                ? "bg-[rgba(52,211,153,0.13)] text-positive"
                : "bg-[rgba(251,113,133,0.13)] text-negative"
            }`}
          >
            {positive ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
            <span className="text-xs font-extrabold">
              {Math.abs(delta as number).toFixed(0)}%
            </span>
          </div>
        ) : null}
      </div>

      <p className="text-[12.5px] font-semibold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[26px] font-extrabold tracking-[-0.5px] text-text-primary">
          {loading ? "—" : value}
        </span>
        {unit ? (
          <span className="text-sm font-semibold text-text-secondary">
            {unit}
          </span>
        ) : null}
      </div>
      {sublabel ? (
        <p className="mt-1.5 text-xs text-text-muted">{sublabel}</p>
      ) : null}
    </GlassCard>
  );
}

export default StatTile;
