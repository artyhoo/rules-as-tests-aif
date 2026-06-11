/**
 * guard-liveness.test.ts — Unit tests for the guard-liveness ESLint roundtrip gate.
 *
 * Paired-negative contract:
 *   ❌ ESLint rule with non-violating input → runRuleLiveness returns FAIL
 *   ✅ ESLint rule with violating input → runRuleLiveness returns PASS
 *
 * Also tests:
 *   - skipped status for unavailable plugins
 *   - no-data status for missing negative-test
 *   - getChangedEslintRuleIds diff logic
 *   - runGuardLivenessCheck aggregation
 */

import { describe, it, expect } from 'vitest';
import {
  runRuleLiveness,
  runGuardLivenessCheck,
  getChangedEslintRuleIds,
  type ManifestRule,
} from './guard-liveness.ts';

// A rule with a working liveness test using a known plugin rule (R12)
const R12_RULE: ManifestRule = {
  check: { type: 'eslint', rule: 'rules-as-tests/no-server-imports-in-client' },
  examples: {
    bad: "'use client';\nimport fs from 'fs';\nexport const x = 1;",
    good: "'use client';\nimport { useState } from 'react';\nexport function C() { return null; }",
  },
  'negative-test': {
    input: ["'use client';\nimport fs from 'fs';\nexport const x = 1;"],
    'expect-violation': 'rules-as-tests/no-server-imports-in-client',
  },
};

// A rule with a non-violating input (T-GLG-B: gate must go RED when bad input doesn't violate)
const BROKEN_LIVENESS_RULE: ManifestRule = {
  check: { type: 'eslint', rule: 'rules-as-tests/no-server-imports-in-client' },
  examples: {
    bad: "'use client';\nimport fs from 'fs';\nexport const x = 1;",
    good: "'use client';\nimport { useState } from 'react';\nexport function C() { return null; }",
  },
  'negative-test': {
    // This input does NOT trigger the rule (it's clean 'use client' code)
    input: ["'use client';\nimport { useState } from 'react';\nexport function C() { return null; }"],
    'expect-violation': 'rules-as-tests/no-server-imports-in-client',
  },
};

// A rule using a built-in ESLint rule (no-throw-literal)
const R6_RULE: ManifestRule = {
  check: { type: 'eslint', rule: 'no-throw-literal' },
  examples: {
    bad: "throw 'bad input';",
    good: "throw new Error('bad input');",
  },
  'negative-test': {
    input: ["throw 'bad input';"],
    'expect-violation': 'no-throw-literal',
  },
};

// A rule using an unavailable plugin (should be skipped)
const R5_RULE: ManifestRule = {
  check: { type: 'eslint', rule: '@typescript-eslint/no-floating-promises' },
  examples: {
    bad: "function send(): void { fetch('/x'); }",
    good: "async function send(): Promise<void> { await fetch('/x'); }",
  },
  'negative-test': {
    input: ["function send(): void { fetch('/x'); }"],
    'expect-violation': '@typescript-eslint/no-floating-promises',
  },
};

describe('runRuleLiveness', () => {
  /**
   * Paired-negative contract:
   *   ❌ rule with non-violating input → FAIL status (gate catches broken examples)
   *   ✅ rule with violating input and clean good → PASS status
   */
  it(
    'PAIRED-NEGATIVE: non-violating negative-test input returns fail status [GLV-1]',
    () => {
      const result = runRuleLiveness('R12', BROKEN_LIVENESS_RULE);
      expect(result.status).toBe('fail');
      expect(result.failures?.length).toBeGreaterThan(0);
    },
    10_000,
  );

  it(
    'mutation: rule with correct violating input returns pass status [GLV-1]',
    () => {
      const result = runRuleLiveness('R12', R12_RULE);
      expect(result.status).toBe('pass');
    },
    10_000,
  );

  it(
    'built-in ESLint rule (no-throw-literal) returns pass when input violates [GLV-2]',
    () => {
      const result = runRuleLiveness('R6', R6_RULE);
      expect(result.status).toBe('pass');
    },
    10_000,
  );

  it('unavailable plugin returns skipped status [GLV-3]', () => {
    const result = runRuleLiveness('R5', R5_RULE);
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/plugin.*not registered/);
  });

  it('rule with no negative-test returns no-data status [GLV-4]', () => {
    const noDataRule: ManifestRule = {
      check: { type: 'eslint', rule: 'rules-as-tests/no-server-imports-in-client' },
      examples: { bad: 'bad', good: 'good' },
    };
    const result = runRuleLiveness('R99', noDataRule);
    expect(result.status).toBe('no-data');
  });

  it('non-eslint rule returns n/a status [GLV-5]', () => {
    const manualRule: ManifestRule = {
      check: { type: 'manual' },
      examples: { bad: 'bad', good: 'good' },
    };
    const result = runRuleLiveness('IR1', manualRule);
    expect(result.status).toBe('n/a');
  });

  it(
    'rule with good example that violates returns fail status [GLV-6]',
    () => {
      // good example same as bad — rule fires on both → fail
      const badGoodRule: ManifestRule = {
        check: { type: 'eslint', rule: 'rules-as-tests/no-server-imports-in-client' },
        examples: {
          bad: "'use client';\nimport fs from 'fs';\nexport const x = 1;",
          good: "'use client';\nimport fs from 'fs';\nexport const x = 1;",
        },
        'negative-test': {
          input: ["'use client';\nimport fs from 'fs';\nexport const x = 1;"],
          'expect-violation': 'rules-as-tests/no-server-imports-in-client',
        },
      };
      const result = runRuleLiveness('R99', badGoodRule);
      expect(result.status).toBe('fail');
      expect(result.failures?.join('')).toMatch(/unexpected violation/);
    },
    10_000,
  );
});

describe('getChangedEslintRuleIds', () => {
  it('returns all ESLint rule IDs when base is null (new branch)', () => {
    const manifest = JSON.stringify({
      R2: { check: { type: 'eslint', rule: 'r/a' }, examples: { bad: '', good: '' } },
      R1: { check: { type: 'manual' }, examples: { bad: '', good: '' } },
    });
    const ids = getChangedEslintRuleIds(null, manifest);
    expect(ids).toContain('R2');
    expect(ids).not.toContain('R1');
  });

  it('returns only changed ESLint rules when base is provided', () => {
    const base = JSON.stringify({
      R2: { check: { type: 'eslint', rule: 'r/a' }, examples: { bad: 'old', good: 'good' } },
      R6: { check: { type: 'eslint', rule: 'no-throw-literal' }, examples: { bad: "throw 'x';", good: "throw new Error();" } },
    });
    const current = JSON.stringify({
      R2: { check: { type: 'eslint', rule: 'r/a' }, examples: { bad: 'new', good: 'good' } }, // changed
      R6: { check: { type: 'eslint', rule: 'no-throw-literal' }, examples: { bad: "throw 'x';", good: "throw new Error();" } }, // unchanged
    });
    const ids = getChangedEslintRuleIds(base, current);
    expect(ids).toContain('R2');
    expect(ids).not.toContain('R6');
  });

  it('includes new rules added in current manifest', () => {
    const base = JSON.stringify({
      R2: { check: { type: 'eslint', rule: 'r/a' }, examples: { bad: 'b', good: 'g' } },
    });
    const current = JSON.stringify({
      R2: { check: { type: 'eslint', rule: 'r/a' }, examples: { bad: 'b', good: 'g' } },
      R7: { check: { type: 'eslint', rule: 'r/b' }, examples: { bad: 'b', good: 'g' } }, // new
    });
    const ids = getChangedEslintRuleIds(base, current);
    expect(ids).not.toContain('R2');
    expect(ids).toContain('R7');
  });
});

describe('runGuardLivenessCheck', () => {
  it('aggregates pass/fail/skipped/no-data correctly', () => {
    const manifest: Record<string, ManifestRule> = {
      R12: R12_RULE,
      R5: R5_RULE,
      R99: {
        check: { type: 'eslint', rule: 'rules-as-tests/no-server-imports-in-client' },
        examples: { bad: 'b', good: 'g' },
      },
      R_BROKEN: BROKEN_LIVENESS_RULE,
    };
    const report = runGuardLivenessCheck(['R12', 'R5', 'R99', 'R_BROKEN'], manifest);
    expect(report.passed).toContain('R12');
    expect(report.skipped.some((s) => s.startsWith('R5'))).toBe(true);
    expect(report.noData).toContain('R99');
    expect(report.failures.some((f) => f.ruleId === 'R_BROKEN')).toBe(true);
  });
});
