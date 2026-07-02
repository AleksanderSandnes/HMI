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
