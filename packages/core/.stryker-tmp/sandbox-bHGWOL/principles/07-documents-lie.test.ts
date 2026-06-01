/**
 * Principle 7 — Documents lie (examples.bad and examples.good exist and are structurally valid)
 *
 * Source: self-testing-docs.md ("Documents lie; tests don't") + SKILL.md intro
 *   ("Documents lie; tests don't. This becomes critical when AI agents write the code") +
 *   overview.md Layer 5 ("Living Documentation — tests ARE the documentation")
 *
 * Phase 2 scope (Guardrail 1 PARTIAL): STRUCTURAL check only.
 *   Verify that examples.bad and examples.good:
 *   1. Exist and are non-empty (covered partially in Principle 2, but P7 adds structural checks)
 *   2. Appear to contain code-like content (not just prose descriptions)
 *   3. Are not degenerate single-word examples
 *
 *   Actual parse/run of examples through ESLint to verify bad→FAIL/good→PASS → Phase 5.
 *
 * Pass criterion: examples contain code-like tokens (function calls, operators, imports,
 *   quotes, brackets) rather than pure prose.
 *
 * Note: this is intentionally lenient — we only block degenerate cases where the "example"
 *   is clearly prose, not code. The goal is to catch "examples.bad: 'this is wrong'" style
 *   entries that provide no executable value.
 */
// @ts-nocheck

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, '../manifest/rules-manifest.json');

interface RuleEntry {
  title: string;
  stack: string[];
  check: { type: string; [key: string]: unknown };
  examples: { bad: string; good: string };
  policy?: string;
  [key: string]: unknown;
}

type Manifest = Record<string, RuleEntry>;

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

/**
 * Code-like signal tokens: indicates the example contains actual code, not pure prose.
 * At least one of these must appear in a non-trivially short example.
 * Covers JS/TS, YAML (GitHub Actions), shell, and comment-annotated snippets.
 */
const CODE_SIGNALS = [
  /[(){}[\]<>]/, // brackets
  /[;,=]/, // statement separators and assignment
  /'[^']*'|"[^"]*"/, // string literals
  /\/\/|\/\*/, // JS/TS comments
  /\b(import|export|const|let|var|function|class|return|await|async|type|interface)\b/, // JS/TS keywords
  /\.\w+\(/, // method calls like .parse( .safeParse( etc.
  /^#\s|^-\s|:\s/m, // YAML / shell comment or list item or key: value (multi-line)
  /uses:|run:|name:|steps:/i, // GitHub Actions YAML keywords
  /@\w+/, // decorators or version refs like @main, @sha
];

const MIN_CODE_LENGTH = 10; // characters — below this, we don't require code signals

function hasCodeLikeContent(example: string): boolean {
  const trimmed = example.trim();
  if (trimmed.length < MIN_CODE_LENGTH) {
    return false; // too short to be meaningful code
  }
  return CODE_SIGNALS.some((pattern) => pattern.test(trimmed));
}

function assertPrinciple7(id: string, rule: RuleEntry): void {
  const bad = rule.examples?.bad?.trim() ?? '';
  const good = rule.examples?.good?.trim() ?? '';

  if (bad.length === 0) {
    throw new Error(
      `Rule ${id}: examples.bad is empty — documents lie without executable counterexamples.`,
    );
  }

  if (good.length === 0) {
    throw new Error(
      `Rule ${id}: examples.good is empty — documents lie without executable positive examples.`,
    );
  }

  // For examples longer than MIN_CODE_LENGTH, they should contain code signals
  if (bad.length >= MIN_CODE_LENGTH && !hasCodeLikeContent(bad)) {
    throw new Error(
      `Rule ${id}: examples.bad appears to be prose rather than code. ` +
        'Living documentation requires executable code examples, not prose descriptions. ' +
        `Content: "${bad.slice(0, 60)}..."`,
    );
  }

  if (good.length >= MIN_CODE_LENGTH && !hasCodeLikeContent(good)) {
    throw new Error(
      `Rule ${id}: examples.good appears to be prose rather than code. ` +
        'Living documentation requires executable code examples, not prose descriptions. ' +
        `Content: "${good.slice(0, 60)}..."`,
    );
  }
}

describe('Principle 7 — Documents lie (examples contain code-like content, not just prose)', () => {
  it('all rules have examples with code-like content', () => {
    const manifest = loadManifest();
    const violations: string[] = [];

    for (const [id, rule] of Object.entries(manifest)) {
      try {
        assertPrinciple7(id, rule);
      } catch (err) {
        violations.push((err as Error).message);
      }
    }

    expect(violations, `Violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('mutation: rule with empty examples.bad causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();
    const [firstId, firstRule] = Object.entries(manifest)[0] as [string, RuleEntry];

    const mutated: RuleEntry = {
      ...firstRule,
      examples: { bad: '', good: firstRule.examples.good },
    };

    expect(() => assertPrinciple7(firstId, mutated)).toThrow(/examples\.bad is empty/);
  });

  it('mutation: rule with prose-only examples.bad causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();
    const [firstId, firstRule] = Object.entries(manifest)[0] as [string, RuleEntry];

    const mutated: RuleEntry = {
      ...firstRule,
      examples: {
        bad: 'This is wrong because it violates the rule',
        good: firstRule.examples.good,
      },
    };

    expect(() => assertPrinciple7(firstId, mutated)).toThrow(/prose rather than code/);
  });

  it('mutation: rule with prose-only examples.good causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();
    const [firstId, firstRule] = Object.entries(manifest)[0] as [string, RuleEntry];

    const mutated: RuleEntry = {
      ...firstRule,
      examples: {
        bad: firstRule.examples.bad,
        good: 'This is the correct approach following best practices',
      },
    };

    expect(() => assertPrinciple7(firstId, mutated)).toThrow(/prose rather than code/);
  });
});
