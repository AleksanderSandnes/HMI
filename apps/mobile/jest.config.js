/**
 * Jest configuration for the HMI frontend (React Native + Expo).
 *
 * Uses the official `jest-expo` preset so React Native / Expo modules are
 * transformed correctly. Tests live in `__tests__/` folders or are named
 * `*.test.ts(x)` / `*.test.js`. This config is test-only and has no effect on
 * the shipped app bundle.
 */
module.exports = {
  preset: "jest-expo",
  // Screen tests mount heavy trees; the default 5s is too tight on shared CI runners.
  testTimeout: 30000,
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/backend/", "/.expo/", "/dist/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|d3-.*|internmap|@reduxjs/toolkit|react-redux|redux|reselect|immer|expo-modules-core))",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/__tests__/**",
  ],
  // Release gate (plan 7.1): overall >= 80%. Do not lower or exclude files to pass.
  coverageThreshold: { global: { lines: 80, statements: 80, functions: 80, branches: 80 } },
};
