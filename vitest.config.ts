import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ["tests/**/*.test.ts", "packages/*/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"],
      exclude: ["**/*.d.ts", "**/index.ts", "**/migrations/**"],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 65,
      },
    },
  },
  resolve: {
    alias: {
      "@northstar/domain": path.resolve(
        __dirname,
        "./packages/domain/src/index.ts",
      ),
      "@northstar/rules": path.resolve(
        __dirname,
        "./packages/rules/src/index.ts",
      ),
      "@northstar/persistence": path.resolve(
        __dirname,
        "./packages/persistence/src/index.ts",
      ),
      "@northstar/audit": path.resolve(
        __dirname,
        "./packages/audit/src/index.ts",
      ),
      "@northstar/security": path.resolve(
        __dirname,
        "./packages/security/src/index.ts",
      ),
    },
  },
});
