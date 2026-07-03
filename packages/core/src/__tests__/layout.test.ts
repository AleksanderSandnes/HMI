import { describe, expect, it } from "vitest";

import { layoutModeFor } from "../utils/layout";

const cases = [
  {
    name: "iPhone portrait (393x852): single column",
    w: 393,
    h: 852,
    expected: {
      isLandscape: false,
      isTablet: false,
      isPhoneLandscape: false,
      splitSettings: false,
      columns: 1,
    },
  },
  {
    name: "iPhone landscape (852x393): two columns, no split settings",
    w: 852,
    h: 393,
    expected: {
      isLandscape: true,
      isTablet: false,
      isPhoneLandscape: true,
      splitSettings: false,
      columns: 2,
    },
  },
  {
    name: "small tablet portrait (600x1024): stacks like a phone, no split settings",
    w: 600,
    h: 1024,
    expected: {
      isLandscape: false,
      isTablet: true,
      isPhoneLandscape: false,
      splitSettings: false,
      columns: 1,
    },
  },
  {
    name: "iPad mini portrait (744x1133): stacked, too narrow to split settings",
    w: 744,
    h: 1133,
    expected: {
      isLandscape: false,
      isTablet: true,
      isPhoneLandscape: false,
      splitSettings: false,
      columns: 1,
    },
  },
  {
    name: "iPad portrait (810x1080): stacked sections + split settings",
    w: 810,
    h: 1080,
    expected: {
      isLandscape: false,
      isTablet: true,
      isPhoneLandscape: false,
      splitSettings: true,
      columns: 1,
    },
  },
  {
    name: "iPad landscape (1180x820): two columns + split settings",
    w: 1180,
    h: 820,
    expected: {
      isLandscape: true,
      isTablet: true,
      isPhoneLandscape: false,
      splitSettings: true,
      columns: 2,
    },
  },
];

describe("layoutModeFor", () => {
  for (const { name, w, h, expected } of cases) {
    it(name, () => {
      expect(layoutModeFor(w, h)).toEqual(expected);
    });
  }
});
