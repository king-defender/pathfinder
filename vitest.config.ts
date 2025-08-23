/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, './test/setup.ts')],
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