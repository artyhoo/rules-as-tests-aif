import { noServerImportsInClient } from './no-server-imports-in-client.ts';

// R14 (require-form-safe-parse) and R20 (require-use-server-directive) were migrated to
// declarative recipes (next-r14 / next-r20) enforced by the exempt-aware wrapper
// `rules-as-tests/restricted-syntax-audit-exempt` (packages/core/eslint-rules). The
// handwritten rules were deleted after full fixture parity was proven in the
// *.parity.test.ts harnesses (generator-require-composite-tier, audit:exempt migration).
const plugin = {
  meta: {
    name: '@rules-as-tests/preset-next-15-canonical-eslint-rules',
    version: '0.1.0',
  },
  rules: {
    'no-server-imports-in-client': noServerImportsInClient,
  },
};

export default plugin;
export const rules = plugin.rules;
