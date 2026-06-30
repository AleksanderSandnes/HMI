// Shared ESLint rule set for the monorepo. Each package's flat config layers this
// onto its framework preset (Next.js for web, Expo/RN for mobile, the TS base for
// core). The type-aware rules (no-floating-promises, no-misused-promises) require
// languageOptions.parserOptions.projectService — enabled per package.
//
// Plugin registration note: the Next and Expo presets already register `import`
// (and `@typescript-eslint`), and a flat config may not register a plugin twice.
// So apps use `appPlugins` (no `import`) and reuse the preset's copy; core, whose
// base preset lacks `import`, uses `corePlugins`.
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import promise from "eslint-plugin-promise";
import sonarjs from "eslint-plugin-sonarjs";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export const sharedRules = {
  "no-debugger": "error",
  "no-alert": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  // Strict equality everywhere except the idiomatic `== null` / `!= null`
  // nullish check (which intentionally matches both null and undefined).
  eqeqeq: ["error", "always", { null: "ignore" }],
  curly: "error",
  "no-var": "error",
  "prefer-const": "error",

  complexity: ["warn", 10],
  "max-depth": ["warn", 4],
  "max-lines-per-function": ["warn", 80],
  "max-params": ["warn", 4],

  "import/order": ["error", { alphabetize: { order: "asc" }, "newlines-between": "always" }],

  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  // unused-imports owns unused-variable detection — disable the TS rule so they
  // don't double-report.
  "@typescript-eslint/no-unused-vars": "off",

  "promise/always-return": "error",
  "promise/no-return-wrap": "error",
  "promise/no-nesting": "warn",

  "sonarjs/no-identical-functions": "warn",
  "sonarjs/cognitive-complexity": ["warn", 15],

  "@typescript-eslint/consistent-type-imports": "error",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-floating-promises": "error",
  // Async event handlers on JSX props (onPress/onClick/...) are idiomatic and
  // safe in React; keep the rule for every other void-return context.
  "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
  "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
};

export const importSettings = {
  "import/resolver": { typescript: true, node: true },
};

/** Plugins for apps (Next/Expo) — `import` comes from the framework preset. */
export const appPlugins = {
  "unused-imports": unusedImports,
  promise,
  sonarjs,
};

/** Plugins for core — its TS base preset doesn't register `import`. */
export const corePlugins = {
  import: importPlugin,
  ...appPlugins,
};

export { prettier, tseslint };
