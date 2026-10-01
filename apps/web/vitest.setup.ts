import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; default to "no preference" so media-query hooks render.
// Individual tests override it with vi.spyOn(window, "matchMedia").
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}
