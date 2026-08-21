import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/*/test/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@northstar/domain': path.resolve(__dirname, './packages/domain/src/index.ts'),
      '@northstar/rules': path.resolve(__dirname, './packages/rules/src/index.ts'),
      '@northstar/persistence': path.resolve(__dirname, './packages/persistence/src/index.ts'),
      '@northstar/audit': path.resolve(__dirname, './packages/audit/src/index.ts'),
      '@northstar/security': path.resolve(__dirname, './packages/security/src/index.ts')
    }
  }
});
