module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**",
    "!**/*.d.ts",
    "!**/*.config.js",
    "!**/app.json",
    "!scripts/**",
  ],
};
