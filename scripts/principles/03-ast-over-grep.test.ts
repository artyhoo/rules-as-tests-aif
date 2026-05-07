/**
 * Principle 3 — AST > grep (structural check, PARTIAL scope)
 *
 * Source: overview.md Layer 2 ("AST scan: every test_* / it() body reaches assertion",
 *   "AST scan: no real network / fs / time imports") + SKILL.md ("Meta-tests — tests about
 *   the test suite... Implemented as AST scans")
 *
 * Phase 2 scope (Guardrail 1): STRUCTURAL check only.
 *   check.type === "eslint" implies AST-based enforcement (ESLint uses TSESTree/espree AST,
 *   not raw regex grep). This is a weaker form — we assert that ESLint rules are used where
 *   automation is present, not that the underlying ESLint rule uses AST vs regex internally.
 *   Deeper runtime check (verifying no-regex-in-rule-impl) → Phase 5.
 *
 * Applicability: rules with check.type === "eslint" — these are the rules where the
 *   framework claims AST-based enforcement. Rules of type "command", "script", "manual"
 *   are exempt from this principle (they use other enforcement mechanisms).
 *
 * Pass criterion: for each eslint-type rule, the rule name must be a non-empty string
 *   (i.e., it references a real ESLint rule, not a placeholder/comment).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const MANIFEST_PATH = resolve(ROOT, 'factory/rules-manifest.json');

interface CheckEslint {
  type: 'eslint';
  rule: string;
}

interface RuleEntry {
  title: string;
  stack: string[];
  check: { type: string; rule?: string; command?: string; script?: string; rationale?: string };
  examples: { bad: string; good: string };
  policy?: string;
  [key: string]: unknown;
}

type Manifest = Record<string, RuleEntry>;

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

/**
 * For eslint-type rules: verify the rule name is a non-empty, non-placeholder string.
 * Convention for ESLint rule names: "plugin/rule-name" or "rule-name".
 * A placeholder would be empty or contain only whitespace.
 */
function assertPrinciple3(id: string, rule: RuleEntry): void {
  if (rule.check.type !== 'eslint') {
    return; // principle only applies to eslint-type checks
  }

  const eslintRule = (rule.check as CheckEslint).rule;

  if (!eslintRule || eslintRule.trim().length === 0) {
    throw new Error(
      `Rule ${id}: check.type is "eslint" but rule name is empty. ` +
        'An eslint check must reference a concrete rule name (AST-based enforcement).',
    );
  }

  // Rule name should not be a placeholder or comment (starts with # or contains TODO)
  if (/^#|TODO|FIXME|placeholder/i.test(eslintRule.trim())) {
    throw new Error(
      `Rule ${id}: ESLint rule name "${eslintRule}" looks like a placeholder. ` +
        'AST-based enforcement requires a concrete, resolvable rule name.',
    );
  }
}

describe('Principle 3 — AST > grep (structural: eslint-type rules reference concrete rule names)', () => {
  it('all eslint-type rules have non-empty, non-placeholder rule names', () => {
    const manifest = loadManifest();
    const violations: string[] = [];
    let eslintRuleCount = 0;

    for (const [id, rule] of Object.entries(manifest)) {
      if (rule.check.type === 'eslint') {
        eslintRuleCount++;
        try {
          assertPrinciple3(id, rule);
        } catch (err) {
          violations.push((err as Error).message);
        }
      }
    }

    // Sanity: there should be at least one eslint-type rule in the manifest
    expect(eslintRuleCount, 'Expected at least one eslint-type rule in manifest').toBeGreaterThan(0);
    expect(violations, `Violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('mutation: eslint-type rule with empty rule name causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();

    // Find first eslint-type rule for mutation
    const eslintEntry = Object.entries(manifest).find(([, r]) => r.check.type === 'eslint');
    expect(eslintEntry, 'Need at least one eslint rule to mutate').toBeDefined();
    const [id, rule] = eslintEntry as [string, RuleEntry];

    const mutated: RuleEntry = {
      ...rule,
      check: { type: 'eslint', rule: '' },
    };

    expect(() => assertPrinciple3(id, mutated)).toThrow(/rule name is empty/);
  });

  it('mutation: eslint-type rule with TODO placeholder causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();
    const eslintEntry = Object.entries(manifest).find(([, r]) => r.check.type === 'eslint');
    const [id, rule] = eslintEntry as [string, RuleEntry];

    const mutated: RuleEntry = {
      ...rule,
      check: { type: 'eslint', rule: 'TODO: add rule name' },
    };

    expect(() => assertPrinciple3(id, mutated)).toThrow(/placeholder/);
  });
});
