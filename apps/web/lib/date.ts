// Local-time date helpers for the calendar UI. These deliberately work in the
// browser's local timezone (unlike core's UTC `toISO`) so a date picked at any
// hour never drifts to the previous/next calendar day.

export type CalendarView = "day" | "month" | "year";

/** Parse a `yyyy-mm-dd` string into a local Date (no UTC/TZ shift). */
export function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a local Date back to `yyyy-mm-dd` (no UTC/TZ shift). */
export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** True when two dates fall on the same calendar day. */
export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Shift a `yyyy-mm-dd` string by N days (may be negative), returning `yyyy-mm-dd`. */
export function shiftYMD(s: string, days: number): string {
  const d = parseYMD(s);
  d.setDate(d.getDate() + days);
  return toYMD(d);
}

/**
 * 42-cell (6×7) calendar grid for the month of `viewDate`, starting on the
 * Sunday on or before the 1st so the weeks line up under Su–Sa headers.
 */
export function buildMonthGrid(viewDate: Date): Date[] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** First year of the 12-year block containing `year` (e.g. 2026 → 2016). */
export function yearBlockStart(year: number): number {
  return Math.floor(year / 12) * 12;
}

/** Header click zooms out: day → month → year → (wraps back to) day. */
export function nextZoomView(view: CalendarView): CalendarView {
  return view === "day" ? "month" : view === "month" ? "year" : "day";
}
