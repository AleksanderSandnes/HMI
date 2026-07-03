import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { SettingsHubList } from "../components/settings/SettingsHubList";
import { I18nProvider } from "../lib/i18n";

jest.mock("../lib/useCore", () => ({
  useCore: () => ({
    account: { getUserProfile: jest.fn().mockResolvedValue(null) },
    settings: {
      getApiSettings: jest.fn().mockResolvedValue(null),
      subscribeSettings: () => () => {},
    },
  }),
}));
jest.mock("../lib/useLogout", () => ({ useLogout: () => jest.fn() }));
jest.mock("../lib/usePreference", () => ({ usePreference: () => [true, jest.fn()] }));
jest.mock("../lib/useAvatar", () => ({ useAvatar: () => ({ uri: null }) }));
jest.mock("@react-navigation/bottom-tabs", () => ({ useBottomTabBarHeight: () => 0 }));

function renderList(props: Partial<React.ComponentProps<typeof SettingsHubList>> = {}) {
  // Fully synchronous render: fetching is disabled (the assertions only cover
  // the static rows and callbacks) and gcTime Infinity leaves no timers
  // behind — both matter for slow CI runners.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, enabled: false } },
  });
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <QueryClientProvider client={client}>
        <I18nProvider locale="en">
          <SettingsHubList onSelect={props.onSelect ?? jest.fn()} {...props} />
        </I18nProvider>
      </QueryClientProvider>,
    );
  });
  return tree.root;
}

function pressRowWithText(root: TestRenderer.ReactTestInstance, text: string) {
  const label = root
    .findAll((n) => String(n.type) === "Text")
    .find((n) => n.props.children === text);
  let node = label?.parent;
  while (node && typeof node.props.onPress !== "function") node = node.parent;
  act(() => {
    node?.props.onPress();
  });
}

describe("SettingsHubList", () => {
  it("renders the hub rows", () => {
    const root = renderList();
    const texts = root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);
    expect(texts).toEqual(
      expect.arrayContaining([
        "Change password",
        "Growatt solar",
        "Weather.com station",
        "Sign out",
      ]),
    );
  });

  it("fires onSelect with the route key for each nav row", () => {
    const onSelect = jest.fn();
    const root = renderList({ onSelect });
    pressRowWithText(root, "Change password");
    expect(onSelect).toHaveBeenLastCalledWith("password");
    pressRowWithText(root, "Growatt solar");
    expect(onSelect).toHaveBeenLastCalledWith("growatt");
  });

  it("highlights the active route's row", () => {
    const root = renderList({ activeRoute: "profile" });
    const tinted = root.findAll(
      (n) => typeof n.props.className === "string" && n.props.className.includes("245,158,11"),
    );
    expect(tinted.length).toBeGreaterThan(0);
  });
});
