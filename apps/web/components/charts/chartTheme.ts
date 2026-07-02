// Shared Recharts styling tokens for the solar + weather charts. Values
// reference the CSS custom properties in globals.css (light/dark pair) —
// SVG presentation attributes accept var() references directly in the DOM.
export const AXIS_TICK = {
  fill: "var(--color-text-muted)",
  fontSize: 12,
  fontWeight: 600,
} as const;
export const GRID_STROKE = "var(--color-grid-stroke)";
export const CURSOR = { stroke: "var(--color-chart-cursor)", strokeWidth: 1 } as const;
