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

function Module({
  label,
  value,
  unit,
  loading,
}: {
  label: string;
  value: string;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 truncate text-[27px] font-extrabold leading-tight tracking-[-0.5px] text-text-primary">
          {value}
          {unit ? (
            <span className="ml-1 text-[12px] font-bold text-text-muted">{unit}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}

/**
 * Info tile with two data modules side by side, split by a clear divider — e.g.
 * "Today | This week" or "Now | Weekly avg". Fills its grid cell height so rows
 * line up.
 */
export function DualStat({
  icon: Icon,
  gradient,
  label,
  aLabel,
  aValue,
  aUnit,
  bLabel,
  bValue,
  bUnit,
  loading,
}: {
  icon: LucideIcon;
  gradient: StatGradient;
  label: string;
  aLabel: string;
  aValue: string;
  aUnit?: string;
  bLabel: string;
  bValue: string;
  bUnit?: string;
  loading?: boolean;
}) {
  return (
    <GlassCard strong className="flex h-full min-w-0 flex-1 flex-col justify-center gap-3.5 p-4">
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
        <Module label={aLabel} value={aValue} unit={aUnit} loading={loading} />
        <div className="mx-3.5 w-px self-stretch bg-glass-border" />
        <Module label={bLabel} value={bValue} unit={bUnit} loading={loading} />
      </div>
    </GlassCard>
  );
}

export default DualStat;
