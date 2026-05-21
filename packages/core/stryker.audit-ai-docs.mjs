// @ts-check
/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  testRunner: 'vitest',
  mutate: [
    'audit-self/audit-ai-docs.ts',
  ],
  reporters: ['clear-text', 'json'],
  jsonReporter: {
    fileName: 'reports/mutation/report-audit-ai-docs.json',
  },
  coverageAnalysis: 'off',
  timeoutMS: 60000,
  vitest: {
    configFile: 'vitest.config.ts',
  },
};
