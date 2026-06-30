"use client";

import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

const DEFAULT_OPTIONS: Option[] = [
  { label: "Hourly", value: "hourly" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "5-Year", value: "total" },
];

/** iOS-style segmented control with a solar-gradient pill (web port). */
export function SegmentedControl({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: Option[];
}) {
  return (
    <div className="flex gap-1 rounded-[var(--radius-pill)] border border-glass-border bg-[rgba(255,255,255,0.04)] p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            style={
              active
                ? {
                    backgroundImage: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
                  }
                : undefined
            }
            className={cn(
              "flex-1 rounded-[var(--radius-pill)] py-2.5 text-center text-[13px] transition",
              active
                ? "font-extrabold text-text-inverse"
                : "font-semibold text-text-muted hover:text-text-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
