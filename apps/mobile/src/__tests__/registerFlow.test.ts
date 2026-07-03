import { createRegisterAccountSchema, getTranslator } from "@hmi/core";

import { runCreateAccount, runFinish, runSaveGrowatt } from "../../app/(auth)/register";

// The register screen imports native-only UI and the supabase client at
// module scope (jest hoists these mocks above the imports); the run*
// functions under test are pure and dependency-injected.
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: () => null,
}));
jest.mock("../lib/supabase", () => ({ supabase: {} }));

const t = getTranslator("en");
const schema = createRegisterAccountSchema(t);

function setterSpies() {
  return {
    setStep: jest.fn(),
    setSaving: jest.fn(),
    setStepError: jest.fn(),
    setAccountError: jest.fn(),
    setAccountErrors: jest.fn(),
  };
}

const account = {
  email: "user@example.com",
  password: "secret",
  confirmPassword: "secret",
};

describe("runCreateAccount", () => {
  it("registers and advances to the solar step", async () => {
    const spies = setterSpies();
    const registerUser = jest.fn().mockResolvedValue({});
    await runCreateAccount({
      auth: { registerUser } as never,
      account,
      schema,
      t,
      ...spies,
    });
    expect(registerUser).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
    expect(spies.setStep).toHaveBeenCalledWith(1);
    expect(spies.setSaving).toHaveBeenLastCalledWith(false);
  });

  it("short-circuits on validation errors without calling the api", async () => {
    const spies = setterSpies();
    const registerUser = jest.fn();
    await runCreateAccount({
      auth: { registerUser } as never,
      account: { ...account, confirmPassword: "different" },
      schema,
      t,
      ...spies,
    });
    expect(registerUser).not.toHaveBeenCalled();
    expect(spies.setAccountErrors).toHaveBeenCalledWith(
      expect.objectContaining({ confirmPassword: expect.any(String) }),
    );
    expect(spies.setStep).not.toHaveBeenCalled();
  });

  it("surfaces api failures as the account error banner", async () => {
    const spies = setterSpies();
    await runCreateAccount({
      auth: { registerUser: jest.fn().mockRejectedValue(new Error("boom")) } as never,
      account,
      schema,
      t,
      ...spies,
    });
    expect(spies.setAccountError).toHaveBeenLastCalledWith(expect.any(String));
    expect(spies.setStep).not.toHaveBeenCalledWith(1);
  });
});

describe("runSaveGrowatt", () => {
  it("skips straight to the weather step when both fields are blank", async () => {
    const spies = setterSpies();
    const save = jest.fn();
    await runSaveGrowatt({
      settings: { saveGrowattApiSettings: save } as never,
      growatt: { email: " ", password: "" },
      t,
      ...spies,
    });
    expect(save).not.toHaveBeenCalled();
    expect(spies.setStep).toHaveBeenCalledWith(2);
  });

  it("requires both fields when only one is filled", async () => {
    const spies = setterSpies();
    await runSaveGrowatt({
      settings: { saveGrowattApiSettings: jest.fn() } as never,
      growatt: { email: "a@b.c", password: "" },
      t,
      ...spies,
    });
    expect(spies.setStepError).toHaveBeenLastCalledWith(t("auth.register.growattBothOrSkip"));
    expect(spies.setStep).not.toHaveBeenCalled();
  });

  it("saves credentials and advances", async () => {
    const spies = setterSpies();
    const save = jest.fn().mockResolvedValue({});
    await runSaveGrowatt({
      settings: { saveGrowattApiSettings: save } as never,
      growatt: { email: " a@b.c ", password: " pw " },
      t,
      ...spies,
    });
    expect(save).toHaveBeenCalledWith({ growatt: { email: "a@b.c", password: "pw" } });
    expect(spies.setStep).toHaveBeenCalledWith(2);
  });
});

describe("runFinish", () => {
  it("finishes immediately when the weather step is skipped", async () => {
    const spies = setterSpies();
    const done = jest.fn();
    await runFinish({
      settings: { saveWeatherApiSettings: jest.fn() } as never,
      weather: { stationId: "", apiKey: "" },
      t,
      done,
      ...spies,
    });
    expect(done).toHaveBeenCalled();
  });

  it("saves the station and finishes when both fields are set", async () => {
    const spies = setterSpies();
    const done = jest.fn();
    const save = jest.fn().mockResolvedValue({});
    await runFinish({
      settings: { saveWeatherApiSettings: save } as never,
      weather: { stationId: "ST1", apiKey: "KEY" },
      t,
      done,
      ...spies,
    });
    expect(save).toHaveBeenCalledWith({ weather: { apiKey: "KEY", stationId: "ST1" } });
    expect(done).toHaveBeenCalled();
  });
});
