// Shared Recharts styling tokens for the solar + weather charts. Values
// reference the CSS custom properties in globals.css (light/dark pair) —
// SVG presentation attributes accept var() references directly in the DOM.
// Geometry (tick font, axis width, margins) takes numbers, not rem, so the
// px-based pieces are factories fed by useRemScale().
export function axisTick(scale: number) {
  return {
    fill: "var(--color-text-muted)",
    fontSize: Math.round(12 * scale),
    fontWeight: 600,
  } as const;
}
export const GRID_STROKE = "var(--color-grid-stroke)";
export const CURSOR = { stroke: "var(--color-chart-cursor)", strokeWidth: 1 } as const;
