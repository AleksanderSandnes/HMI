import { afterEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_DELETION_CONFIRMATION, createAccountApi } from "../api/account";
import type { CoreApiContext } from "../api/context";
import { CoreError } from "../api/errors";

const row = {
  id: "profile-fixture",
  username: "Demo",
  email: "demo@example.test",
  avatar_url: null,
  created_at: "2026-09-29",
  updated_at: "2026-09-30",
};
const profile = {
  id: row.id,
  username: row.username,
  email: row.email,
  avatarUrl: null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
};

function fixture(uid: string | null = "auth-fixture") {
  const single = vi.fn().mockResolvedValue({ data: row, error: null });
  const query = { select: vi.fn(), eq: vi.fn(), update: vi.fn(), single };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.update.mockReturnValue(query);
  const from = vi.fn().mockReturnValue(query);
  const updateUser = vi.fn().mockResolvedValue({ error: null });
  const upload = vi.fn().mockResolvedValue({ error: null });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const getPublicUrl = vi
    .fn()
    .mockReturnValue({ data: { publicUrl: "https://storage.example.test/avatar.jpg" } });
  const storageFrom = vi.fn().mockReturnValue({ upload, remove, getPublicUrl });
  const context = {
    supabase: {
      from,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: uid ? { id: uid } : null } }),
        updateUser,
      },
      storage: { from: storageFrom },
    },
  } as unknown as CoreApiContext;
  return {
    api: createAccountApi(context),
    from,
    query,
    single,
    updateUser,
    upload,
    remove,
    storageFrom,
  };
}

afterEach(() => vi.useRealTimers());

describe("account ownership and profile updates", () => {
  it("maps the authenticated profile using auth_id rather than an app profile ID", async () => {
    const { api, query } = fixture();
    await expect(api.getUserProfile()).resolves.toEqual(profile);
    expect(query.eq).toHaveBeenCalledWith("auth_id", "auth-fixture");
  });

  it("rejects signed-out profile reads, writes, and avatar changes before accessing storage", async () => {
    const { api, from, storageFrom } = fixture(null);
    await expect(api.getUserProfile()).rejects.toThrow(CoreError);
    await expect(
      api.updateUserProfile({ username: "Demo", email: "demo@example.test" }),
    ).rejects.toThrow(CoreError);
    await expect(
      api.uploadAvatar({ data: new Uint8Array([1]), contentType: "image/jpeg", extension: "jpg" }),
    ).rejects.toThrow(CoreError);
    await expect(api.removeAvatar()).rejects.toThrow(CoreError);
    expect(from).not.toHaveBeenCalled();
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it("does not request an auth email change when the address is unchanged or the profile is absent", async () => {
    const { api, updateUser, single } = fixture();
    await expect(api.updateUserProfile({ username: "Renamed", email: row.email })).resolves.toEqual(
      profile,
    );
    single.mockResolvedValueOnce({ data: null });
    await api.updateUserProfile({ username: "Renamed", email: row.email });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("requests changed email through Auth and aborts the profile write on rejection", async () => {
    const { api, updateUser, query } = fixture();
    await api.updateUserProfile({ username: "Renamed", email: "new@example.test" });
    expect(updateUser).toHaveBeenCalledWith({ email: "new@example.test" });
    expect(query.update).toHaveBeenCalledWith({ username: "Renamed", email: "new@example.test" });
    query.update.mockClear();
    updateUser.mockResolvedValueOnce({ error: { message: "change denied" } });
    await expect(
      api.updateUserProfile({ username: "Renamed", email: "new@example.test" }),
    ).rejects.toThrow("change denied");
    expect(query.update).not.toHaveBeenCalled();
  });

  it("surfaces profile read and write errors", async () => {
    const { api, single } = fixture();
    single.mockResolvedValueOnce({ error: { message: "read denied" } });
    await expect(api.getUserProfile()).rejects.toThrow("read denied");
    single
      .mockResolvedValueOnce({ data: row })
      .mockResolvedValueOnce({ error: { message: "write denied" } });
    await expect(api.updateUserProfile({ username: "Demo", email: row.email })).rejects.toThrow(
      "write denied",
    );
  });
});

describe("avatar and password lifecycle", () => {
  it("uploads under the authenticated owner's folder and updates the URL after upload", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { api, upload, query, storageFrom } = fixture();
    const data = new Uint8Array([1, 2]);
    await expect(
      api.uploadAvatar({ data, contentType: "image/jpeg", extension: "jpg" }),
    ).resolves.toEqual(profile);
    expect(storageFrom).toHaveBeenCalledWith("avatars");
    expect(upload).toHaveBeenCalledWith("auth-fixture/avatar.jpg", data, {
      contentType: "image/jpeg",
      upsert: true,
    });
    expect(query.update).toHaveBeenCalledWith({
      avatar_url: "https://storage.example.test/avatar.jpg?v=1000",
    });
    expect(query.eq).toHaveBeenCalledWith("auth_id", "auth-fixture");
  });

  it("does not persist an avatar URL after a failed upload", async () => {
    const { api, upload, query } = fixture();
    upload.mockResolvedValueOnce({ error: { message: "upload denied" } });
    await expect(
      api.uploadAvatar({ data: new Uint8Array([1]), contentType: "image/jpeg", extension: "jpg" }),
    ).rejects.toThrow("upload denied");
    expect(query.update).not.toHaveBeenCalled();
  });

  it("clears the profile URL after best-effort removal of all supported avatar extensions", async () => {
    const { api, remove, query, single } = fixture();
    await expect(api.removeAvatar()).resolves.toEqual(profile);
    expect(remove).toHaveBeenCalledWith([
      "auth-fixture/avatar.png",
      "auth-fixture/avatar.jpg",
      "auth-fixture/avatar.jpeg",
      "auth-fixture/avatar.webp",
    ]);
    expect(query.update).toHaveBeenCalledWith({ avatar_url: null });
    single.mockResolvedValueOnce({ error: { message: "profile denied" } });
    await expect(api.removeAvatar()).rejects.toThrow("profile denied");
  });

  it("updates passwords through Auth and surfaces rejection", async () => {
    const { api, updateUser } = fixture();
    await api.updateUserPassword({ currentPassword: "old-fixture", newPassword: "new-fixture" });
    expect(updateUser).toHaveBeenCalledWith({ password: "new-fixture" });
    updateUser.mockResolvedValueOnce({ error: { message: "password rejected" } });
    await expect(
      api.updateUserPassword({ currentPassword: "old-fixture", newPassword: "new-fixture" }),
    ).rejects.toThrow("password rejected");
  });
});

describe("account deletion", () => {
  function deletionFixture(uid: string | null, invokeError: unknown = null) {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: invokeError });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const context = {
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: uid ? { id: uid } : null } }),
          signOut,
        },
        functions: { invoke },
      },
    } as unknown as CoreApiContext;
    return { api: createAccountApi(context), invoke, signOut };
  }

  it("calls the delete-account function with the explicit confirmation, then signs out locally", async () => {
    const { api, invoke, signOut } = deletionFixture("auth-fixture");
    await api.deleteAccount();
    expect(invoke).toHaveBeenCalledWith("delete-account", {
      body: { confirm: ACCOUNT_DELETION_CONFIRMATION },
    });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("keeps the session and reports a translated error when deletion fails", async () => {
    const { api, signOut } = deletionFixture("auth-fixture", new Error("server"));
    await expect(api.deleteAccount()).rejects.toMatchObject({ key: "error.accountDeletionFailed" });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("refuses to call the function when signed out", async () => {
    const { api, invoke } = deletionFixture(null);
    await expect(api.deleteAccount()).rejects.toBeInstanceOf(CoreError);
    expect(invoke).not.toHaveBeenCalled();
  });
});
