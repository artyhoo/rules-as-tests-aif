// L4 Gate 8 — messageId-coverage anti-vacuity check.
// Per architecture.md §2.6 anti-vacuity cluster:
// For each declarative (eslint-restricted, non-ast-grep) rule that declares
// check.message or check.messageId, verifies that the declared value IS
// the one actually emitted when examples.bad is linted with the rule config
// from eslintConfigSnippet.
//
// NET-NEW vs gate 2 (rule-tester): gate 2's matches() passes on loose
// m.ruleId===ruleName fallback — it never asserts the declared message is
// the emitted one. A rule can fire under a different message than declared,
// making the declared message a dead/unreachable artifact. This gate closes
// that gap: declared message must be reachable.
//
// Applies to check.type === 'declarative' with check.message or check.messageId.
// eslint/manual/command/script types: n/a (no declared message/messageId field).
// ast-grep: explicit deferred-marker per generator-forbid-mvp decision (i)
//   when the rule also has a declared message.

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import presetPlugin from '@rules-as-tests/preset-next-15-canonical/eslint-rules';
import type { SynthesisPlan, SynthesizedRule } from '../synthesizer/types.ts';
import type { GateFailure, GateOutcome } from './types.ts';

const KNOWN_PLUGINS: Record<string, unknown> = {
  'rules-as-tests': presetPlugin,
};

function buildSingleRuleConfig(
  ruleName: string,
  ruleConfig: unknown,
): Linter.Config[] {
  return [
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      languageOptions: {
        parser: tseslintParser,
        parserOptions: {
          ecmaFeatures: { jsx: true },
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      plugins: KNOWN_PLUGINS,
      rules: { [ruleName]: ruleConfig as Linter.RuleEntry },
    },
  ] as Linter.Config[];
}

function checkRule(
  rule: SynthesizedRule,
  parsedSnippet: Record<string, unknown>,
): GateFailure[] {
  if (rule.check.type !== 'declarative') return [];

  if (rule.check.engine === 'ast-grep') {
    if (!rule.check.message && !rule.check.messageId) return [];
    return [
      {
        ruleId: rule.id,
        reason:
          'ast-grep engine reserved but not wired — deferred per generator-forbid-mvp decision (i)',
      },
    ];
  }

  const declaredMessage = rule.check.message;
  const declaredMessageId = rule.check.messageId;
  if (!declaredMessage && !declaredMessageId) {
    return [];
  }

  const ruleName = 'no-restricted-syntax';
  const ruleConfig = parsedSnippet[ruleName];
  if (!ruleConfig) {
    return [];
  }

  const config = buildSingleRuleConfig(ruleName, ruleConfig);
  const linter = new Linter();
  const messages = linter.verify(rule.examples.bad, config, {
    filename: 'bad-example.tsx',
  });

  const violation = messages.find((m) => m.ruleId === ruleName);
  if (!violation) {
    return [];
  }

  if (declaredMessage && !violation.message.includes(declaredMessage)) {
    return [
      {
        ruleId: rule.id,
        reason: `messageId-coverage: declared check.message '${declaredMessage}' not found in emitted message '${violation.message}' — declared message is unreachable`,
      },
    ];
  }
  if (declaredMessageId && violation.messageId !== declaredMessageId) {
    return [
      {
        ruleId: rule.id,
        reason: `messageId-coverage: declared check.messageId '${declaredMessageId}' does not match emitted messageId '${String(violation.messageId)}' — declared messageId is unreachable`,
      },
    ];
  }

  return [];
}

export function runMessageIdCoverageGate(plan: SynthesisPlan): GateOutcome {
  const declarativeRules = plan.rules.filter(
    (r) => r.check.type === 'declarative',
  );
  if (declarativeRules.length === 0) {
    return { status: 'n/a', failures: [] };
  }

  const hasApplicableRule = declarativeRules.some(
    (r) =>
      r.check.type === 'declarative' &&
      (r.check.message || r.check.messageId),
  );
  if (!hasApplicableRule) {
    return { status: 'n/a', failures: [] };
  }

  const parsedSnippet = JSON.parse(plan.eslintConfigSnippet) as Record<
    string,
    unknown
  >;
  const failures: GateFailure[] = [];
  for (const rule of declarativeRules) {
    failures.push(...checkRule(rule, parsedSnippet));
  }
  return failures.length === 0
    ? { status: 'pass', failures: [] }
    : { status: 'fail', failures };
}
