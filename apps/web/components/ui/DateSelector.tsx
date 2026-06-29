"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse a `yyyy-mm-dd` string into a local Date (no UTC/TZ shift). */
function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a local Date back to `yyyy-mm-dd` (no UTC/TZ shift). */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Date selector (web port of mobile ui/DateSelector). Prev/next day steppers
 * plus a click-to-open custom glass calendar popover (replaces the browser's
 * native date picker, which clashed with the glass design system).
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
  const [open, setOpen] = useState(false);
  // Which month the grid is showing; seeded from the selected date.
  const [viewDate, setViewDate] = useState(() => parseYMD(selectedDate));
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseYMD(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);

  // Toggle the popover; when opening, jump the grid to the selected month.
  const toggleOpen = () => {
    if (!open) setViewDate(parseYMD(selectedDate));
    setOpen((o) => !o);
  };

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shift = (days: number) => {
    const d = parseYMD(selectedDate);
    d.setDate(d.getDate() + days);
    onDateSelect(toYMD(d));
  };

  const shiftMonth = (months: number) => {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + months, 1));
  };

  const pickDay = (d: Date) => {
    onDateSelect(toYMD(d));
    setOpen(false);
  };

  const pretty = selected.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Build a 6-row grid starting on the Sunday on/before the 1st of the month.
  const monthGrid = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewDate]);

  return (
    <GlassCard strong className="relative p-[18px]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.5px] text-text-muted">
        Date
      </p>
      <div ref={rootRef} className="relative flex items-center gap-2">
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
          onClick={toggleOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-fill px-3 py-2.5 text-sm font-bold text-text-primary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <CalendarDays size={14} className="text-text-secondary" />
          {pretty}
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

        {open && (
          <div
            role="dialog"
            aria-label="Choose date"
            className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[300px] -translate-x-1/2 rounded-[var(--radius-lg)] border border-glass-border-strong bg-[rgba(10,17,36,0.96)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {/* Month header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-extrabold text-text-primary">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday header */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => (
                <span
                  key={w}
                  className="flex h-7 items-center justify-center text-[11px] font-bold uppercase text-text-muted"
                >
                  {w}
                </span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((d, i) => {
                const inMonth = d.getMonth() === viewDate.getMonth();
                const isSelected = sameDay(d, selected);
                const isToday = sameDay(d, today);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickDay(d)}
                    aria-label={toYMD(d)}
                    aria-current={isSelected ? "date" : undefined}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-bold transition",
                      isSelected
                        ? "bg-solar-light text-text-inverse"
                        : inMonth
                          ? "text-text-primary hover:bg-glass-fill-strong"
                          : "text-text-muted/50 hover:bg-glass-fill",
                      !isSelected && isToday && "ring-1 ring-solar-light/60"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default DateSelector;
