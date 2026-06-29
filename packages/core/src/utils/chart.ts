// Pure chart-geometry helpers shared by the web (Recharts) and mobile (Victory
// Native XL) Solar/Weather charts. Kept out of the components so the (non-obvious)
// axis/bar math can be unit-tested once and reused on both platforms.

export interface YDomain {
  min: number;
  max: number;
  /** max - min, guaranteed > 0 (used to pick tick precision). */
  range: number;
}

/**
 * Y-axis domain for the weather chart: pads the top by ~14%, anchors the floor
 * at 0 for all-positive data (otherwise pads the bottom too), and expands a flat
 * line into a visible band so a constant series doesn't collapse onto the axis.
 */
export function weatherYDomain(values: number[]): YDomain {
  if (!values.length) return { min: 0, max: 1, range: 1 };

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  let yMin = rawMin;
  let yMax = rawMax;
  if (yMin === yMax) {
    yMax = yMin + 1;
    yMin = yMin - 1;
  }
  const padTop = (yMax - yMin) * 0.14;
  yMax += padTop;
  yMin = rawMin >= 0 ? 0 : yMin - padTop;
  const range = yMax - yMin || 1;
  return { min: yMin, max: yMax, range };
}

/**
 * Bar-category gap (%) for the solar bar chart, scaled to the bar count so dense
 * views (a month of days) stay readable while sparse views (a 5-year total) keep
 * chunky bars. Stays strictly below 50 — Recharts collapses bars to zero width at
 * exactly barCategoryGap="50%". On mobile (Victory Native XL) divide by 100 to
 * get the equivalent `innerPadding` fraction.
 */
export function barGapPercent(count: number): number {
  return count > 24 ? 34 : count > 12 ? 42 : 46;
}
