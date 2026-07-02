"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { GlassCard } from "./GlassCard";

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
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const POPOVER_W = 300;
const POPOVER_H = 360;

const GRID_BTN =
  "flex h-11 items-center justify-center rounded-[var(--radius-md)] text-[13px] font-bold transition";

function headerLabelFor(view: View, viewDate: Date, yearStart: number): string {
  if (view === "day") return `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  if (view === "month") return `${viewDate.getFullYear()}`;
  return `${yearStart} – ${yearStart + 11}`;
}

function DayGrid({
  monthGrid,
  viewDate,
  selected,
  today,
  onPick,
}: {
  monthGrid: Date[];
  viewDate: Date;
  selected: Date;
  today: Date;
  onPick: (d: Date) => void;
}) {
  return (
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
              onClick={() => onPick(d)}
              aria-label={toYMD(d)}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "flex h-9 items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-bold transition",
                isSelected
                  ? "bg-solar-light text-text-inverse"
                  : inMonth
                    ? "text-text-primary hover:bg-glass-fill-strong"
                    : "text-text-muted/50 hover:bg-glass-fill",
                !isSelected && isToday && "ring-1 ring-solar-light/60",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}

function MonthGrid({
  selectedMonth,
  onSelect,
}: {
  selectedMonth: number | null;
  onSelect: (monthIndex: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MONTHS_SHORT.map((mo, i) => (
        <button
          key={mo}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            GRID_BTN,
            i === selectedMonth
              ? "bg-solar-light text-text-inverse"
              : "text-text-primary hover:bg-glass-fill-strong",
          )}
        >
          {mo}
        </button>
      ))}
    </div>
  );
}

function YearGrid({
  years,
  selectedYear,
  onSelect,
}: {
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {years.map((yr) => (
        <button
          key={yr}
          type="button"
          onClick={() => onSelect(yr)}
          className={cn(
            GRID_BTN,
            yr === selectedYear
              ? "bg-solar-light text-text-inverse"
              : "text-text-primary hover:bg-glass-fill-strong",
          )}
        >
          {yr}
        </button>
      ))}
    </div>
  );
}

interface PopoverPos {
  left: number;
  top: number;
  up: boolean;
}

/** Open/close + fixed-position + outside-click/scroll handling for the popover. */
function useDatePopover(
  selectedDate: string,
  rootRef: React.RefObject<HTMLDivElement | null>,
  popRef: React.RefObject<HTMLDivElement | null>,
) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("day");
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const [viewDate, setViewDate] = useState(() => parseYMD(selectedDate));

  const close = () => setOpen(false);

  const openPopover = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const half = POPOVER_W / 2;
    const margin = 8;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, half + margin),
      window.innerWidth - half - margin,
    );
    const up = window.innerHeight - rect.bottom < POPOVER_H;
    setViewDate(parseYMD(selectedDate));
    setView("day");
    setPos({ left, top: up ? rect.top - 10 : rect.bottom + 10, up });
    setOpen(true);
  };

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
  }, [open, rootRef, popRef]);

  // Header stepper: month in day-view, year in month-view, 12 years in year-view.
  const step = (dir: number) =>
    setViewDate((v) => {
      if (view === "day") return new Date(v.getFullYear(), v.getMonth() + dir, 1);
      if (view === "month") return new Date(v.getFullYear() + dir, v.getMonth(), 1);
      return new Date(v.getFullYear() + dir * 12, v.getMonth(), 1);
    });

  return {
    open,
    view,
    pos,
    viewDate,
    close,
    setView,
    setViewDate,
    step,
    toggleOpen: () => (open ? close() : openPopover()),
    zoomOut: () => setView(nextZoomView),
    pickMonth: (i: number) => {
      setViewDate(new Date(viewDate.getFullYear(), i, 1));
      setView("day");
    },
    pickYear: (yr: number) => {
      setViewDate(new Date(yr, viewDate.getMonth(), 1));
      setView("month");
    },
  };
}

function CalendarPopover({
  pos,
  popRef,
  headerLabel,
  showZoom,
  onStep,
  onZoom,
  children,
}: {
  pos: PopoverPos;
  popRef: React.RefObject<HTMLDivElement | null>;
  headerLabel: string;
  showZoom: boolean;
  onStep: (dir: number) => void;
  onZoom: () => void;
  children: React.ReactNode;
}) {
  return createPortal(
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
      className="z-[100] w-[300px] rounded-[var(--radius-lg)] border border-glass-border-strong bg-[var(--color-panel-bg)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label="Previous"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onZoom}
          title="Switch to month / year view"
          className="flex flex-1 items-center justify-center gap-1 rounded-[var(--radius-sm)] py-1 text-sm font-extrabold text-text-primary transition hover:bg-glass-fill"
        >
          {headerLabel}
          {showZoom ? <ChevronDown size={13} className="text-text-muted" /> : null}
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label="Next"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {children}
    </div>,
    document.body,
  );
}

const STEP_BTN =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong disabled:opacity-50";

function TriggerRow({
  rootRef,
  disabled,
  pretty,
  open,
  onShift,
  onToggle,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  disabled: boolean;
  pretty: string;
  open: boolean;
  onShift: (days: number) => void;
  onToggle: () => void;
}) {
  return (
    <div ref={rootRef} className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onShift(-1)}
        aria-label="Previous day"
        className={STEP_BTN}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
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
        onClick={() => onShift(1)}
        aria-label="Next day"
        className={STEP_BTN}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function CalendarBody({
  view,
  monthGrid,
  viewDate,
  selected,
  today,
  years,
  onPickDay,
  onPickMonth,
  onPickYear,
}: {
  view: View;
  monthGrid: Date[];
  viewDate: Date;
  selected: Date;
  today: Date;
  years: number[];
  onPickDay: (d: Date) => void;
  onPickMonth: (i: number) => void;
  onPickYear: (yr: number) => void;
}) {
  if (view === "day") {
    return (
      <DayGrid
        monthGrid={monthGrid}
        viewDate={viewDate}
        selected={selected}
        today={today}
        onPick={onPickDay}
      />
    );
  }
  if (view === "month") {
    const selMonth = viewDate.getFullYear() === selected.getFullYear() ? selected.getMonth() : null;
    return <MonthGrid selectedMonth={selMonth} onSelect={onPickMonth} />;
  }
  return <YearGrid years={years} selectedYear={selected.getFullYear()} onSelect={onPickYear} />;
}

/**
 * Date selector (web port of mobile ui/DateSelector). Prev/next day steppers plus
 * a click-to-open custom glass calendar popover with day → month → year drill-down.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const pop = useDatePopover(selectedDate, rootRef, popRef);
  const { view, viewDate, open, pos } = pop;

  const selected = useMemo(() => parseYMD(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);
  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const yearStart = yearBlockStart(viewDate.getFullYear());
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  const shift = (days: number) => onDateSelect(shiftYMD(selectedDate, days));
  const pickDay = (d: Date) => {
    onDateSelect(toYMD(d));
    pop.close();
  };

  const pretty = selected.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <GlassCard strong className="flex w-fit items-center p-1.5">
      <TriggerRow
        rootRef={rootRef}
        disabled={disabled}
        pretty={pretty}
        open={open}
        onShift={shift}
        onToggle={pop.toggleOpen}
      />
      {open && pos && typeof document !== "undefined" ? (
        <CalendarPopover
          pos={pos}
          popRef={popRef}
          headerLabel={headerLabelFor(view, viewDate, yearStart)}
          showZoom={view !== "year"}
          onStep={pop.step}
          onZoom={pop.zoomOut}
        >
          <CalendarBody
            view={view}
            monthGrid={monthGrid}
            viewDate={viewDate}
            selected={selected}
            today={today}
            years={years}
            onPickDay={pickDay}
            onPickMonth={pop.pickMonth}
            onPickYear={pop.pickYear}
          />
        </CalendarPopover>
      ) : null}
    </GlassCard>
  );
}

export default DateSelector;
