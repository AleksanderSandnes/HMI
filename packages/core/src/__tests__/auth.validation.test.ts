import { describe, expect, it } from "vitest";

import { loginSchema, registerAccountSchema } from "../validation/auth";

const validLogin = { email: "user@example.com", password: "secret" };

describe("loginSchema", () => {
  it("accepts a valid email + password", async () => {
    await expect(loginSchema.validate(validLogin)).resolves.toEqual(validLogin);
  });

  it("rejects a missing email with a friendly message", async () => {
    await expect(loginSchema.validate({ ...validLogin, email: "" })).rejects.toThrow(
      "Email is required",
    );
  });

  it("rejects a malformed email", async () => {
    expect(await loginSchema.isValid({ ...validLogin, email: "not-an-email" })).toBe(false);
  });

  it("rejects a password shorter than 4 characters", async () => {
    expect(await loginSchema.isValid({ ...validLogin, password: "abc" })).toBe(false);
  });
});

describe("registerAccountSchema", () => {
  const validRegister = {
    email: "user@example.com",
    username: "alice",
    password: "secret",
    confirmPassword: "secret",
  };

  it("accepts a fully valid registration", async () => {
    expect(await registerAccountSchema.isValid(validRegister)).toBe(true);
  });

  it("requires a username", async () => {
    await expect(
      registerAccountSchema.validate({ ...validRegister, username: "" }),
    ).rejects.toThrow("Username is required");
  });

  it("requires confirmPassword to match password", async () => {
    await expect(
      registerAccountSchema.validate({ ...validRegister, confirmPassword: "different" }),
    ).rejects.toThrow("Passwords must match");
  });

  it("requires confirmPassword to be present", async () => {
    const { confirmPassword: _omit, ...withoutConfirm } = validRegister;
    await expect(registerAccountSchema.validate(withoutConfirm)).rejects.toThrow(
      "Please confirm your password",
    );
  });
});
