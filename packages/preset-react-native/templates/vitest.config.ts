import { defineConfig } from 'vitest/config';

// React Native Vitest config.
// RN has no browser-rendered components to unit test with jsdom.
// Use this config for:
//   *.test.ts(x)        — utility/hook unit tests (if any)
//   *.spec.ts(x)        — spec tests
//
// Note: ESLint rule tests (eslint-rules/*.test.ts) do NOT exist in this preset —
// zero custom ESLint rules are shipped (build-first-reuse success, design-spec §8).
// E2E tests use Detox or Maestro (not wired here — see ARCHITECTURE.react-native.md).

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
      ],
    },

    testTimeout: 5000,
    reporters: process.env['CI'] ? ['default', 'github-actions'] : 'default',
  },
});
