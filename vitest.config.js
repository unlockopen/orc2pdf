import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.js', 'bin/**/*.js'],
      exclude: [
        'lib/serve-content.js', // Legacy file
        'lib/render-pdf.js',    // Legacy file
        'node_modules/**',
        'tests/**'
      ]
    },
    testTimeout: 10000
  }
});