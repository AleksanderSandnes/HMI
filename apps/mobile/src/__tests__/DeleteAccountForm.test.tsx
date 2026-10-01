import type { AccountApi } from "@hmi/core";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { DeleteAccountForm } from "../components/settings/DeleteAccountForm";
import { I18nProvider } from "../lib/i18n";

const trees: TestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  act(() => {
    for (const tree of trees) tree.unmount();
  });
  trees.length = 0;
});

function render(deleteAccount: jest.Mock) {
  const account = { deleteAccount } as unknown as AccountApi;
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <I18nProvider locale="en">
        <DeleteAccountForm account={account} />
      </I18nProvider>,
    );
  });
  trees.push(tree);
  return tree.root;
}

function texts(root: TestRenderer.ReactTestInstance): unknown[] {
  return root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);
}

function press(root: TestRenderer.ReactTestInstance, label: string) {
  const button = root.findAll(
    (n) => typeof n.props.onPress === "function" && n.props.label === label,
  )[0];
  act(() => {
    button.props.onPress();
  });
}

describe("DeleteAccountForm", () => {
  it("asks for confirmation before deleting and can be cancelled", () => {
    const deleteAccount = jest.fn();
    const root = render(deleteAccount);
    press(root, "Delete account");
    expect(texts(root)).toContain("Delete your account?");
    press(root, "Cancel");
    expect(texts(root)).not.toContain("Delete your account?");
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes after the explicit confirmation", async () => {
    const deleteAccount = jest.fn().mockResolvedValue(undefined);
    const root = render(deleteAccount);
    press(root, "Delete account");
    await act(async () => {
      press(root, "Delete permanently");
    });
    expect(deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("shows a localized error and allows retry when deletion fails", async () => {
    const deleteAccount = jest.fn().mockRejectedValue(null);
    const root = render(deleteAccount);
    press(root, "Delete account");
    await act(async () => {
      press(root, "Delete permanently");
    });
    expect(texts(root)).toContain("Could not delete your account. Please try again.");
    await act(async () => {
      press(root, "Delete permanently");
    });
    expect(deleteAccount).toHaveBeenCalledTimes(2);
  });
});
