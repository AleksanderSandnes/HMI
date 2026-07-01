import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { DualStat } from "../components/ui/DualStat";
import type { IconRender } from "../components/ui/types";

const icon: IconRender = () => null;

function renderRoot(element: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree.root;
}

function texts(root: TestRenderer.ReactTestInstance): string[] {
  return root
    .findAll((n) => String(n.type) === "Text")
    .map((n) =>
      React.Children.toArray(n.props.children)
        .filter((c): c is string => typeof c === "string")
        .join(""),
    )
    .filter((s) => s.length > 0);
}

const base = {
  icon,
  gradient: "solar" as const,
  label: "Generation",
  aLabel: "Today",
  aValue: "12.3",
  aUnit: "kWh",
  bLabel: "This week",
  bValue: "68.5",
  bUnit: "kWh",
};

describe("DualStat", () => {
  it("renders both modules with value and unit split into separate Texts", () => {
    const t = texts(renderRoot(<DualStat {...base} />));
    expect(t).toEqual(
      expect.arrayContaining(["Generation", "Today", "12.3", "This week", "68.5", "kWh"]),
    );
    // Value and unit are distinct Text nodes (not "12.3 kWh" concatenated).
    expect(t).not.toContain("12.3 kWh");
  });

  it("hides the values and shows skeletons while loading", () => {
    const t = texts(renderRoot(<DualStat {...base} loading />));
    expect(t).toContain("Generation");
    expect(t).not.toContain("12.3");
    expect(t).not.toContain("68.5");
  });
});
