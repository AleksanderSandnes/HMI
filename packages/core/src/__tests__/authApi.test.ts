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

describe("registration and sign-out lifecycle", () => {
  it("accepts registration pending email confirmation without inventing a session", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session: null, user: { id: "fixture", user_metadata: {} } },
      error: null,
    });
    const api = createAuthApi(makeCtx({ signUp }));
    await expect(
      api.registerUser({ email: " fixture@example.test ", password: "fixture" }),
    ).resolves.toEqual({ id: "fixture", email: null, username: "", token: null });
    expect(signUp).toHaveBeenCalledWith({ email: "fixture@example.test", password: "fixture" });
  });

  it("propagates registration errors", async () => {
    const error = new Error("registration unavailable");
    const api = createAuthApi(makeCtx({ signUp: vi.fn().mockResolvedValue({ data: {}, error }) }));
    await expect(
      api.registerUser({ email: "fixture@example.test", password: "fixture" }),
    ).rejects.toBe(error);
  });

  it("waits for sign-out to finish", async () => {
    let resolve: ((value: { error: null }) => void) | undefined;
    const signOut = vi.fn().mockReturnValue(
      new Promise<{ error: null }>((done) => {
        resolve = done;
      }),
    );
    const api = createAuthApi(makeCtx({ signOut }));
    let finished = false;
    const operation = api.logout().then(() => {
      finished = true;
      return finished;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    resolve?.({ error: null });
    await operation;
    expect(finished).toBe(true);
  });

  it("propagates a rejected sign-out result", async () => {
    const error = new Error("sign-out unavailable");
    const api = createAuthApi(makeCtx({ signOut: vi.fn().mockResolvedValue({ error }) }));
    await expect(api.logout()).rejects.toBe(error);
  });
});

describe("email confirmation", () => {
  it("verifies a trimmed email code and returns the authenticated user", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({
      data: {
        session: { access_token: "confirmed" },
        user: { id: "u1", email: "demo@example.test", user_metadata: {} },
      },
      error: null,
    });
    const api = createAuthApi(makeCtx({ verifyOtp }));
    await expect(api.confirmRegistration(" demo@example.test ", " 123456 ")).resolves.toMatchObject(
      { token: "confirmed" },
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "demo@example.test",
      token: "123456",
      type: "email",
    });
  });

  it("rejects a blank code without contacting Auth", async () => {
    const verifyOtp = vi.fn();
    await expect(
      createAuthApi(makeCtx({ verifyOtp })).confirmRegistration("demo@example.test", " "),
    ).rejects.toThrow(CoreError);
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it.each([
    { session: null, user: null },
    { session: null, user: { id: "u1" } },
  ])("requires a session and user before advancing: %j", async (data) => {
    const api = createAuthApi(
      makeCtx({ verifyOtp: vi.fn().mockResolvedValue({ data, error: null }) }),
    );
    await expect(api.confirmRegistration("demo@example.test", "123456")).rejects.toThrow(CoreError);
  });

  it("propagates expired or invalid code errors", async () => {
    const error = new Error("Code expired");
    const api = createAuthApi(
      makeCtx({ verifyOtp: vi.fn().mockResolvedValue({ data: {}, error }) }),
    );
    await expect(api.confirmRegistration("demo@example.test", "123456")).rejects.toBe(error);
  });

  it("resends signup confirmation without creating another user", async () => {
    const resend = vi.fn().mockResolvedValue({ error: null });
    await createAuthApi(makeCtx({ resend })).resendConfirmation(" demo@example.test ");
    expect(resend).toHaveBeenCalledWith({ type: "signup", email: "demo@example.test" });
  });

  it("propagates resend errors including rate limits", async () => {
    const error = new Error("Too many requests");
    const api = createAuthApi(makeCtx({ resend: vi.fn().mockResolvedValue({ error }) }));
    await expect(api.resendConfirmation("demo@example.test")).rejects.toBe(error);
  });
});
