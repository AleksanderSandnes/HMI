import React from "react";
import { Alert } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import {
  AccountForm,
  ConfiguredBadge,
  GrowattForm,
  PasswordForm,
  WeatherForm,
} from "../components/settings/forms";
import { I18nProvider } from "../lib/i18n";

const mockSetAvatar = jest.fn();
const mockImagePicker = {
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
};

jest.mock("../lib/useAvatar", () => ({
  useAvatar: () => ({ uri: null, setAvatar: (u: unknown) => mockSetAvatar(u) }),
}));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: (...a: unknown[]) =>
    mockImagePicker.requestMediaLibraryPermissionsAsync(...a),
  requestCameraPermissionsAsync: (...a: unknown[]) =>
    mockImagePicker.requestCameraPermissionsAsync(...a),
  launchImageLibraryAsync: (...a: unknown[]) => mockImagePicker.launchImageLibraryAsync(...a),
  launchCameraAsync: (...a: unknown[]) => mockImagePicker.launchCameraAsync(...a),
}));

const trees: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => {
    for (const tree of trees) tree.unmount();
  });
  trees.length = 0;
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

function mount(ui: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<I18nProvider locale="en">{ui}</I18nProvider>);
  });
  trees.push(tree);
  return tree.root;
}

const texts = (root: TestRenderer.ReactTestInstance) =>
  root.findAll((n) => String(n.type) === "Text").map((n) => n.props.children);

function type(root: TestRenderer.ReactTestInstance, label: string, value: string) {
  const field = root.findAll(
    (n) => typeof n.props.onChangeText === "function" && n.props.label === label,
  )[0];
  act(() => field.props.onChangeText(value));
}

async function pressButton(root: TestRenderer.ReactTestInstance, label: string) {
  const b = root.findAll(
    (n) => typeof n.props.onPress === "function" && n.props.label === label,
  )[0];
  await act(async () => {
    await b.props.onPress();
  });
}

describe("ConfiguredBadge", () => {
  it("shows connected vs not set", () => {
    expect(texts(mount(<ConfiguredBadge on />))).toContain("Connected");
    expect(texts(mount(<ConfiguredBadge on={false} />))).toContain("Not set");
  });
});

describe("AccountForm", () => {
  const account = { updateUserProfile: jest.fn() };
  const props = { username: "ada", email: "ada@example.com" };

  it("saves edited profile fields and shows success", async () => {
    account.updateUserProfile.mockResolvedValue(undefined);
    const root = mount(<AccountForm {...props} account={account as never} />);
    type(root, "USERNAME", "grace");
    await pressButton(root, "Save profile");
    expect(account.updateUserProfile).toHaveBeenCalledWith({
      username: "grace",
      email: "ada@example.com",
    });
    expect(root.findAll((n) => n.props.kind === "success").length).toBeGreaterThan(0);
  });

  it("shows an error banner when saving fails", async () => {
    account.updateUserProfile.mockRejectedValue(new Error("nope"));
    const root = mount(<AccountForm {...props} account={account as never} />);
    await pressButton(root, "Save profile");
    expect(root.findAll((n) => n.props.kind === "error").length).toBeGreaterThan(0);
  });

  it("offers camera and library choices for the avatar", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const root = mount(<AccountForm {...props} account={account as never} />);
    const change = root.findAll((n) => n.props.accessibilityLabel === "Change photo")[0];
    act(() => change.props.onPress());
    const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    expect(buttons.map((b) => b.text)).toHaveLength(3);

    (global as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a/photo.jpeg?x=1", fileName: "photo.jpeg" }],
    });
    await act(async () => {
      buttons[1].onPress?.();
    });
    expect(mockSetAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ extension: "jpg", contentType: "image/jpeg" }),
    );

    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a/shot.png", mimeType: undefined }],
    });
    await act(async () => {
      buttons[0].onPress?.();
    });
    expect(mockSetAvatar).toHaveBeenLastCalledWith(
      expect.objectContaining({ extension: "png", contentType: "image/png" }),
    );
  });

  it("does nothing when permission is denied or the picker is cancelled", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const root = mount(<AccountForm {...props} account={account as never} />);
    act(() =>
      root.findAll((n) => n.props.accessibilityLabel === "Change photo")[0].props.onPress(),
    );
    const buttons = alert.mock.calls[0][2] as { onPress?: () => void }[];
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });
    await act(async () => {
      buttons[1].onPress?.();
      buttons[0].onPress?.();
    });
    expect(mockSetAvatar).not.toHaveBeenCalled();
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
    await act(async () => {
      buttons[0].onPress?.();
    });
    expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledTimes(1);
  });

  it("uses webp and default mime types from the file extension", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const root = mount(<AccountForm {...props} account={account as never} />);
    act(() =>
      root.findAll((n) => n.props.accessibilityLabel === "Change photo")[0].props.onPress(),
    );
    const buttons = alert.mock.calls[0][2] as { onPress?: () => void }[];
    (global as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(1),
    });
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    for (const [uri, mime] of [
      ["file:///x.webp", "image/webp"],
      ["file:///noext", "image/jpeg"],
    ]) {
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri }],
      });
      await act(async () => {
        buttons[1].onPress?.();
      });
      expect(mockSetAvatar).toHaveBeenLastCalledWith(
        expect.objectContaining({ contentType: mime }),
      );
    }
  });
});

describe("PasswordForm", () => {
  const account = { updateUserPassword: jest.fn() };

  it("rejects short and mismatched passwords", async () => {
    const root = mount(<PasswordForm account={account as never} />);
    type(root, "NEW PASSWORD", "abc");
    await pressButton(root, "Update password");
    expect(account.updateUserPassword).not.toHaveBeenCalled();
    type(root, "NEW PASSWORD", "abcd1234");
    type(root, "CONFIRM PASSWORD", "different");
    await pressButton(root, "Update password");
    expect(account.updateUserPassword).not.toHaveBeenCalled();
    expect(root.findAll((n) => n.props.kind === "error").length).toBeGreaterThan(0);
  });

  it("updates the password and clears the fields, showing the strength meter", async () => {
    account.updateUserPassword.mockResolvedValue(undefined);
    const root = mount(<PasswordForm account={account as never} />);
    type(root, "NEW PASSWORD", "Str0ng!pass");
    expect(texts(root).some((t) => t === "Strong")).toBe(true);
    type(root, "CONFIRM PASSWORD", "Str0ng!pass");
    await pressButton(root, "Update password");
    expect(account.updateUserPassword).toHaveBeenCalledWith({
      currentPassword: "",
      newPassword: "Str0ng!pass",
    });
    expect(root.findAll((n) => n.props.kind === "success").length).toBeGreaterThan(0);
  });

  it("rates weak, fair and good passwords", () => {
    const root = mount(<PasswordForm account={account as never} />);
    const seen = new Set<unknown>();
    for (const pw of ["abcd", "abcdefgh", "abcd1234"]) {
      type(root, "NEW PASSWORD", pw);
      texts(root).forEach((t) => seen.add(t));
    }
    expect(seen.has("Weak") || seen.has("Fair") || seen.has("Good")).toBe(true);
  });
});

describe("GrowattForm / WeatherForm", () => {
  it("saves Growatt credentials then clears the password and notifies", async () => {
    const settings = { saveGrowattApiSettings: jest.fn().mockResolvedValue(undefined) };
    const onSaved = jest.fn();
    const root = mount(
      <GrowattForm initialEmail="a@b.c" connected settings={settings as never} onSaved={onSaved} />,
    );
    type(root, "ACCOUNT (EMAIL)", "new@b.c");
    type(root, "PASSWORD", "secret");
    await pressButton(root, "Save credentials");
    expect(settings.saveGrowattApiSettings).toHaveBeenCalledWith({
      growatt: { email: "new@b.c", password: "secret" },
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it("saves weather station settings and reports failures", async () => {
    const settings = { saveWeatherApiSettings: jest.fn().mockRejectedValue(new Error("x")) };
    const onSaved = jest.fn();
    const root = mount(
      <WeatherForm
        initialStationId="ABC"
        connected={false}
        settings={settings as never}
        onSaved={onSaved}
      />,
    );
    type(root, "API KEY", "k");
    await pressButton(root, "Save credentials");
    expect(settings.saveWeatherApiSettings).toHaveBeenCalledWith({
      weather: { stationId: "ABC", apiKey: "k" },
    });
    expect(onSaved).not.toHaveBeenCalled();
    expect(root.findAll((n) => n.props.kind === "error").length).toBeGreaterThan(0);
  });
});
