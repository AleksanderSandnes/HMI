import React from "react";
import { Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { SettingsRow } from "../components/settings/list";

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

describe("SettingsRow", () => {
  it("renders the title and subtitle", () => {
    const root = renderRoot(
      <SettingsRow icon="sunny" gradient="energy" title="Growatt solar" subtitle="Data source" />,
    );
    expect(texts(root)).toEqual(expect.arrayContaining(["Growatt solar", "Data source"]));
  });

  it("fires onPress when the row is a link", () => {
    const onPress = jest.fn();
    const root = renderRoot(
      <SettingsRow
        icon="lock-closed"
        gradient="revenue"
        title="Change password"
        onPress={onPress}
      />,
    );
    act(() => {
      root.find((n) => typeof n.props.onPress === "function").props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a custom right slot instead of the chevron", () => {
    const root = renderRoot(
      <SettingsRow
        icon="cloud"
        gradient="solar"
        title="Weather.com station"
        right={<Text>Connected</Text>}
      />,
    );
    expect(texts(root)).toContain("Connected");
  });
});
