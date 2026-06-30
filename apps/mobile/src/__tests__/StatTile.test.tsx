import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { StatTile } from "../components/ui/StatTile";
import type { IconRender } from "../components/ui/types";

// Minimal icon render-prop — StatTile invokes it with { color, size }.
const icon: IconRender = () => null;

function renderRoot(element: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree.root;
}

/** The concatenated string content of each host <Text> node (e.g. "50%"). */
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

describe("StatTile", () => {
  it("renders label, value, unit and a positive delta", () => {
    const root = renderRoot(
      <StatTile
        icon={icon}
        gradient="energy"
        label="Generation"
        value="12.3"
        unit="kWh"
        delta={50}
      />,
    );
    const t = texts(root);
    expect(t).toEqual(expect.arrayContaining(["Generation", "12.3", "kWh", "50%"]));
  });

  it("hides the value and renders a skeleton while loading", () => {
    const root = renderRoot(
      <StatTile icon={icon} gradient="solar" label="Peak" value="9.9" loading />,
    );
    const t = texts(root);
    expect(t).toContain("Peak");
    expect(t).not.toContain("9.9");
  });

  it("omits the delta chip when delta is null", () => {
    const root = renderRoot(
      <StatTile icon={icon} gradient="energy" label="Generation" value="12.3" delta={null} />,
    );
    expect(texts(root).some((s) => s.includes("%"))).toBe(false);
  });
});
