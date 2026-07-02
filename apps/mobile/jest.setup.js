/**
 * Jest setup — runs before each test file. jest-expo's preset doesn't mock
 * AsyncStorage, so any module importing it (directly, like usePreference.ts,
 * or transitively, like src/lib/theme.tsx) crashes test suites with
 * "NativeModule: AsyncStorage is null" unless it's mocked here.
 */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
