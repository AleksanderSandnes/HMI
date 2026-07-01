import { scaleLinear, type ScaleLinear } from "d3-scale";

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DomainPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Pixel edges of the plot rectangle (mirrors the old Victory ChartBounds). */
export interface ChartBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ChartGeometry {
  bounds: ChartBounds;
  width: number;
  height: number;
  count: number;
  yDomain: [number, number];
  /** Pixel x for a data index (used by line/area series and the crosshair). */
  x: (i: number) => number;
  /** Pixel y for a data value. */
  y: (v: number) => number;
  /** Nearest data index for a pixel x (crosshair hit-testing). */
  invertX: (px: number) => number;
}

export interface GeometryInput {
  width: number;
  height: number;
  margins: Margins;
  count: number;
  yDomain: [number, number];
  domainPadding?: DomainPadding;
}

/**
 * Map a chart's data domain to pixels given its size, axis margins and inner
 * domain padding — the SVG equivalent of the old Victory CartesianChart layout.
 * The x scale runs over data indices [0, count-1]; the y scale is inverted so
 * larger values sit higher on screen.
 */
export function buildGeometry({
  width,
  height,
  margins,
  count,
  yDomain,
  domainPadding = {},
}: GeometryInput): ChartGeometry {
  const bounds: ChartBounds = {
    left: margins.left,
    right: width - margins.right,
    top: margins.top,
    bottom: height - margins.bottom,
  };
  const padL = domainPadding.left ?? 0;
  const padR = domainPadding.right ?? 0;
  const padTop = domainPadding.top ?? 0;
  const padBottom = domainPadding.bottom ?? 0;

  const xScale: ScaleLinear<number, number> = scaleLinear()
    .domain([0, Math.max(1, count - 1)])
    .range([bounds.left + padL, bounds.right - padR]);
  const yScale: ScaleLinear<number, number> = scaleLinear()
    .domain(yDomain)
    .range([bounds.bottom - padBottom, bounds.top + padTop]);

  return {
    bounds,
    width,
    height,
    count,
    yDomain,
    x: (i) => xScale(i),
    y: (v) => yScale(v),
    invertX: (px) => xScale.invert(px),
  };
}

/** Evenly spaced data indices for the x axis, deduped and clamped to range. */
export function xTickIndices(count: number, desired: number): number[] {
  if (count <= 1) return [0];
  const n = Math.max(2, Math.min(desired, count));
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    seen.add(Math.round((i / (n - 1)) * (count - 1)));
  }
  return [...seen].sort((a, b) => a - b);
}

/** `count` y values spread evenly across the domain (matches victory tickCount). */
export function yTickValues([min, max]: [number, number], count: number): number[] {
  const n = Math.max(2, count);
  return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1));
}
