import { act, cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function fakeMedia(initial: boolean) {
  let listener: (() => void) | undefined;
  const media = {
    matches: initial,
    addEventListener: vi.fn((_type: string, handler: () => void) => {
      listener = handler;
    }),
    removeEventListener: vi.fn(),
  };
  vi.spyOn(window, "matchMedia").mockReturnValue(media as unknown as MediaQueryList);
  return {
    media,
    change(next: boolean) {
      media.matches = next;
      listener?.();
    },
  };
}

describe("useReducedMotion", () => {
  it("follows the reduced-motion preference and unsubscribes on unmount", () => {
    const fake = fakeMedia(false);
    const { result, unmount } = renderHook(useReducedMotion);
    expect(result.current).toBe(false);
    act(() => fake.change(true));
    expect(result.current).toBe(true);
    unmount();
    expect(fake.media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("assumes full motion during server rendering", () => {
    function Probe() {
      return <span>{String(useReducedMotion())}</span>;
    }
    expect(renderToString(<Probe />)).toBe("<span>false</span>");
  });
});
