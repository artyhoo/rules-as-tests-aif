// L4 Gate 2 — rule-tester roundtrip.
// Per architecture.md §2.6 + Phase 6 retro: each synthesized rule with
// check.type === 'eslint' must be runnable. Gate runs the rule against
// (a) negative-test.input — expects matching violation, (b) examples.good
// — expects no violation. Skip rules with check.type ∈ {manual,command,script}.
//
// Built-in ESLint rules (e.g. no-restricted-imports) are configured directly
// from plan.eslintConfigSnippet. Plugin rules (e.g. rules-as-tests/...) are
// resolved through the @rules-as-tests/preset-next-15-canonical plugin
// registry — explicit map below; v1 covers the one plugin currently emitted
// by recipes (no-server-imports-in-client). Recipe expansion (Phase 8 R12/14/20)
// will add entries here.

import { Linter } from 'eslint';
// Namespace import — @typescript-eslint/parser is CJS and exposes parse/parseForESLint
// directly on the module object. A default import resolves to a wrapped shape under
// tsx/Node ESM interop and silently parses TypeScript syntax as JavaScript (e.g. a
// `: FormData` parameter annotation produces "Unexpected token :"). Phase 8 R14 was
// the first plugin-rule negative-test with TS-only syntax; the default-import shape
// only failed on that case, which is why the fixture tests never tripped.
import * as tseslintParser from '@typescript-eslint/parser';
import presetPlugin from '@rules-as-tests/preset-next-15-canonical/eslint-rules';
import type { SynthesisPlan, SynthesizedRule } from '../synthesizer/types.ts';
import type { GateFailure, GateOutcome } from './types.ts';

// `plugins` and `parser` types in ESLint 10's flat config are stricter than
// what @typescript-eslint/utils RuleModule and @typescript-eslint/parser
// statically produce. Both are runtime-compatible — cast at the seam.
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

function matches(
  message: Linter.LintMessage,
  expected: string,
  ruleName: string,
): boolean {
  if (message.messageId === expected) return true;
  if (message.ruleId === expected) return true;
  if (message.ruleId === ruleName) return true;
  return false;
}

function runEslintRoundtrip(
  rule: SynthesizedRule,
  parsedSnippet: Record<string, unknown>,
): GateFailure[] {
  if (rule.check.type !== 'eslint' && rule.check.type !== 'declarative') return [];

  // ast-grep engine is reserved but not wired in S2 — explicit deferred-marker per decision (i)
  if (rule.check.type === 'declarative' && rule.check.engine === 'ast-grep') {
    return [
      {
        ruleId: rule.id,
        reason:
          'ast-grep engine reserved but not wired — deferred per generator-forbid-mvp decision (i)',
      },
    ];
  }

  const negativeTest = rule['negative-test'];
  if (!negativeTest) {
    return [
      {
        ruleId: rule.id,
        reason:
          'eslint rule has no negative-test (gate 1 catches this; gate 2 cannot run without it)',
      },
    ];
  }
  // eslint type uses check.rule; declarative+eslint-restricted derives no-restricted-syntax
  const ruleName =
    rule.check.type === 'eslint' ? rule.check.rule : 'no-restricted-syntax';
  const ruleConfig = parsedSnippet[ruleName] ?? 'error';
  const config = buildSingleRuleConfig(ruleName, ruleConfig);
  const linter = new Linter();
  const failures: GateFailure[] = [];

  for (const [idx, input] of negativeTest.input.entries()) {
    const negMessages = linter.verify(input, config, {
      filename: 'negative-test.tsx',
    });
    const negMatched = negMessages.some((m) =>
      matches(m, negativeTest['expect-violation'], ruleName),
    );
    if (!negMatched) {
      failures.push({
        ruleId: rule.id,
        reason: `negative-test.input[${idx}] did not produce expected violation '${negativeTest['expect-violation']}' for rule '${ruleName}'; got ${JSON.stringify(
          negMessages.map((m) => ({ rule: m.ruleId, messageId: m.messageId })),
        )}`,
      });
    }
  }

  const posMessages = linter.verify(rule.examples.good, config, {
    filename: 'example-good.tsx',
  });
  const posViolation = posMessages.find((m) => m.ruleId === ruleName);
  if (posViolation) {
    failures.push({
      ruleId: rule.id,
      reason: `examples.good produced unexpected violation: rule='${posViolation.ruleId}' message='${posViolation.message}'`,
    });
  }

  return failures;
}

export function runRuleTesterGate(plan: SynthesisPlan): GateOutcome {
  const eslintRules = plan.rules.filter(
    (r) => r.check.type === 'eslint' || r.check.type === 'declarative',
  );
  if (eslintRules.length === 0) {
    return { status: 'n/a', failures: [] };
  }
  const parsedSnippet = JSON.parse(plan.eslintConfigSnippet) as Record<
    string,
    unknown
  >;
  const failures: GateFailure[] = [];
  for (const rule of eslintRules) {
    failures.push(...runEslintRoundtrip(rule, parsedSnippet));
  }
  return failures.length === 0
    ? { status: 'pass', failures: [] }
    : { status: 'fail', failures };
}
