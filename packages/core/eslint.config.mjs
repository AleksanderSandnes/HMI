import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The api/* helpers deal in raw, loosely-typed backend payloads; `any` is
      // deliberate at those boundaries rather than fighting the upstream shapes.
      "@typescript-eslint/no-explicit-any": "off",
      // Allow intentionally-unused names when prefixed with "_" (e.g. omitted
      // destructure keys, placeholder args).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier
);
