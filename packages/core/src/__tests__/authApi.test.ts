import { describe, expect, it, vi } from "vitest";

import { createAuthApi } from "../api/auth";
import type { CoreApiContext } from "../api/context";
import { CoreError } from "../api/errors";

function makeCtx(authImpl: Record<string, unknown>): CoreApiContext {
  return { supabase: { auth: authImpl } } as unknown as CoreApiContext;
}

describe("createAuthApi", () => {
  it("maps a login session to the UI auth payload", async () => {
    const api = createAuthApi(
      makeCtx({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: { access_token: "tok-1" },
            user: { id: "u1", email: "a@b.c", user_metadata: { username: "aleks" } },
          },
          error: null,
        }),
      }),
    );
    await expect(api.loginUser({ email: " a@b.c ", password: "pw" })).resolves.toEqual({
      id: "u1",
      email: "a@b.c",
      username: "aleks",
      token: "tok-1",
    });
  });

  it("falls back to the email local-part when no username metadata exists", async () => {
    const api = createAuthApi(
      makeCtx({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: null,
            user: { id: "u2", email: "nora@example.com", user_metadata: {} },
          },
          error: null,
        }),
      }),
    );
    const user = await api.loginUser({ email: "nora@example.com", password: "pw" });
    expect(user.username).toBe("nora");
    expect(user.token).toBeNull();
  });

  it("throws the registrationNoUser CoreError when signUp returns no user", async () => {
    const api = createAuthApi(
      makeCtx({
        signUp: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
      }),
    );
    await expect(api.registerUser({ email: "x@y.z", password: "pw" })).rejects.toThrow(CoreError);
  });

  it("propagates supabase auth errors", async () => {
    const boom = new Error("invalid credentials");
    const api = createAuthApi(
      makeCtx({
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: boom }),
      }),
    );
    await expect(api.loginUser({ email: "a@b.c", password: "bad" })).rejects.toBe(boom);
  });
});
