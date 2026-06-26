// S4: deterministic RULES.md fragment generated from a declarative spec.
// Replaces the per-recipe handwritten rulesMdTemplate for check.type==='declarative'
// (T-MVP-A: a new forbid/require rule is added as data, not a handwritten template).
import type { SynthesizedRule } from './types.ts';

// The ESLint rule the `eslint-restricted` engine compiles its selector(s) into.
// NOT the built-in `no-restricted-syntax`: the exempt-aware wrapper (shipped from
// packages/core/eslint-rules/restricted-syntax-audit-exempt.ts) runs the identical
// esquery selectors but suppresses a report on any line carrying `audit:exempt` —
// which the built-in cannot (esquery is comment-blind). The human-facing checkLine
// still names `no-restricted-syntax`: the selector mechanism is unchanged, exempt
// handling is an engine-level implementation detail.
export const ESLINT_RESTRICTED_RULE_NAME =
  'rules-as-tests/restricted-syntax-audit-exempt';

/**
 * The `no-restricted-syntax`-shaped config entry for ONE declarative eslint-restricted
 * rule: `['error', { selector, message? }]`. Single source of the entry shape — used
 * both when the synthesizer emits the wrapper config AND when a validator gate tests a
 * single rule in ISOLATION (its own selector only, never the merged set). Isolation
 * matters once a plan carries ≥2 declarative rules: their selectors merge under one
 * wrapper key, and a sibling's selector could otherwise fire on this rule's `examples`.
 */
export function declarativeRestrictedConfigEntry(check: {
  selector: string;
  message?: string;
}): [string, Record<string, string>] {
  const entry: Record<string, string> = { selector: check.selector };
  if (check.message) entry.message = check.message;
  return ['error', entry];
}

/**
 * Extract ONE declarative rule's EMITTED `['error', { selector, message? }]` entry from
 * the merged wrapper config in a SynthesisPlan's eslintConfigSnippet, matched by selector
 * (selectors are unique post-merge — merge-eslint-config dedupes by selector). Returns
 * null when the rule is absent from the snippet.
 *
 * Validator gates use this to test ONE declarative rule against the actual emitted entry
 * (preserving spec-vs-emitted drift detection — e.g. gate-8 message coverage) WHILE
 * isolating it from sibling selectors that would otherwise fire on this rule's examples.
 */
export function extractDeclarativeRuleConfigFromSnippet(
  parsedSnippet: Record<string, unknown>,
  selector: string,
): [string, Record<string, unknown>] | null {
  const merged = parsedSnippet[ESLINT_RESTRICTED_RULE_NAME];
  if (!Array.isArray(merged)) return null;
  const [, ...entries] = merged as unknown[];
  const match = entries.find(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      (e as { selector?: unknown }).selector === selector,
  );
  return match ? ['error', match as Record<string, unknown>] : null;
}

type EngineOutput = { runner: string; checkLine: string };

function resolveEngine(rule: SynthesizedRule): EngineOutput {
  if (rule.check.type !== 'declarative') {
    throw new Error(
      `resolveEngine called on non-declarative rule ${rule.id} (check.type=${rule.check.type})`,
    );
  }
  const engineName = rule.check.engine ?? 'eslint-restricted';
  const presenceLabel = rule.check.presence === 'require' ? 'require' : 'forbid';
  switch (engineName) {
    case 'eslint-restricted':
      return {
        runner: 'no-restricted-syntax',
        checkLine: `declarative \`no-restricted-syntax\` ${presenceLabel} (eslint-restricted engine)`,
      };
    case 'ast-grep':
      return {
        runner: 'ast-grep',
        checkLine: `declarative ast-grep ${presenceLabel} (ast-grep engine)`,
      };
    // G3b: codegen engine slots here
    default:
      throw new Error(`Unsupported engine: ${engineName}`);
  }
}

export function compileDeclarativeMd(rule: SynthesizedRule): string {
  if (rule.check.type !== 'declarative') {
    throw new Error(
      `compileDeclarativeMd called on non-declarative rule ${rule.id} (check.type=${rule.check.type})`,
    );
  }
  const { selector, message } = rule.check;
  const { runner, checkLine } = resolveEngine(rule);
  const why = message ?? (rule.check.presence === 'require' ? 'required construct' : 'forbidden construct');
  return [
    `## ${rule.id} — ${rule.title}`,
    '',
    `**Stack:** ${rule.stack.join(', ')}  `,
    `**Check:** ${checkLine}  `,
    `**Selector:** \`${selector}\`  `,
    `**Why:** ${why}`,
    '',
  ].join('\n');
}
