import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { usePreference } from "../lib/usePreference";

function mountPreference(key: string, initial: boolean) {
  let current!: ReturnType<typeof usePreference>;
  let renderer!: TestRenderer.ReactTestRenderer;
  function Probe() {
    current = usePreference(key, initial);
    return null;
  }
  return {
    async mount() {
      await act(async () => {
        renderer = TestRenderer.create(<Probe />);
      });
    },
    get current() {
      return current;
    },
    unmount() {
      act(() => renderer.unmount());
    },
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
afterEach(() => jest.restoreAllMocks());

describe("local boolean preferences", () => {
  it.each([
    ["1", true],
    ["0", false],
    [null, true],
  ] as const)("restores stored %s as %s or preserves the default", async (stored, expected) => {
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValueOnce(stored);
    const hook = mountPreference("fixture.preference", true);
    await hook.mount();
    expect(hook.current[0]).toBe(expected);
    hook.unmount();
  });

  it("updates the current session and persists both boolean values", async () => {
    const hook = mountPreference("fixture.preference", false);
    await hook.mount();
    await act(async () => {
      hook.current[1](true);
    });
    expect(hook.current[0]).toBe(true);
    await expect(AsyncStorage.getItem("fixture.preference")).resolves.toBe("1");
    await act(async () => {
      hook.current[1](false);
    });
    await expect(AsyncStorage.getItem("fixture.preference")).resolves.toBe("0");
    hook.unmount();
  });

  it("keeps the default and session value when storage reads or writes fail", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("storage unavailable"));
    const hook = mountPreference("fixture.preference", false);
    await hook.mount();
    expect(hook.current[0]).toBe(false);
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("storage full"));
    await act(async () => {
      hook.current[1](true);
    });
    expect(hook.current[0]).toBe(true);
    hook.unmount();
  });

  it("ignores a pending storage read after the hook unmounts", async () => {
    let resolve!: (value: string) => void;
    jest.spyOn(AsyncStorage, "getItem").mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const hook = mountPreference("fixture.preference", false);
    await hook.mount();
    hook.unmount();
    await act(async () => {
      resolve("1");
    });
    expect(hook.current[0]).toBe(false);
  });
});
