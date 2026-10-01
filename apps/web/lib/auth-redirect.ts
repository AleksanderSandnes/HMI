/** Accept only app-local paths before passing a login redirect to Next's router. */
export function safeLoginRedirect(candidate: string | null): string {
  const fallback = "/dashboard";
  if (
    !candidate?.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    [...candidate].some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return fallback;
  }

  const url = new URL(candidate, "https://app.invalid");
  // Dot segments can normalize a root-relative path into a protocol-relative one.
  if (url.origin !== "https://app.invalid" || url.pathname.startsWith("//")) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
