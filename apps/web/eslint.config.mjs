import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import { appPlugins, importSettings, sharedRules, prettier } from "../../eslint.config.base.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Shared monorepo rules + type-aware linting, scoped to the app source (so
  // config files like next.config.ts / vitest.config.ts aren't type-checked).
  {
    files: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    plugins: appPlugins,
    settings: importSettings,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: sharedRules,
  },
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
