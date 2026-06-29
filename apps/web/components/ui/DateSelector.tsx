"use client";

import { useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "./GlassCard";

/**
 * Date selector (web port of mobile ui/DateSelector). Prev/next day
 * steppers + a click-to-open native date picker, styled as a glass pill.
 */
export function DateSelector({
  selectedDate,
  onDateSelect,
  disabled = false,
}: {
  selectedDate: string; // yyyy-mm-dd
  onDateSelect: (date: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const shift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    onDateSelect(d.toISOString().split("T")[0]);
  };

  const pretty = new Date(selectedDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <GlassCard strong className="p-[18px]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.5px] text-text-muted">
        Date
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => shift(-1)}
          aria-label="Previous day"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.showPicker?.()}
          className="relative flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-fill px-3 py-2.5 text-sm font-bold text-text-primary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <CalendarDays size={14} className="text-text-secondary" />
          {pretty}
          <input
            ref={inputRef}
            type="date"
            value={selectedDate}
            disabled={disabled}
            onChange={(e) => e.target.value && onDateSelect(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => shift(1)}
          aria-label="Next day"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </GlassCard>
  );
}

export default DateSelector;
