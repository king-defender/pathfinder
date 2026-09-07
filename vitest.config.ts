/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, './test/setup.ts')],
    // The /health/detailed integration tests deliberately hit real external checks (Google
    // Auth credential lookup, a real Maps API fetch) with no credentials configured, and
    // assert on the resulting 503/degraded response rather than mocking them out - so they
    // need real network round-trip time to fail, not vitest's 5s default.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'coverage/',
        'playwright-report/',
      ],
    },
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      'playwright-report',
      'test/e2e/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});