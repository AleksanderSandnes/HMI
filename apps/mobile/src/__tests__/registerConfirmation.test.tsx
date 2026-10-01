import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import Register from "../../app/(auth)/register";
import { I18nProvider } from "../lib/i18n";

const mockAuth = {
  registerUser: jest.fn(),
  confirmRegistration: jest.fn(),
  resendConfirmation: jest.fn(),
};
jest.mock("../lib/useCore", () => ({ useCore: () => ({ auth: mockAuth, settings: {} }) }));
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: require("react-native").View,
}));
jest.mock("../components/ui/ScreenBackground", () => ({ ScreenBackground: () => null }));
jest.mock("expo-blur", () => ({ BlurView: require("react-native").View }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));

let tree: TestRenderer.ReactTestRenderer;
beforeEach(() => {
  jest.resetAllMocks();
  mockAuth.registerUser.mockResolvedValue({ token: null });
  mockAuth.confirmRegistration.mockResolvedValue({ token: "confirmed" });
  mockAuth.resendConfirmation.mockResolvedValue(undefined);
});
afterEach(() => {
  act(() => {
    tree?.unmount();
  });
});

function field(label: string) {
  return tree.root.findAll(
    (node) => node.props.label === label && typeof node.props.onChangeText === "function",
  )[0];
}
function button(label: string) {
  return tree.root.findAll(
    (node) => node.props.label === label && typeof node.props.onPress === "function",
  )[0];
}
async function register() {
  act(() => {
    tree = TestRenderer.create(
      <I18nProvider locale="en">
        <Register />
      </I18nProvider>,
    );
  });
  act(() => {
    field("EMAIL ADDRESS").props.onChangeText("demo@example.test");
    field("PASSWORD").props.onChangeText("FictionalPassword123!");
    field("CONFIRM PASSWORD").props.onChangeText("FictionalPassword123!");
  });
  await act(async () => {
    await button("Create account").props.onPress();
  });
}

describe("native registration confirmation", () => {
  it("keeps integration setup unavailable until confirmation succeeds", async () => {
    await register();
    expect(field("Confirmation code")).toBeDefined();
    expect(field("Account email")).toBeUndefined();
    act(() => {
      field("Confirmation code").props.onChangeText("123456");
    });
    await act(async () => {
      await button("Confirm email").props.onPress();
    });
    expect(mockAuth.confirmRegistration).toHaveBeenCalledWith("demo@example.test", "123456");
    expect(field("Confirmation code")).toBeUndefined();
    expect(button("Continue")).toBeDefined();
    // The first full native screen render initializes RN on a cold CI worker.
    // Keep a bounded allowance for that initialization; subsequent tests use 5s.
  }, 15000);

  it("keeps the confirmation step available after verification fails", async () => {
    mockAuth.confirmRegistration.mockRejectedValue(new Error("Code expired"));
    await register();
    await act(async () => {
      await button("Confirm email").props.onPress();
    });
    expect(field("Confirmation code").props.editable).toBe(true);
    expect(
      tree.root.findAll((node) => node.props.message === "Code expired").length,
    ).toBeGreaterThan(0);
    expect(button("Continue")).toBeUndefined();
  });

  it("resends the code without repeating signup", async () => {
    await register();
    act(() => {
      field("Confirmation code").props.onChangeText("123456");
    });
    await act(async () => {
      await button("Send a new code").props.onPress();
    });
    expect(mockAuth.resendConfirmation).toHaveBeenCalledWith("demo@example.test");
    expect(mockAuth.registerUser).toHaveBeenCalledTimes(1);
    expect(field("Confirmation code").props.value).toBe("");
  });
});
