/**
 * Jest configuration for the weatherAPI (Node/Express, CommonJS).
 * Test-only — has no effect on the running server.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(test).js"],
  testPathIgnorePatterns: ["/node_modules/"],
};
