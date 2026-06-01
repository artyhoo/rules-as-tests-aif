/**
 * Principle 1 — Every rule has executable check (or explicit manual rationale)
 *
 * Source: overview.md Layer 2 ("every rule has a measurable check") +
 *         ai-traps.md §8 ("Rules without measurable check decay")
 *
 * Manifest field checked: check.type ∈ {"eslint","command","script","manual"}
 * Pass criterion: every rule has a check.type; "manual" type MUST have non-empty rationale.
 */
// @ts-nocheck

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, '../manifest/rules-manifest.json');
const SYNTH_FIXTURE_PATH = resolve(
  HERE,
  '../synthesizer/expected-fixture-synth.json',
);

type Check =
  | { type: 'eslint'; rule: string }
  | { type: 'command'; command: string }
  | { type: 'script'; script: string }
  | { type: 'manual'; rationale?: string };

interface RuleEntry {
  title: string;
  stack: string[];
  check: Check;
  examples: { bad: string; good: string };
  policy?: string;
  [key: string]: unknown;
}

type Manifest = Record<string, RuleEntry>;

interface SynthesizedRuleEntry extends RuleEntry {
  id: string;
}

interface SynthFixture {
  rules: SynthesizedRuleEntry[];
}

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

function loadSynthFixture(): SynthFixture {
  return JSON.parse(readFileSync(SYNTH_FIXTURE_PATH, 'utf8')) as SynthFixture;
}

const VALID_CHECK_TYPES = new Set(['eslint', 'command', 'script', 'manual']);

function assertPrinciple1(id: string, rule: RuleEntry): void {
  const check = rule.check;

  // Must have a check object with a valid type
  if (!check || !check.type) {
    throw new Error(`Rule ${id}: missing check.type`);
  }

  if (!VALID_CHECK_TYPES.has(check.type)) {
    throw new Error(`Rule ${id}: unknown check.type "${check.type}"`);
  }

  // Manual type MUST have non-empty rationale (ai-traps.md §8: "rules without measurable
  // check decay" — manual is acceptable only with documented rationale)
  if (check.type === 'manual') {
    const rationale = (check as { type: 'manual'; rationale?: string }).rationale;
    if (!rationale || rationale.trim().length === 0) {
      throw new Error(
        `Rule ${id}: check.type is "manual" but has no rationale. ` +
          'Add rationale field explaining why automated check is not feasible.',
      );
    }
  }
}

describe('Principle 1 — Every rule has executable check', () => {
  it('all rules in manifest have a valid check type', () => {
    const manifest = loadManifest();
    const violations: string[] = [];

    for (const [id, rule] of Object.entries(manifest)) {
      try {
        assertPrinciple1(id, rule);
      } catch (err) {
        violations.push((err as Error).message);
      }
    }

    expect(violations, `Violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('mutation: rule with missing check.type causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();
    const [firstId, firstRule] = Object.entries(manifest)[0] as [string, RuleEntry];

    // Mutate: remove check entirely
    const mutated: RuleEntry = {
      ...firstRule,
      check: undefined as unknown as Check,
    };

    expect(() => assertPrinciple1(firstId, mutated)).toThrow(/missing check\.type/);
  });

  it('mutation: manual rule without rationale causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();
    const [firstId, firstRule] = Object.entries(manifest)[0] as [string, RuleEntry];

    // Mutate: set check.type to manual with no rationale
    const mutated: RuleEntry = {
      ...firstRule,
      check: { type: 'manual' } as Check,
    };

    expect(() => assertPrinciple1(firstId, mutated)).toThrow(/manual.*no rationale/);
  });

  it('all synthesized rules in expected-fixture-synth.json have a valid check type [M2]', () => {
    const fixture = loadSynthFixture();
    expect(fixture.rules.length).toBeGreaterThan(0);
    const violations: string[] = [];
    for (const rule of fixture.rules) {
      try {
        assertPrinciple1(rule.id, rule);
      } catch (err) {
        violations.push((err as Error).message);
      }
    }
    expect(violations, `Violations:\n${violations.join('\n')}`).toHaveLength(0);
  });
});
