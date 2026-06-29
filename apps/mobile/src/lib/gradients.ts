/**
 * Gradient palettes for expo-linear-gradient fills (RN has no CSS gradients, so
 * the gradient surfaces — icon chips, primary buttons, the active segmented pill,
 * selected calendar day — use these arrays). Values mirror the web GRADIENTS in
 * apps/web/components/ui/StatTile.tsx / Button.tsx verbatim.
 */
export type StatGradient = 'energy' | 'revenue' | 'solar' | 'co2' | 'accent';

export const GRADIENTS: Record<StatGradient, readonly [string, string, string]> =
  {
    energy: ['#5eead4', '#2dd4bf', '#10b981'],
    revenue: ['#fde68a', '#facc15', '#eab308'],
    solar: ['#fde047', '#fbbf24', '#f59e0b'],
    co2: ['#86efac', '#4ade80', '#16a34a'],
    accent: ['#a78bfa', '#818cf8', '#6366f1'],
  } as const;

/** Button gradient choices (primary variant). */
export type ButtonGradient = 'solar' | 'energy' | 'accent' | 'revenue';

export const BUTTON_GRADIENTS: Record<
  ButtonGradient,
  readonly [string, string, string]
> = {
  solar: GRADIENTS.solar,
  energy: GRADIENTS.energy,
  accent: GRADIENTS.accent,
  revenue: GRADIENTS.revenue,
};
