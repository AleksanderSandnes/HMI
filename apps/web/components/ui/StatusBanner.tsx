import { CheckCircle2, Info, AlertCircle, type LucideIcon } from "lucide-react";

type Kind = "success" | "error" | "info" | "warning";

const CONFIG: Record<Kind, { className: string; icon: LucideIcon }> = {
  success: {
    className: "border-[rgba(52,211,153,0.33)] bg-[rgba(52,211,153,0.12)] text-positive",
    icon: CheckCircle2,
  },
  error: {
    className: "border-[rgba(251,113,133,0.33)] bg-[rgba(251,113,133,0.12)] text-negative",
    icon: AlertCircle,
  },
  warning: {
    className: "border-[rgba(245,158,11,0.33)] bg-solar-soft text-solar-light",
    icon: AlertCircle,
  },
  info: {
    className: "border-[rgba(245,158,11,0.33)] bg-solar-soft text-solar-light",
    icon: Info,
  },
};

/** Inline status banner (web port of mobile settings/cards/StatusBanner.tsx). */
export function StatusBanner({ kind, message }: { kind: Kind; message: string }) {
  const { className, icon: Icon } = CONFIG[kind];
  return (
    <div
      className={`mb-3.5 flex items-center gap-2.5 rounded-[var(--radius-sm)] border px-3.5 py-2.5 ${className}`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="flex-1 text-[13px] font-bold leading-[17px]">{message}</span>
    </div>
  );
}

export default StatusBanner;
