import { describe, expect, it, vi } from "vitest";

import type { CoreApiContext } from "../api/context";
import { createCredentialsApi } from "../api/credentials";
import { createSettingsApi } from "../api/settings";

function fixture(row: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const from = vi.fn().mockReturnValue({ select });
  const rpc = vi.fn().mockResolvedValue({ error: null });
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  const removeChannel = vi.fn().mockResolvedValue("ok");
  const context = {
    supabase: { from, rpc, channel: vi.fn().mockReturnValue(channel), removeChannel },
  } as unknown as CoreApiContext;
  return {
    settings: createSettingsApi(context),
    credentials: createCredentialsApi(context),
    rpc,
    select,
    maybeSingle,
    channel,
    removeChannel,
  };
}

describe("integration secret boundary", () => {
  it("returns identity and presence flags without exposing secret values", async () => {
    const { settings, credentials, select } = fixture({
      growatt_email: "fixture@example.test",
      growatt_plant_id: "plant",
      growatt_password_secret_id: "secret-reference",
      weather_station_id: "station",
      weather_api_key_secret_id: "weather-reference",
      growatt_password: "must-not-return",
      weather_api_key: "must-not-return",
    });
    await expect(settings.getApiSettings()).resolves.toEqual({
      growatt: { email: "fixture@example.test", plantId: "plant", hasPassword: true },
      weather: { stationId: "station", hasApiKey: true },
    });
    await expect(credentials.getGrowattCredentials()).resolves.toEqual({
      account: "fixture@example.test",
      password: "",
      plantId: "plant",
    });
    await expect(credentials.hasStoredCredentials()).resolves.toBe(true);
    expect(select.mock.calls.flat().join(",")).not.toMatch(/(?:^|,\s*)growatt_password(?:,|$)/);
  });

  it("handles missing and partial settings as unconfigured", async () => {
    const { settings, credentials, maybeSingle } = fixture();
    await expect(settings.getApiSettings()).resolves.toBeNull();
    await expect(credentials.getGrowattCredentials()).resolves.toEqual({
      account: "",
      password: "",
      plantId: undefined,
    });
    await expect(credentials.hasStoredCredentials()).resolves.toBe(false);
    maybeSingle.mockResolvedValueOnce({ data: {}, error: null });
    await expect(settings.getApiSettings()).resolves.toEqual({
      growatt: { email: "", plantId: "", hasPassword: false },
      weather: { stationId: "", hasApiKey: false },
    });
  });

  it("routes partial updates and credentials through the Vault RPC", async () => {
    const { settings, credentials, rpc } = fixture();
    await settings.saveGrowattApiSettings({
      growatt: { email: "fixture@example.test", password: "fixture-password" },
    });
    expect(rpc).toHaveBeenLastCalledWith("save_user_credentials", {
      p_weather_station_id: null,
      p_weather_api_key: null,
      p_growatt_email: "fixture@example.test",
      p_growatt_password: "fixture-password",
    });
    await settings.saveWeatherApiSettings({
      weather: { stationId: "station", apiKey: "fixture-key" },
    });
    expect(rpc).toHaveBeenLastCalledWith("save_user_credentials", {
      p_weather_station_id: "station",
      p_weather_api_key: "fixture-key",
      p_growatt_email: null,
      p_growatt_password: null,
    });
    await credentials.storeGrowattCredentials({
      account: "fixture@example.test",
      password: "fixture-password",
    });
    expect(rpc).toHaveBeenLastCalledWith("save_user_credentials", {
      p_growatt_email: "fixture@example.test",
      p_growatt_password: "fixture-password",
    });
    await credentials.clearStoredCredentials();
    expect(rpc).toHaveBeenCalledTimes(3);
  });

  it("reports failures when saving or reading settings", async () => {
    const { settings, credentials, rpc, maybeSingle } = fixture();
    rpc.mockResolvedValue({ error: { message: "denied" } });
    await expect(settings.saveApiSettings({})).rejects.toThrow("denied");
    await expect(
      credentials.storeGrowattCredentials({ account: "fixture", password: "fixture" }),
    ).rejects.toThrow("denied");
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await expect(settings.getApiSettings()).rejects.toThrow("offline");
  });
});

describe("integration removal and synchronization", () => {
  it("clears each integration and stops if either operation fails", async () => {
    const { settings, rpc } = fixture();
    await settings.clearApiSettings();
    expect(rpc.mock.calls).toEqual([
      ["clear_user_credentials", { p_kind: "growatt" }],
      ["clear_user_credentials", { p_kind: "weather" }],
    ]);
    await settings.clearWeatherApiSettings();
    rpc.mockClear().mockResolvedValueOnce({ error: { message: "growatt failed" } });
    await expect(settings.clearApiSettings()).rejects.toThrow("growatt failed");
    expect(rpc).toHaveBeenCalledTimes(1);
    rpc
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "weather failed" } });
    await expect(settings.clearApiSettings()).rejects.toThrow("weather failed");
    rpc.mockResolvedValueOnce({ error: { message: "weather failed" } });
    await expect(settings.clearWeatherApiSettings()).rejects.toThrow("weather failed");
  });

  it("receives cross-device changes and removes its subscription on cleanup", () => {
    const { settings, channel, removeChannel } = fixture();
    const onChange = vi.fn();
    const cleanup = settings.subscribeSettings(onChange);
    for (const call of channel.on.mock.calls) call[2]();
    expect(onChange).toHaveBeenCalledTimes(2);
    cleanup();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
