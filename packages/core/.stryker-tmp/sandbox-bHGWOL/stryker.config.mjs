// @ts-nocheck
// 
/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  testRunner: 'vitest',
  mutate: [
    'eslint-rules/**/*.ts',
    '!eslint-rules/**/*.test.ts',
    '!eslint-rules/index.ts',
    // Wave 10: TS-core pre-push hook logic. Trailer parsers (checks/*.ts) land
    // in 10.2/10.3 with the ≥80% D4 gate; run-check.ts (utils) lands in 10.1.
    'hooks/**/*.ts',
    '!hooks/**/*.test.ts',
    // pre-push.ts is a thin top-level orchestrator (process.exit side-effects,
    // not unit-mutatable in isolation); excluded — its contract is covered by
    // pre-push.test.ts structural assertions, not mutation score.
    '!hooks/pre-push.ts',
  ],
  reporters: ['clear-text', 'json'],
  jsonReporter: {
    fileName: 'reports/mutation/report.json',
  },
  coverageAnalysis: 'off',
  timeoutMS: 30000,
  vitest: {
    configFile: 'vitest.config.ts',
  },
};
