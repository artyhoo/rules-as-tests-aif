/**
 * Principle 6 — MUST not demoted to should
 *
 * Source: ai-traps.md §6 ("AI agent silently demotes 'MUST' to 'should'") +
 *         overview.md Layer 1 anti-pattern ("Rules without because(...) rationale →
 *         first to be deleted") + self-testing-docs.md ("rules without measurable check decay")
 *
 * Manifest fields checked: policy field — scanned for soft/demotion language when
 *   the rule context implies enforcement.
 *
 * Rationale: ai-traps.md §6 documents the pattern "AGENTS.md says 'MUST validate via Zod'.
 *   After 3 sessions, AI starts writing handlers without Zod." The same demotion can happen
 *   in the manifest's policy field: a rule that says "should" where it means "must" is
 *   underenforced from the start.
 *
 * Detection heuristic: policy fields that contain soft-obligation words WITHOUT an explicit
 *   "MUST" or hard negation nearby. We flag policies containing ONLY soft language with
 *   no hard counterpart — these are the true demotion cases.
 *
 * Applicability: rules where check.type is "eslint" or "command" or "script" (these have
 *   automated enforcement — so their policy should use hard language). "manual" rules are
 *   exempt since their enforcement is inherently advisory.
 *
 * Pass criterion: automated-check rules must not have policy fields containing ONLY
 *   soft-obligation language with no hard counterpart ("MUST", "must not", "forbidden",
 *   "required", "prohibited", "No ", "never", "always").
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

/** Soft-obligation patterns that indicate demotion */
const SOFT_PATTERNS = [
  /\bconsider\b/i,
  /\bshould consider\b/i,
  /\bif possible\b/i,
  /\bwhere possible\b/i,
  /\bwhen feasible\b/i,
  /\brecommended\b/i,
  /\bideally\b/i,
  /\bpreferably\b/i,
];

/** Hard-obligation patterns that override soft demotion detection */
const HARD_PATTERNS = [
  /\bMUST\b/,
  /\bmust not\b/i,
  /\bforbidden\b/i,
  /\bprohibited\b/i,
  /\bRequired\b/i,
  /\bNo \b/,
  /\bnever\b/i,
  /\balways\b/i,
  /\bis not allowed\b/i,
  /\bare not allowed\b/i,
  /\bonly\b/i,
];

/** Check whether a policy string is demoted (contains soft language with no hard counterpart) */
function isPolicyDemoted(policy: string): boolean {
  const hasSoft = SOFT_PATTERNS.some((p) => p.test(policy));
  if (!hasSoft) return false;

  const hasHard = HARD_PATTERNS.some((p) => p.test(policy));
  // Demoted only if soft is present AND hard is absent
  return !hasHard;
}

function assertPrinciple6(id: string, rule: RuleEntry): void {
  // Only applies to automated checks; manual checks are inherently advisory
  if (rule.check.type === 'manual') {
    return;
  }

  const policy = rule.policy;
  if (!policy || policy.trim().length === 0) {
    return; // No policy field — not a demotion (absence is different from demotion)
  }

  if (isPolicyDemoted(policy)) {
    throw new Error(
      `Rule ${id}: policy for automated-check rule contains only soft-obligation language ` +
        `("should", "consider", "recommended") with no hard counterpart. ` +
        `This rule has check.type="${rule.check.type}" — its policy should use ` +
        'MUST/forbidden/required language. Add a hard obligation or move to "manual" type.',
    );
  }
}

describe('Principle 6 — MUST not demoted to should (automated-check rules use hard obligation language)', () => {
  it('all automated-check rules with policy fields use hard obligation language', () => {
    const manifest = loadManifest();
    const violations: string[] = [];

    for (const [id, rule] of Object.entries(manifest)) {
      try {
        assertPrinciple6(id, rule);
      } catch (err) {
        violations.push((err as Error).message);
      }
    }

    expect(violations, `Violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('mutation: automated-check rule with only soft language in policy causes assertion to fail (anti-tautology)', () => {
    const manifest = loadManifest();

    // Find an automated-check rule for mutation
    const automatedEntry = Object.entries(manifest).find(
      ([, r]) => r.check.type !== 'manual',
    );
    expect(automatedEntry, 'Need at least one automated-check rule').toBeDefined();
    const [id, rule] = automatedEntry as [string, RuleEntry];

    const mutated: RuleEntry = {
      ...rule,
      policy:
        'Consider using safer alternatives where possible. ' +
        'Recommended to avoid direct access if feasible.',
    };

    expect(() => assertPrinciple6(id, mutated)).toThrow(/soft-obligation language/);
  });

  it('mutation: rule with both soft and hard language passes (hard counterpart exempts soft words)', () => {
    const manifest = loadManifest();
    const automatedEntry = Object.entries(manifest).find(
      ([, r]) => r.check.type !== 'manual',
    );
    const [id, rule] = automatedEntry as [string, RuleEntry];

    // Contains "recommended" (soft) but also "MUST" (hard) — should NOT fail
    const mutated: RuleEntry = {
      ...rule,
      policy: 'MUST use Zod validation. Recommended to also add error logging where possible.',
    };

    // Should not throw
    expect(() => assertPrinciple6(id, mutated)).not.toThrow();
  });
});
