"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  nextZoomView,
  parseYMD,
  sameDay,
  shiftYMD,
  toYMD,
  yearBlockStart,
  type CalendarView as View,
} from "@/lib/date";
import { GlassCard } from "./GlassCard";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const POPOVER_W = 300;
const POPOVER_H = 360;

/**
 * Date selector (web port of mobile ui/DateSelector). Prev/next day steppers
 * plus a click-to-open custom glass calendar popover with day → month → year
 * drill-down (click the header to zoom out), so jumping years back is a couple
 * of clicks. Rendered in a portal (fixed position) so it escapes the
 * GlassCard's overflow-hidden clip and flips above the trigger when needed.
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
  const [view, setView] = useState<View>("day");
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);
  const [viewDate, setViewDate] = useState(() => parseYMD(selectedDate));
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseYMD(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);

  const close = () => setOpen(false);

  const openPopover = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const half = POPOVER_W / 2;
    const margin = 8;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, half + margin),
      window.innerWidth - half - margin
    );
    const up = window.innerHeight - rect.bottom < POPOVER_H;
    const top = up ? rect.top - 10 : rect.bottom + 10;
    setViewDate(parseYMD(selectedDate));
    setView("day");
    setPos({ left, top, up });
    setOpen(true);
  };

  const toggleOpen = () => (open ? close() : openPopover());

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !popRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onMove = () => close();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const shift = (days: number) => onDateSelect(shiftYMD(selectedDate, days));

  // Header stepper: month in day-view, year in month-view, 12 years in year-view.
  const step = (dir: number) => {
    setViewDate((v) => {
      if (view === "day") return new Date(v.getFullYear(), v.getMonth() + dir, 1);
      if (view === "month") return new Date(v.getFullYear() + dir, v.getMonth(), 1);
      return new Date(v.getFullYear() + dir * 12, v.getMonth(), 1);
    });
  };

  // Clicking the header zooms out: day -> month -> year.
  const zoomOut = () => setView(nextZoomView);

  const pickDay = (d: Date) => {
    onDateSelect(toYMD(d));
    close();
  };

  const pretty = selected.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const yearStart = yearBlockStart(viewDate.getFullYear());
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  const headerLabel =
    view === "day"
      ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
      : view === "month"
        ? `${viewDate.getFullYear()}`
        : `${yearStart} – ${yearStart + 11}`;

  const body =
    view === "day" ? (
      <>
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
      </>
    ) : view === "month" ? (
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_SHORT.map((mo, i) => {
          const isSel =
            i === selected.getMonth() && viewDate.getFullYear() === selected.getFullYear();
          return (
            <button
              key={mo}
              type="button"
              onClick={() => {
                setViewDate(new Date(viewDate.getFullYear(), i, 1));
                setView("day");
              }}
              className={cn(
                "flex h-11 items-center justify-center rounded-[var(--radius-md)] text-[13px] font-bold transition",
                isSel
                  ? "bg-solar-light text-text-inverse"
                  : "text-text-primary hover:bg-glass-fill-strong"
              )}
            >
              {mo}
            </button>
          );
        })}
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-2">
        {years.map((yr) => {
          const isSel = yr === selected.getFullYear();
          return (
            <button
              key={yr}
              type="button"
              onClick={() => {
                setViewDate(new Date(yr, viewDate.getMonth(), 1));
                setView("month");
              }}
              className={cn(
                "flex h-11 items-center justify-center rounded-[var(--radius-md)] text-[13px] font-bold transition",
                isSel
                  ? "bg-solar-light text-text-inverse"
                  : "text-text-primary hover:bg-glass-fill-strong"
              )}
            >
              {yr}
            </button>
          );
        })}
      </div>
    );

  const popover =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="Choose date"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform: pos.up ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
            className="z-[100] w-[300px] rounded-[var(--radius-lg)] border border-glass-border-strong bg-[rgba(10,17,36,0.98)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={zoomOut}
                title="Switch to month / year view"
                className="flex flex-1 items-center justify-center gap-1 rounded-[var(--radius-sm)] py-1 text-sm font-extrabold text-text-primary transition hover:bg-glass-fill"
              >
                {headerLabel}
                {view !== "year" ? (
                  <ChevronDown size={13} className="text-text-muted" />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {body}
          </div>,
          document.body
        )
      : null;

  return (
    <GlassCard strong className="flex w-fit items-center p-1.5">
      <div ref={rootRef} className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => shift(-1)}
          aria-label="Previous day"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-fill px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <CalendarDays size={14} className="text-text-secondary" />
          {pretty}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => shift(1)}
          aria-label="Next day"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      {popover}
    </GlassCard>
  );
}

export default DateSelector;
