import expoConfig from "eslint-config-expo/flat.js";

import { appPlugins, importSettings, sharedRules, prettier } from "../../eslint.config.base.mjs";

export default [
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "build/**",
      "android/**",
      "ios/**",
      "web-build/**",
      "coverage/**",
    ],
  },
  ...expoConfig,
  // Shared monorepo rules + type-aware linting, scoped to the app source.
  {
    files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    plugins: appPlugins,
    settings: importSettings,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...sharedRules,
      // RN-specific carry-overs from the old .eslintrc:
      // the push hook lazily require()s native-only modules.
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      // The newer react-hooks (rc) checks that ship with Expo are noisy here.
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  prettier,
];
