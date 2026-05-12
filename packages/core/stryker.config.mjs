// @ts-check
/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  testRunner: 'vitest',
  mutate: [
    'eslint-rules/**/*.ts',
    '!eslint-rules/**/*.test.ts',
    '!eslint-rules/index.ts',
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
