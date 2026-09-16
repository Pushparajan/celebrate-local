import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://localhost:3000',
  },
});
