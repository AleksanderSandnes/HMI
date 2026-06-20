export interface ChartPoint {
  x: number;
  y: number;
}

export function formatNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (v >= 100) return `${Math.round(v)}`;
  return `${Math.round(v)}`;
}

export function smoothPath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function roundedBarPath(
  x: number,
  y: number,
  w: number,
  baseY: number,
  radius: number
): string {
  const h = baseY - y;
  const r = Math.max(0, Math.min(radius, w / 2, h));
  if (h <= 0.5) {
    // Draw a thin rounded cap so zero-ish values still read as a bar.
    return `M ${x} ${baseY} L ${x + w} ${baseY}`;
  }
  return (
    `M ${x} ${baseY}` +
    ` L ${x} ${y + r}` +
    ` Q ${x} ${y} ${x + r} ${y}` +
    ` L ${x + w - r} ${y}` +
    ` Q ${x + w} ${y} ${x + w} ${y + r}` +
    ` L ${x + w} ${baseY} Z`
  );
}
