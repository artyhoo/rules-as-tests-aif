import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: [
      'principles/**/*.test.ts',
      'render/**/*.test.ts',
      'spec-validation/**/*.test.ts',
      'eslint-rules/**/*.test.ts',
      'detector-v0/**/*.test.ts',
      'detector/**/*.test.ts',
      'research/**/*.test.ts',
      'synthesizer/**/*.test.ts',
    ],
  },
});
