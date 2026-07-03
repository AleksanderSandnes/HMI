import { type LucideIcon } from "lucide-react";

import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";
import type { StatGradient } from "./StatTile";

export const GRADIENTS: Record<StatGradient, string> = {
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
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.3px] text-text-muted lg:text-[0.75rem]">
        {label}
      </p>
      {/* No truncate on the value: when the tile is narrow (e.g. 246 W/m² in
          a 1024px 4-column grid) the unit wraps below the number instead of
          rendering "246…". */}
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 text-[1.6875rem] font-extrabold leading-tight tracking-[-0.5px] text-text-primary xl:text-[2rem]">
          {value}
          {unit ? (
            <span className="ml-1 whitespace-nowrap text-[0.75rem] font-bold text-text-muted xl:text-[0.8125rem]">
              {unit}
            </span>
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
    <GlassCard
      strong
      className="flex h-full min-w-0 flex-1 flex-col justify-center gap-3.5 p-4 lg:gap-5 lg:p-5"
    >
      <div className="flex items-center gap-2 lg:gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[10px] lg:h-10 lg:w-10 lg:rounded-[12px]"
          style={{ backgroundImage: GRADIENTS[gradient] }}
        >
          <Icon size={16} className="size-[1rem] text-[#0a1124] lg:size-[1.25rem]" />
        </div>
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.3px] text-text-muted lg:text-[0.8125rem]">
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
