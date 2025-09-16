import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.js'],
    testTimeout: 30000, // PDF generation can be slow
    setupFiles: ['tests/e2e/setup.js']
  }
});