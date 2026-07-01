import { toYMD } from "@hmi/core";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { DateSelector } from "../components/ui/DateSelector";

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
    );
}

function stepButton(root: TestRenderer.ReactTestInstance, label: string) {
  return root.find(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === "function",
  );
}

describe("DateSelector", () => {
  it("shows the selected date in the pretty local-tz label", () => {
    const root = renderRoot(<DateSelector selectedDate="2020-06-15" onDateSelect={() => {}} />);
    expect(texts(root).some((s) => s.includes("Jun 15, 2020"))).toBe(true);
  });

  it("steps a day back and forward without timezone drift", () => {
    const onSelect = jest.fn();
    const root = renderRoot(<DateSelector selectedDate="2020-06-15" onDateSelect={onSelect} />);
    act(() => {
      stepButton(root, "Next day").props.onPress();
    });
    act(() => {
      stepButton(root, "Previous day").props.onPress();
    });
    expect(onSelect).toHaveBeenNthCalledWith(1, "2020-06-16");
    expect(onSelect).toHaveBeenNthCalledWith(2, "2020-06-14");
  });

  it("disables the next-day step when already on today", () => {
    const root = renderRoot(
      <DateSelector selectedDate={toYMD(new Date())} onDateSelect={() => {}} />,
    );
    expect(stepButton(root, "Next day").props.disabled).toBe(true);
    expect(stepButton(root, "Previous day").props.disabled).toBe(false);
  });
});
