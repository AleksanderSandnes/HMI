import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";

export type StatGradient = "energy" | "revenue" | "solar" | "co2" | "accent";

const GRADIENTS: Record<StatGradient, string> = {
  energy: "linear-gradient(135deg,#5eead4,#2dd4bf,#10b981)",
  revenue: "linear-gradient(135deg,#fde68a,#facc15,#eab308)",
  solar: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
  co2: "linear-gradient(135deg,#86efac,#4ade80,#16a34a)",
  accent: "linear-gradient(135deg,#a78bfa,#818cf8,#6366f1)",
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
  /** Denser tile (smaller chip + value) for at-a-glance grids like the Dashboard. */
  compact?: boolean;
}

/**
 * The app's single metric tile — gradient icon chip + label + value (+ optional
 * delta / sublabel). `compact` shrinks it for dense grids; `loading` renders a
 * skeleton. Used across Dashboard, Solar and Weather for a consistent look.
 */
export function StatTile({
  icon: Icon,
  gradient,
  label,
  value,
  unit,
  sublabel,
  delta,
  loading = false,
  compact = false,
}: StatTileProps) {
  const hasDelta = delta !== null && delta !== undefined && isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  const chip = compact ? 30 : 42;

  return (
    <GlassCard strong className={cn("min-w-0 flex-1", compact ? "p-3.5" : "p-[18px]")}>
      <div className={cn("flex items-center justify-between", compact ? "mb-2.5" : "mb-3.5")}>
        <div
          className="flex items-center justify-center rounded-[12px]"
          style={{ backgroundImage: GRADIENTS[gradient], height: chip, width: chip }}
        >
          <Icon size={compact ? 15 : 17} className="text-[#0a1124]" />
        </div>
        {hasDelta ? (
          <div
            className={cn(
              "flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1",
              positive
                ? "bg-[rgba(52,211,153,0.13)] text-positive"
                : "bg-[rgba(251,113,133,0.13)] text-negative"
            )}
          >
            {positive ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
            <span className="text-xs font-extrabold">
              {Math.abs(delta as number).toFixed(0)}%
            </span>
          </div>
        ) : null}
      </div>

      <p
        className={cn(
          "font-semibold uppercase tracking-[0.3px] text-text-muted",
          compact ? "text-[10.5px]" : "text-[12.5px]"
        )}
      >
        {label}
      </p>
      {loading ? (
        <Skeleton className={cn("mt-2", compact ? "h-6 w-20" : "h-7 w-24")} />
      ) : (
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-extrabold tracking-[-0.5px] text-text-primary",
              compact ? "text-[21px]" : "text-[26px]"
            )}
          >
            {value}
          </span>
          {unit ? (
            <span
              className={cn(
                "font-semibold text-text-secondary",
                compact ? "text-[11px]" : "text-sm"
              )}
            >
              {unit}
            </span>
          ) : null}
        </div>
      )}
      {sublabel && !loading ? (
        <p className={cn("text-text-muted", compact ? "mt-1 text-[10.5px]" : "mt-1.5 text-xs")}>
          {sublabel}
        </p>
      ) : null}
    </GlassCard>
  );
}

export default StatTile;
