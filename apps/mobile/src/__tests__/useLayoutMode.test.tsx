import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useLayoutMode } from "../lib/useLayoutMode";

// react-native's index re-requires this module through a getter on every
// access, so mock the underlying module rather than the RN namespace.
const mockDimensions = jest.fn();
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDimensions() as unknown,
}));

/** Render the hook and capture its result (no RTL-RN; uses the installed renderer). */
function renderHook(width: number, height: number) {
  mockDimensions.mockReturnValue({ width, height, scale: 2, fontScale: 1 });
  let result!: ReturnType<typeof useLayoutMode>;
  function Probe() {
    result = useLayoutMode();
    return null;
  }
  act(() => {
    TestRenderer.create(<Probe />);
  });
  return result;
}

describe("useLayoutMode", () => {
  it("phone portrait: bottom tabs, single column", () => {
    const mode = renderHook(393, 852);
    expect(mode.showRail).toBe(false);
    expect(mode.columns).toBe(1);
    expect(mode.splitSettings).toBe(false);
  });

  it("phone landscape: rail + two columns, no split settings", () => {
    const mode = renderHook(852, 393);
    expect(mode.isPhoneLandscape).toBe(true);
    expect(mode.showRail).toBe(true);
    expect(mode.columns).toBe(2);
    expect(mode.splitSettings).toBe(false);
  });

  it("tablet landscape: rail + split settings", () => {
    const mode = renderHook(1180, 820);
    expect(mode.isTablet).toBe(true);
    expect(mode.showRail).toBe(true);
    expect(mode.splitSettings).toBe(true);
  });
});
