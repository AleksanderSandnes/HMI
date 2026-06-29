import { describe, expect, it } from "vitest";
import {
  LOCAL_JAVA_API,
  RENDER_JAVA_API,
  resolveJavaApiBaseUrl,
} from "@/lib/env";

describe("resolveJavaApiBaseUrl", () => {
  it("uses localhost only for a local dev build in development data mode", () => {
    expect(
      resolveJavaApiBaseUrl({ dataMode: "development", nodeEnv: "development" })
    ).toBe(LOCAL_JAVA_API);
  });

  it("never targets localhost on a deployed build (the test/preview bug)", () => {
    // Vercel runs `next build` → NODE_ENV="production", even for preview
    // deployments that haven't set NEXT_PUBLIC_DATA_MODE.
    expect(
      resolveJavaApiBaseUrl({ dataMode: "development", nodeEnv: "production" })
    ).toBe(RENDER_JAVA_API);
  });

  it("uses Render when the data mode is production, even in a local dev build", () => {
    expect(
      resolveJavaApiBaseUrl({ dataMode: "production", nodeEnv: "development" })
    ).toBe(RENDER_JAVA_API);
  });

  it("lets an explicit override win in every case", () => {
    const override = "https://staging-growatt.example.com";
    expect(
      resolveJavaApiBaseUrl({ override, dataMode: "development", nodeEnv: "development" })
    ).toBe(override);
    expect(
      resolveJavaApiBaseUrl({ override, dataMode: "production", nodeEnv: "production" })
    ).toBe(override);
  });

  it("treats an undefined nodeEnv as a local dev build", () => {
    expect(
      resolveJavaApiBaseUrl({ dataMode: "development" })
    ).toBe(LOCAL_JAVA_API);
  });
});
