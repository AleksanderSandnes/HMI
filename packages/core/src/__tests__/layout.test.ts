import { describe, expect, it } from "vitest";

import { layoutModeFor } from "../utils/layout";

describe("layoutModeFor", () => {
  const cases = [
    {
      name: "iPhone portrait (393x852): bottom bar, single column",
      w: 393,
      h: 852,
      expected: {
        isLandscape: false,
        isTablet: false,
        isPhoneLandscape: false,
        showRail: false,
        splitSettings: false,
        columns: 1,
      },
    },
    {
      name: "iPhone landscape (852x393): rail + two columns, no split settings",
      w: 852,
      h: 393,
      expected: {
        isLandscape: true,
        isTablet: false,
        isPhoneLandscape: true,
        showRail: true,
        splitSettings: false,
        columns: 2,
      },
    },
    {
      name: "iPad mini portrait (744x1133): tablet rail, but too narrow to split settings",
      w: 744,
      h: 1133,
      expected: {
        isLandscape: false,
        isTablet: true,
        isPhoneLandscape: false,
        showRail: true,
        splitSettings: false,
        columns: 2,
      },
    },
    {
      name: "iPad portrait (810x1080): rail + split settings",
      w: 810,
      h: 1080,
      expected: {
        isLandscape: false,
        isTablet: true,
        isPhoneLandscape: false,
        showRail: true,
        splitSettings: true,
        columns: 2,
      },
    },
    {
      name: "iPad landscape (1180x820): rail + split settings",
      w: 1180,
      h: 820,
      expected: {
        isLandscape: true,
        isTablet: true,
        isPhoneLandscape: false,
        showRail: true,
        splitSettings: true,
        columns: 2,
      },
    },
  ];

  for (const { name, w, h, expected } of cases) {
    it(name, () => {
      expect(layoutModeFor(w, h)).toEqual(expected);
    });
  }
});
