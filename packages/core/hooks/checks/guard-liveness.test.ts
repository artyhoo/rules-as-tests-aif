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
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runRuleLiveness,
  runGuardLivenessCheck,
  getChangedEslintRuleIds,
  type ManifestRule,
} from './guard-liveness.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REAL_MANIFEST_PATH = resolve(HERE, '../../manifest/rules-manifest.json');

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

describe('real-manifest liveness — selector-family rules R18/R13 [GLV-R18]', () => {
  /**
   * Regression lock for the R18 callback-vs-call false positive surfaced by the
   * full-sweep during PR #711 (2026-06-24). R18.examples.good validates with a
   * point-free `.then(OrderSchema.parse)` — a parse REFERENCE passed as a `.then`
   * callback, NOT a `parse(...)` CallExpression. The original selector matched only
   * `CallExpression[callee.property.name=/^(parse|safeParse)$/]`, so `:not(:has(...))`
   * fired on the compliant good example. The fix broadens the inner match to
   * `MemberExpression[property.name=/^(parse|safeParse)$/]`; a direct `Schema.parse(x)`
   * call contains that MemberExpression as its callee, so BOTH the call and the
   * point-free reference are accepted, while a queryFn with no `.parse`/`.safeParse`
   * member at all (the negative-test input) still trips.
   *
   * This runs the REAL shipped manifest (not a synthetic fixture), so it locks the
   * actual rule the consumer receives. `runRuleLiveness` returns 'pass' only when
   * every negative-test input violates AND examples.good is clean — so 'pass'
   * simultaneously proves no false positive (good) and no false negative (negative-test).
   *
   * Paired-negative contract:
   *   ❌ narrow CallExpression-only selector → examples.good false-positives → status 'fail'
   *   ✅ broadened MemberExpression selector → good clean, negative-test trips → status 'pass'
   */
  const manifest = JSON.parse(readFileSync(REAL_MANIFEST_PATH, 'utf8')) as Record<string, ManifestRule>;

  it(
    'R18: point-free `.then(Schema.parse)` good example does not false-positive; negative-test still trips → pass [GLV-R18]',
    () => {
      const result = runRuleLiveness('R18', manifest.R18);
      expect(result.status, JSON.stringify(result.failures)).toBe('pass');
    },
    10_000,
  );

  it(
    'R13: same no-restricted-syntax selector family — no analogous callback-vs-call gap → pass [GLV-R18]',
    () => {
      const result = runRuleLiveness('R13', manifest.R13);
      expect(result.status, JSON.stringify(result.failures)).toBe('pass');
    },
    10_000,
  );
});
