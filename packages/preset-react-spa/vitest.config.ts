import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['eslint-rules/**/*.test.ts'],
  },
});
