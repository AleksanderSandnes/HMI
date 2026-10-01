import { json } from "./cors.ts";

/** JWT verification alone also accepts user JWTs; maintenance jobs require the server key. */
export function authorizeJob(req: Request): Response | null {
  if (req.method !== "POST") {
    return new Response("method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!expected || req.headers.get("Authorization") !== `Bearer ${expected}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

export class AuthenticationError extends Error {
  constructor() {
    super("Authentication required");
  }
}

/** Do not return upstream exceptions: they can contain URLs, credentials or database details. */
export function weatherFailure(error: unknown): Response {
  return error instanceof AuthenticationError
    ? json({ error: "Authentication required" }, 401)
    : json({ error: "Weather request failed" }, 500);
}
