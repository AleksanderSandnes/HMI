import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";

import { cn } from "@/lib/utils";

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

// Size presets collapse the per-property `compact ? a : b` branching into one
// lookup (keeps the component's complexity low).
const SIZES = {
  regular: {
    pad: "p-[18px]",
    headMb: "mb-3.5",
    chip: 42,
    iconSize: 17,
    label: "text-[12.5px]",
    skeleton: "h-7 w-24",
    value: "text-[26px]",
    unit: "text-sm",
    sublabel: "mt-1.5 text-xs",
  },
  compact: {
    pad: "p-3.5",
    headMb: "mb-2.5",
    chip: 30,
    iconSize: 15,
    label: "text-[10.5px]",
    skeleton: "h-6 w-20",
    value: "text-[21px]",
    unit: "text-[11px]",
    sublabel: "mt-1 text-[10.5px]",
  },
} as const;

type TileSize = (typeof SIZES)[keyof typeof SIZES];

function DeltaPill({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1",
        positive
          ? "bg-[rgba(52,211,153,0.13)] text-positive"
          : "bg-[rgba(251,113,133,0.13)] text-negative",
      )}
    >
      {positive ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
      <span className="text-xs font-extrabold">{Math.abs(delta).toFixed(0)}%</span>
    </div>
  );
}

function TileValue({ value, unit, s }: { value: string; unit?: string; s: TileSize }) {
  return (
    <div className="mt-1.5 flex items-baseline gap-1.5">
      <span className={cn("font-extrabold tracking-[-0.5px] text-text-primary", s.value)}>
        {value}
      </span>
      {unit ? (
        <span className={cn("font-semibold text-text-secondary", s.unit)}>{unit}</span>
      ) : null}
    </div>
  );
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
  const s = compact ? SIZES.compact : SIZES.regular;

  return (
    <GlassCard strong className={cn("min-w-0 flex-1", s.pad)}>
      <div className={cn("flex items-center justify-between", s.headMb)}>
        <div
          className="flex items-center justify-center rounded-[12px]"
          style={{ backgroundImage: GRADIENTS[gradient], height: s.chip, width: s.chip }}
        >
          <Icon size={s.iconSize} className="text-[#0a1124]" />
        </div>
        {delta != null && isFinite(delta) ? <DeltaPill delta={delta} /> : null}
      </div>

      <p className={cn("font-semibold uppercase tracking-[0.3px] text-text-muted", s.label)}>
        {label}
      </p>
      {loading ? (
        <Skeleton className={cn("mt-2", s.skeleton)} />
      ) : (
        <TileValue value={value} unit={unit} s={s} />
      )}
      {sublabel && !loading ? (
        <p className={cn("text-text-muted", s.sublabel)}>{sublabel}</p>
      ) : null}
    </GlassCard>
  );
}

export default StatTile;
