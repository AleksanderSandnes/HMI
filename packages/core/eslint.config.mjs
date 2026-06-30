import eslint from "@eslint/js";

import {
  corePlugins,
  importSettings,
  sharedRules,
  prettier,
  tseslint,
} from "../../eslint.config.base.mjs";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    plugins: corePlugins,
    settings: importSettings,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...sharedRules,
      // The api/* helpers deal in raw, loosely-typed backend payloads; `any` is
      // deliberate at those boundaries rather than fighting the upstream shapes.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
);
