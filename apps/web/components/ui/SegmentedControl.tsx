"use client";

import type { TranslationKey } from "@hmi/core";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

const DEFAULT_OPTION_KEYS: { labelKey: TranslationKey; value: string }[] = [
  { labelKey: "timespan.hourly", value: "hourly" },
  { labelKey: "timespan.weekly", value: "weekly" },
  { labelKey: "timespan.monthly", value: "monthly" },
  { labelKey: "timespan.yearly", value: "yearly" },
  { labelKey: "timespan.fiveYear", value: "total" },
];

/** iOS-style segmented control with a solar-gradient pill (web port). */
export function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: Option[];
}) {
  const { t } = useI18n();
  const resolved =
    options ??
    DEFAULT_OPTION_KEYS.map(({ labelKey, value: v }) => ({ label: t(labelKey), value: v }));
  return (
    <div className="flex gap-1 rounded-[var(--radius-pill)] border border-glass-border bg-[var(--color-segment-track)] p-1">
      {resolved.map((opt) => {
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
              "flex-1 rounded-[var(--radius-pill)] py-2.5 text-center text-[0.8125rem] transition",
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
