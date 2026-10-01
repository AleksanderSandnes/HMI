import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts", "**/*.test.{ts,tsx}"],
      reporter: ["text", "json-summary", "lcov", "html"],
      // Release gate (plan 7.1): overall >= 80%. Do not lower or exclude files to pass.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // Two React copies exist in the monorepo (root 19.1 for the RN app,
      // ./node_modules 19.2 for this app). @testing-library/react resolves the
      // hoisted root copy, so pin processed sources to the same one — mixing
      // copies makes hooks crash on a null dispatcher.
      react: fileURLToPath(new URL("../../node_modules/react", import.meta.url)),
      "react-dom": fileURLToPath(new URL("../../node_modules/react-dom", import.meta.url)),
    },
  },
});
