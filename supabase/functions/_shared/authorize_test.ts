import { AuthenticationError, authorizeJob, weatherFailure } from "./authorize.ts";
import { corsHeaders } from "./cors.ts";

Deno.test("maintenance jobs reject missing, user and anon credentials", () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fictional-server-key");
  try {
    for (const token of [null, "Bearer fictional-user", "Bearer fictional-anon"]) {
      const headers = token ? { Authorization: token } : undefined;
      const denied = authorizeJob(new Request("https://example.test", { method: "POST", headers }));
      if (denied?.status !== 401) {
        throw new Error("Non-server request was accepted");
      }
    }
    if (
      authorizeJob(
        new Request("https://example.test", {
          method: "POST",
          headers: { Authorization: "Bearer fictional-server-key" },
        }),
      ) !== null
    )
      throw new Error("Server credential was rejected");
    if (authorizeJob(new Request("https://example.test"))?.status !== 405) {
      throw new Error("GET was accepted");
    }
  } finally {
    Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
  }
});

Deno.test("jobs fail closed when server credential is unconfigured", () => {
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
  if (authorizeJob(new Request("https://example.test", { method: "POST" }))?.status !== 401) {
    throw new Error("Unconfigured server credential accepted");
  }
});

Deno.test("weather failures preserve auth status without exposing upstream secrets", async () => {
  const response = weatherFailure(new Error("database detail and fictional-secret"));
  if (response.status !== 500 || (await response.text()) !== '{"error":"Weather request failed"}') {
    throw new Error("Upstream exception exposed");
  }
  if (weatherFailure(new AuthenticationError()).status !== 401) {
    throw new Error("Incorrect auth status");
  }
  if (corsHeaders["Access-Control-Allow-Origin"] !== "https://hmi-six.vercel.app") {
    throw new Error("Unexpected browser CORS scope");
  }
});
