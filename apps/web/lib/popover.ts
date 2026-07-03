// Pure popover-placement math for the calendar popover (DateSelector). Split
// from the DOM reads so the clamping is unit-testable.

export interface PopoverPos {
  left: number;
  top: number;
  /** True when the popover opens above the trigger (no room below). */
  up: boolean;
}

export interface TriggerRect {
  left: number;
  width: number;
  top: number;
  bottom: number;
}

/**
 * Center the popover on the trigger, clamped to stay on-screen horizontally
 * (8px margins), flipping above the trigger when the space below is short.
 */
export function computePopoverPos(
  rect: TriggerRect,
  viewport: { width: number; height: number },
  popW = 300,
  popH = 360,
): PopoverPos {
  const half = popW / 2;
  const margin = 8;
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, half + margin),
    viewport.width - half - margin,
  );
  const up = viewport.height - rect.bottom < popH;
  return { left, top: up ? rect.top - 10 : rect.bottom + 10, up };
}
