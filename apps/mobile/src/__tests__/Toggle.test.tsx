import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { Toggle } from "../components/settings/list";

function renderRoot(element: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree.root;
}

function pressable(root: TestRenderer.ReactTestInstance) {
  return root.find((n) => typeof n.props.onPress === "function" && "disabled" in n.props);
}

describe("Toggle", () => {
  it("flips the value on press", () => {
    const onChange = jest.fn();
    const root = renderRoot(<Toggle value={false} onChange={onChange} />);
    act(() => {
      pressable(root).props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("is disabled when disabled (static dark-theme row)", () => {
    const root = renderRoot(<Toggle value disabled />);
    expect(pressable(root).props.disabled).toBe(true);
  });

  it("is disabled when no onChange is supplied", () => {
    const root = renderRoot(<Toggle value={false} />);
    expect(pressable(root).props.disabled).toBe(true);
  });
});
