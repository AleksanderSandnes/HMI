import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { SegmentedControl } from "../components/ui/SegmentedControl";

const options = [
  { label: "Hourly", value: "hourly" },
  { label: "Weekly", value: "weekly" },
];

/** Render to a react-test-renderer tree (no RTL-RN; uses the installed renderer). */
function renderTree(element: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree.root;
}

describe("SegmentedControl", () => {
  it("renders every option label", () => {
    const root = renderTree(
      <SegmentedControl value="hourly" onChange={() => {}} options={options} />,
    );
    const labels = root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);
    expect(labels).toEqual(expect.arrayContaining(["Hourly", "Weekly"]));
  });

  it("marks the active option's Pressable as selected", () => {
    const root = renderTree(
      <SegmentedControl value="weekly" onChange={() => {}} options={options} />,
    );
    // Host nodes only (typeof type === "string") to avoid double-counting the
    // composite Pressable + its rendered host view.
    const selected = root.findAll(
      (n) => typeof n.type === "string" && n.props.accessibilityState?.selected === true,
    );
    expect(selected).toHaveLength(1);
  });

  it("fires onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    const root = renderTree(
      <SegmentedControl value="hourly" onChange={onChange} options={options} />,
    );
    const weekly = root
      .findAll((n) => n.props.accessibilityRole === "button")
      .find((p) =>
        p.findAll((t) => String(t.type) === "Text").some((t) => t.props.children === "Weekly"),
      );
    act(() => {
      weekly?.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith("weekly");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
