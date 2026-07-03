import { describe, expect, it } from "vitest";

import { computePopoverPos } from "@/lib/popover";

const viewport = { width: 1440, height: 900 };

describe("computePopoverPos", () => {
  it("centers on the trigger when there is room", () => {
    const pos = computePopoverPos({ left: 600, width: 100, top: 100, bottom: 140 }, viewport);
    expect(pos.left).toBe(650);
    expect(pos.up).toBe(false);
    expect(pos.top).toBe(150);
  });

  it("clamps to the left edge on narrow screens", () => {
    const pos = computePopoverPos(
      { left: 0, width: 40, top: 100, bottom: 140 },
      { width: 360, height: 800 },
    );
    expect(pos.left).toBe(158); // popW/2 + 8px margin
  });

  it("clamps to the right edge", () => {
    const pos = computePopoverPos(
      { left: 330, width: 20, top: 100, bottom: 140 },
      { width: 360, height: 800 },
    );
    expect(pos.left).toBe(360 - 150 - 8);
  });

  it("flips above the trigger when the space below is short", () => {
    const pos = computePopoverPos({ left: 600, width: 100, top: 700, bottom: 740 }, viewport);
    expect(pos.up).toBe(true);
    expect(pos.top).toBe(690);
  });

  it("respects custom popover dimensions", () => {
    const pos = computePopoverPos(
      { left: 600, width: 100, top: 100, bottom: 140 },
      viewport,
      400,
      100,
    );
    expect(pos.up).toBe(false);
    const clamped = computePopoverPos(
      { left: 0, width: 10, top: 100, bottom: 140 },
      viewport,
      400,
      100,
    );
    expect(clamped.left).toBe(208);
  });
});
