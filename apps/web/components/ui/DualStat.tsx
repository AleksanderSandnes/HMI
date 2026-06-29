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
      <p className="text-[9px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1.5 h-5 w-12" />
      ) : (
        <p className="mt-0.5 truncate text-[19px] font-extrabold leading-tight tracking-[-0.4px] text-text-primary">
          {value}
          {unit ? (
            <span className="ml-0.5 text-[10px] font-bold text-text-muted">{unit}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}

/**
 * Info tile with two data modules side by side, split by a clear divider — e.g.
 * "Today | This week" or "Now | Weekly avg".
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
    <GlassCard strong className="min-w-0 flex-1 p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[9px]"
          style={{ backgroundImage: GRADIENTS[gradient] }}
        >
          <Icon size={14} className="text-[#0a1124]" />
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-text-muted">
          {label}
        </span>
      </div>
      <div className="flex items-stretch">
        <Module label={aLabel} value={aValue} unit={aUnit} loading={loading} />
        <div className="mx-3 w-px self-stretch bg-glass-border" />
        <Module label={bLabel} value={bValue} unit={bUnit} loading={loading} />
      </div>
    </GlassCard>
  );
}

export default DualStat;
