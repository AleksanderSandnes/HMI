// Shared numeric coercion / display helpers for the dashboard widgets (mirrors
// apps/web/lib/format.ts). Sensor payloads arrive loosely-typed (numbers, null,
// NaN), so every tile needs the same null-safe coercion + "—" fallback.

/** Null/NaN-safe numeric coercion. Returns null for nullish or non-numeric input. */
export function toNum(v: number | null | undefined): number | null {
  return v == null || isNaN(Number(v)) ? null : Number(v);
}

/** Round to `dp` decimal places, preserving null for missing values. */
export function round(v: number | null | undefined, dp = 0): number | null {
  const n = toNum(v);
  return n == null ? null : Math.round(n * 10 ** dp) / 10 ** dp;
}

/** Display string for a metric value — rounded, or an em dash when missing. */
export function show(v: number | null | undefined, dp = 0): string {
  const r = round(v, dp);
  return r == null ? '—' : `${r}`;
}

/** Mean of the meaningful values (ignoring null/NaN and exact zeros), or null. */
export function average(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter(
    (v): v is number => v != null && !isNaN(v) && v !== 0,
  );
  return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
}

/** Last strictly-positive value in the series, or 0 when there is none. */
export function lastPositive(vals: number[]): number {
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i] > 0) return vals[i];
  }
  return 0;
}

/** Clamp `n` into the inclusive [lo, hi] range. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
