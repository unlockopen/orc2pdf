// E2E test setup - ensure puppeteer can run in test environment
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set puppeteer args for CI environments
  if (process.env.CI) {
    process.env.PUPPETEER_ARGS = '--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage';
  }
});