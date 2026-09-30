import { BREAKPOINTS } from "@hmi/core";
import { act, cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRemScale } from "@/lib/hooks/useRemScale";
import { useViewportWidth } from "@/lib/hooks/useViewportWidth";
import { NavStatsProvider, useNavStats } from "@/lib/nav-stats";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("responsive hooks", () => {
  it("updates viewport width on resize and removes its listener on unmount", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(480);
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(useViewportWidth);
    expect(result.current).toBe(480);
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1024);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current).toBe(1024);
    unmount();
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("uses the stable desktop width during server rendering", () => {
    function Probe() {
      return <span>{useViewportWidth()}</span>;
    }
    expect(renderToString(<Probe />)).toBe(`<span>${BREAKPOINTS.desktop}</span>`);
  });

  it("tracks root font scaling after resize and cleans up its listener", () => {
    const computedStyle = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ fontSize: "20.8px" } as CSSStyleDeclaration);
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(useRemScale);
    expect(result.current).toBeCloseTo(1.3);
    computedStyle.mockReturnValue({ fontSize: "16px" } as CSSStyleDeclaration);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current).toBe(1);
    unmount();
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});

describe("navigation stats context", () => {
  it("publishes and clears page statistics", () => {
    const { result } = renderHook(useNavStats, { wrapper: NavStatsProvider });
    expect(result.current.solarStats).toBeNull();
    const stats = { generation: "4.2", genUnit: "kWh", peak: "5", peakUnit: "kW" };
    act(() => result.current.setSolarStats(stats));
    expect(result.current.solarStats).toEqual(stats);
    act(() => result.current.setSolarStats(null));
    expect(result.current.solarStats).toBeNull();
  });

  it("provides safe empty defaults outside the navigation provider", () => {
    const { result } = renderHook(useNavStats);
    act(() => result.current.setSolarStats(null));
    expect(result.current.solarStats).toBeNull();
  });
});
