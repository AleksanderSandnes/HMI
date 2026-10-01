import { createSessionStorage, type StringStorage } from "../lib/sessionStorage";

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: StringStorage = {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
  return { values, storage };
}

function setup() {
  const secure = memoryStorage();
  const legacy = memoryStorage();
  return { secure, legacy, sessions: createSessionStorage(secure.storage, legacy.storage) };
}

describe("encrypted session storage", () => {
  it("returns null when no session exists", async () => {
    await expect(setup().sessions.getItem("auth")).resolves.toBeNull();
  });

  it("migrates an existing session and removes its plaintext copy", async () => {
    const { sessions, legacy, secure } = setup();
    legacy.values.set("auth", "fictional-session");
    await expect(sessions.getItem("auth")).resolves.toBe("fictional-session");
    expect(legacy.values.has("auth")).toBe(false);
    expect(secure.values.size).toBeGreaterThan(0);
    await expect(sessions.getItem("auth")).resolves.toBe("fictional-session");
  });

  it("round-trips long Unicode sessions within the native item size limit", async () => {
    const { sessions, secure } = setup();
    const value = "👨‍👩‍👧‍👦 æøå 日本語".repeat(800);
    await sessions.setItem("auth", value);
    await expect(sessions.getItem("auth")).resolves.toBe(value);
    for (const stored of secure.values.values()) {
      expect(Buffer.byteLength(stored, "utf8")).toBeLessThan(2048);
    }
  });
});

describe("encrypted session recovery", () => {
  it("preserves the active session if a replacement write fails", async () => {
    const { sessions, secure, legacy } = setup();
    await sessions.setItem("auth", "old-session");
    const original = secure.storage.setItem;
    secure.storage.setItem = async (key, value) => {
      if (key.includes("secure-0-")) throw new Error("device storage failure");
      await original(key, value);
    };
    await expect(sessions.setItem("auth", "replacement".repeat(100))).rejects.toThrow(
      "device storage failure",
    );
    await expect(sessions.getItem("auth")).resolves.toBe("old-session");
    expect(legacy.values.has("auth")).toBe(false);
    await sessions.removeItem("auth");
    expect(secure.values.size).toBe(0);
  });

  it("keeps the legacy session when encrypted migration fails", async () => {
    const { sessions, secure, legacy } = setup();
    legacy.values.set("auth", "old-session");
    secure.storage.setItem = async () => {
      throw new Error("keychain unavailable");
    };
    await expect(sessions.getItem("auth")).rejects.toThrow("keychain unavailable");
    expect(legacy.values.get("auth")).toBe("old-session");
  });

  it("does not resurrect a stale plaintext session when encrypted data is incomplete", async () => {
    const { sessions, secure, legacy } = setup();
    await sessions.setItem("auth", "current-session");
    legacy.values.set("auth", "stale-session");
    secure.values.delete("auth.secure-1-0");
    await expect(sessions.getItem("auth")).rejects.toThrow("incomplete");
  });

  it("rejects corrupted metadata", async () => {
    const { sessions, secure } = setup();
    secure.values.set("auth.secure-manifest", '{"active":0,"counts":[-1,1000000]}');
    await expect(sessions.getItem("auth")).rejects.toThrow("Invalid secure session metadata");
  });
});

describe("encrypted session cleanup", () => {
  it("erases both encrypted banks and the legacy value on logout", async () => {
    const { sessions, secure, legacy } = setup();
    await sessions.setItem("auth", "first".repeat(400));
    await sessions.setItem("auth", "second");
    legacy.values.set("auth", "stale-session");
    await sessions.removeItem("auth");
    expect(secure.values.size).toBe(0);
    expect(legacy.values.size).toBe(0);
    await expect(sessions.getItem("auth")).resolves.toBeNull();
  });

  it("serializes concurrent refresh and logout operations", async () => {
    const { sessions } = setup();
    await Promise.all([
      sessions.setItem("auth", "first-session"),
      sessions.setItem("auth", "second-session"),
      sessions.removeItem("auth"),
    ]);
    await expect(sessions.getItem("auth")).resolves.toBeNull();
  });

  it("rejects oversized sessions without modifying the active one", async () => {
    const { sessions } = setup();
    await sessions.setItem("auth", "old-session");
    await expect(sessions.setItem("auth", "x".repeat(102401))).rejects.toThrow("capacity");
    await expect(sessions.getItem("auth")).resolves.toBe("old-session");
  });
});
