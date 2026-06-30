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
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/backend/", "/.expo/", "/dist/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@reduxjs/toolkit|react-redux|redux|reselect|immer|expo-modules-core))",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/__tests__/**",
  ],
};
