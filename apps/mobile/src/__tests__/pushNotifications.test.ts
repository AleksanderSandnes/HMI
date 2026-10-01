import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import {
  clearStoredPushToken,
  getStoredPushToken,
  storePushToken,
  unregisterPushOnLogout,
} from "../services/pushNotifications";

const originalPlatform = Platform.OS;

beforeEach(async () => {
  Platform.OS = "android";
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

afterEach(() => {
  Platform.OS = originalPlatform;
  jest.restoreAllMocks();
});

describe("device push-token cleanup", () => {
  it("persists the current device token and clears it after backend deregistration", async () => {
    await storePushToken("fixture-device-token");
    await expect(getStoredPushToken()).resolves.toBe("fixture-device-token");
    const unregister = jest.fn(async (token: string) => {
      expect(token).toBe("fixture-device-token");
      await expect(getStoredPushToken()).resolves.toBe(token);
    });
    await unregisterPushOnLogout(unregister);
    expect(unregister).toHaveBeenCalledTimes(1);
    await expect(getStoredPushToken()).resolves.toBeNull();
  });

  it("clears the local token even when the backend deregistration fails", async () => {
    await storePushToken("fixture-device-token");
    const unregister = jest.fn().mockRejectedValue(new Error("offline"));
    await expect(unregisterPushOnLogout(unregister)).resolves.toBeUndefined();
    await expect(getStoredPushToken()).resolves.toBeNull();
  });

  it("does not deregister when no token is stored", async () => {
    const unregister = jest.fn();
    await unregisterPushOnLogout(unregister);
    expect(unregister).not.toHaveBeenCalled();
  });

  it("does not access native token storage from web", async () => {
    Platform.OS = "web";
    const unregister = jest.fn();
    await storePushToken("fixture");
    await expect(getStoredPushToken()).resolves.toBeNull();
    await clearStoredPushToken();
    await unregisterPushOnLogout(unregister);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
  });

  it("treats storage failures as best-effort cleanup failures", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(storePushToken("fixture")).resolves.toBeUndefined();
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(getStoredPushToken()).resolves.toBeNull();
    jest.spyOn(AsyncStorage, "removeItem").mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(clearStoredPushToken()).resolves.toBeUndefined();
  });
});
