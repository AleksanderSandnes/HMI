import { area, curveNatural, line } from "d3-shape";

export interface Pt {
  x: number;
  y: number;
}

const lineGen = line<Pt>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveNatural);

/** Smooth (natural-cubic) line through pre-scaled pixel points. */
export function linePath(points: Pt[]): string {
  return lineGen(points) ?? "";
}

/** Smooth area from the points down to a baseline pixel y. */
export function areaPath(points: Pt[], baseline: number): string {
  const gen = area<Pt>()
    .x((d) => d.x)
    .y0(baseline)
    .y1((d) => d.y)
    .curve(curveNatural);
  return gen(points) ?? "";
}

/**
 * Smooth min–max band: a single closed area whose lower edge follows `lower`
 * and upper edge follows `upper` (both pre-scaled), used for the weather
 * daily-range band.
 */
export function areaRangePath(upper: Pt[], lower: Pt[]): string {
  const gen = area<number>()
    .x((_, i) => upper[i].x)
    .y0((_, i) => lower[i].y)
    .y1((_, i) => upper[i].y)
    .curve(curveNatural);
  return gen(upper.map((_, i) => i)) ?? "";
}
