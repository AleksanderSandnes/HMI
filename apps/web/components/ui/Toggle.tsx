"use client";

import { cn } from "@/lib/utils";

/**
 * Pill-style switch (web port of mobile ui/settings/list.tsx Toggle).
 */
export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "flex h-7 w-[2.875rem] justify-center rounded-[var(--radius-pill)] p-[0.1875rem]",
        value ? "bg-solar" : "bg-glass-fill-strong border border-glass-border",
        disabled && "opacity-70",
      )}
    >
      <span
        className={cn(
          "h-[1.375rem] w-[1.375rem] rounded-[var(--radius-pill)] bg-white",
          value && "ml-auto",
        )}
      />
    </button>
  );
}

export default Toggle;
