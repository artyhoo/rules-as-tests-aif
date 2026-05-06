import { defineConfig } from 'vitest/config';

// Server-side TypeScript Vitest config.
// Co-located tests with naming convention:
//   *.unit.ts        — unit tests (default vitest run)
//   *.integration.ts — integration tests (separate command)
//   *.audit.ts       — audit/rule-checker tests (default vitest run)

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'src/**/*.unit.ts',
      'src/**/*.audit.ts',
      'tests/**/*.unit.ts',
      'tests/**/*.audit.ts',
    ],
    exclude: [
      '**/*.integration.ts',
      '**/*.e2e.ts',
      '**/node_modules/**',
      '**/dist/**',
    ],

    setupFiles: ['./tests/setup.ts'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.unit.ts',
        'src/**/*.integration.ts',
        'src/**/*.audit.ts',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/generated/**',
        'src/config/env.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 75,
        'src/domain/**': {
          lines: 90,
          functions: 95,
          branches: 85,
        },
        'src/application/**': {
          lines: 85,
          functions: 90,
          branches: 80,
        },
      },
    },

    testTimeout: 5000,
    hookTimeout: 5000,
    pool: 'threads',
    poolOptions: { threads: { singleThread: false } },
    reporters: process.env['CI'] ? ['default', 'github-actions'] : 'default',
  },
});
