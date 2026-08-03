const path = require("node:path");
const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
