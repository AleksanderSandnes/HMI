import { axisTextProps, gridColor, AXIS_FONT_SIZE } from "../components/charts/chartTheme";
import { areaPath, areaRangePath, linePath } from "../components/charts/svg/paths";
import { buildGeometry, xTickIndices, yTickValues } from "../components/charts/svg/scales";
import { makeTabPressHandler, tabIcon, TAB_ICONS } from "../components/navigation/tabBarShared";

describe("buildGeometry", () => {
  const geo = buildGeometry({
    width: 400,
    height: 200,
    margins: { top: 10, right: 20, bottom: 30, left: 40 },
    count: 5,
    yDomain: [0, 100],
  });

  it("derives plot bounds from the margins", () => {
    expect(geo.bounds).toEqual({ left: 40, right: 380, top: 10, bottom: 170 });
  });

  it("maps indices and values to pixels with an inverted y axis", () => {
    expect(geo.x(0)).toBe(40);
    expect(geo.x(4)).toBe(380);
    expect(geo.y(0)).toBe(170);
    expect(geo.y(100)).toBe(10);
    expect(geo.invertX(geo.x(2))).toBeCloseTo(2);
  });

  it("applies inner domain padding and tolerates a single point", () => {
    const padded = buildGeometry({
      width: 400,
      height: 200,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      count: 1,
      yDomain: [0, 10],
      domainPadding: { left: 5, right: 5, top: 2, bottom: 2 },
    });
    expect(padded.x(0)).toBe(5);
    expect(padded.y(0)).toBe(198);
    expect(padded.y(10)).toBe(2);
  });
});

describe("tick helpers", () => {
  it("returns a single tick for empty or single-point series", () => {
    expect(xTickIndices(0, 5)).toEqual([0]);
    expect(xTickIndices(1, 5)).toEqual([0]);
  });

  it("shows every label for small series", () => {
    expect(xTickIndices(7, 3)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("spreads and dedupes ticks for long series", () => {
    expect(xTickIndices(25, 5)).toEqual([0, 6, 12, 18, 24]);
    expect(xTickIndices(9, 1)).toEqual([0, 8]);
    expect(xTickIndices(9, 100)).toHaveLength(9);
  });

  it("spreads y ticks over the domain with a minimum of two", () => {
    expect(yTickValues([0, 100], 5)).toEqual([0, 25, 50, 75, 100]);
    expect(yTickValues([10, 20], 0)).toEqual([10, 20]);
  });
});

describe("path builders", () => {
  const pts = [
    { x: 0, y: 10 },
    { x: 10, y: 4 },
    { x: 20, y: 8 },
  ];

  it("creates smooth line and area paths", () => {
    expect(linePath(pts)).toMatch(/^M0,10/);
    expect(areaPath(pts, 50)).toMatch(/^M0,10/);
    expect(areaPath(pts, 50)).toContain("Z");
  });

  it("returns an empty string for no points", () => {
    expect(linePath([])).toBe("");
    expect(areaPath([], 10)).toBe("");
    expect(areaRangePath([], [])).toBe("");
  });

  it("builds a closed band between two edges", () => {
    const lower = pts.map((p) => ({ x: p.x, y: p.y + 6 }));
    expect(areaRangePath(pts, lower)).toContain("Z");
  });
});

describe("chartTheme", () => {
  it("returns mode-aware grid and axis styling", () => {
    expect(gridColor("dark")).not.toEqual(gridColor("light"));
    const dark = axisTextProps("dark");
    const light = axisTextProps("light", 10);
    expect(dark.fontSize).toBe(AXIS_FONT_SIZE);
    expect(light.fontSize).toBe(10);
    expect(dark.fill).not.toEqual(light.fill);
    expect(dark.fontWeight).toBe("600");
  });
});

describe("tabBarShared", () => {
  it("uses outline glyphs for unfocused tabs and a fallback for unknown routes", () => {
    expect(tabIcon("index", true)).toBe(TAB_ICONS.index);
    expect(tabIcon("index", false)).toBe(`${TAB_ICONS.index}-outline`);
    expect(tabIcon("mystery", true)).toBe("ellipse");
  });

  const route = { key: "k", name: "solar" } as never;

  it("navigates to an unfocused tab on press", () => {
    const navigation = {
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
      navigate: jest.fn(),
    };
    makeTabPressHandler(navigation as never, route, false)();
    expect(navigation.emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "k",
      canPreventDefault: true,
    });
    expect(navigation.navigate).toHaveBeenCalledWith("solar");
  });

  it("does not navigate when focused or prevented", () => {
    const focused = {
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
      navigate: jest.fn(),
    };
    makeTabPressHandler(focused as never, route, true)();
    expect(focused.navigate).not.toHaveBeenCalled();
    const prevented = {
      emit: jest.fn().mockReturnValue({ defaultPrevented: true }),
      navigate: jest.fn(),
    };
    makeTabPressHandler(prevented as never, route, false)();
    expect(prevented.navigate).not.toHaveBeenCalled();
  });
});
