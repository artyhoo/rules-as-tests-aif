/**
 * guard-liveness.ts — Change-scoped ESLint guard-liveness check (Wave guard-liveness v1).
 *
 * Channel: pre-push (liveness — runs ESLint roundtrip).
 * Pre-commit structural check (non-empty input array) lives in .husky/pre-commit.
 *
 * @channel pre-push gate
 * @dual-pair: guard-liveness-eslint
 * @cc-only-rationale: the TypeScript pre-push gate is the primary channel; a portable
 *   agent-prompt form is planned as v3 (manual rules via Superpowers companion).
 *
 * Reuses the ESLint roundtrip logic from validator/gate-rule-tester.ts: the same
 * `Linter`, `buildSingleRuleConfig`, and `matches` pattern — wrapped for manifest
 * rules rather than synthesized rules. T16 problem-class verified: both check that
 * code input → violation; difference is the source (synthesizer plan vs. manifest).
 *
 * Plugin registry covers the rules-as-tests namespace from both packages:
 *   - packages/core/eslint-rules: R2/R7/R8
 *   - packages/preset-next-15-canonical/eslint-rules: R12/R14/R20
 *
 * Rules using unavailable plugins (R5 @typescript-eslint, R15 jsx-a11y, R16 @next/next)
 * are skipped with a visible SKIP notice — not failures. The check captures the intent;
 * install the plugin to enable full coverage.
 */

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import corePlugin from '../../eslint-rules/index.ts';
// Package-name import — same style as the validator precedents
// (gate-rule-tester.ts / gate-conflict.ts / gate-tautology.ts). This module is
// lazily imported by pre-push.ts (guardLivenessSection), so the workspace
// symlink + the preset's own deps (@typescript-eslint/utils) are only required
// when the gate actually runs — i.e. after a root-level install.
import presetPlugin from '@rules-as-tests/preset-next-15-canonical/eslint-rules';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { runCheck } from '../utils/run-check.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../..');
const MANIFEST_PATH = resolve(REPO_ROOT, 'packages/core/manifest/rules-manifest.json');

/** Merged plugin providing all rules-as-tests/* rules (core + preset). */
const KNOWN_PLUGINS: Record<string, unknown> = {
  'rules-as-tests': {
    meta: { name: '@rules-as-tests/all', version: '0.1.0' },
    rules: {
      ...corePlugin.rules,
      ...presetPlugin.rules,
    },
  },
};

/** Extract the ESLint plugin namespace from a rule name, or null for built-in rules. */
function getPluginKey(ruleName: string): string | null {
  if (!ruleName.includes('/')) return null; // built-in (e.g. no-throw-literal)
  if (ruleName.startsWith('@')) {
    const parts = ruleName.split('/');
    // 3 parts = scoped plugin with sub-name (@next/next/no-img-element → @next/next);
    // 2 parts = scope IS the plugin (@typescript-eslint/no-floating-promises → @typescript-eslint).
    return parts.length >= 3 ? `${parts[0]}/${parts[1]}` : parts[0];
  }
  return ruleName.split('/')[0]; // e.g. rules-as-tests, jsx-a11y
}

function buildRuleConfig(ruleName: string, ruleConfig: unknown): Linter.Config[] {
  return [
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      languageOptions: {
        parser: tseslintParser as Linter.Parser,
        parserOptions: {
          ecmaFeatures: { jsx: true },
          ecmaVersion: 'latest' as const,
          sourceType: 'module' as const,
        },
      },
      plugins: KNOWN_PLUGINS,
      rules: { [ruleName]: ruleConfig as Linter.RuleEntry },
    },
  ] as Linter.Config[];
}

function matchesViolation(
  message: Linter.LintMessage,
  expected: string,
  ruleName: string,
): boolean {
  if (message.messageId === expected) return true;
  if (message.ruleId === expected) return true;
  if (message.ruleId === ruleName) return true;
  return false;
}

export interface ManifestNegativeTest {
  input: string[];
  'expect-violation': string;
  eslintRuleConfig?: unknown;
}

export interface ManifestRule {
  check: { type: string; rule?: string };
  examples: { bad: string; good: string };
  'negative-test'?: ManifestNegativeTest;
}

export type RuleLivenessStatus = 'pass' | 'fail' | 'skipped' | 'no-data' | 'n/a';

export interface RuleLivenessResult {
  status: RuleLivenessStatus;
  reason?: string;
  failures?: string[];
}

export interface GuardLivenessFailure {
  ruleId: string;
  failures: string[];
}

export interface GuardLivenessReport {
  failures: GuardLivenessFailure[];
  skipped: string[];  // rules where plugin not registered
  passed: string[];
  noData: string[];   // ESLint rules without negative-test data
}

/** Run the ESLint roundtrip for a single manifest rule. Pure — no I/O. */
export function runRuleLiveness(ruleId: string, rule: ManifestRule): RuleLivenessResult {
  if (rule.check.type !== 'eslint') return { status: 'n/a' };

  const ruleName = rule.check.rule;
  if (!ruleName) return { status: 'n/a' };

  const nt = rule['negative-test'];
  if (!nt || !Array.isArray(nt.input) || nt.input.length === 0) {
    return { status: 'no-data', reason: 'missing or empty negative-test.input' };
  }

  const pluginKey = getPluginKey(ruleName);
  if (pluginKey !== null && !(pluginKey in KNOWN_PLUGINS)) {
    return {
      status: 'skipped',
      reason: `plugin '${pluginKey}' not registered in KNOWN_PLUGINS — install the plugin to enable liveness check`,
    };
  }

  const ruleConfig = nt.eslintRuleConfig ?? 'error';
  const config = buildRuleConfig(ruleName, ruleConfig);
  const linter = new Linter();
  const failures: string[] = [];

  for (const [idx, input] of nt.input.entries()) {
    const messages = linter.verify(input, config, { filename: 'negative-test.tsx' });
    const matched = messages.some((m) => matchesViolation(m, nt['expect-violation'], ruleName));
    if (!matched) {
      const got = JSON.stringify(messages.map((m) => ({ rule: m.ruleId, messageId: m.messageId })));
      failures.push(
        `input[${idx}] did not produce '${nt['expect-violation']}' for '${ruleName}'; got ${got}`,
      );
    }
  }

  const goodMessages = linter.verify(rule.examples.good, config, { filename: 'example-good.tsx' });
  const goodViolation = goodMessages.find((m) => m.ruleId === ruleName);
  if (goodViolation) {
    failures.push(
      `examples.good produced unexpected violation: rule='${goodViolation.ruleId}' msg='${goodViolation.message}'`,
    );
  }

  if (failures.length > 0) return { status: 'fail', failures };
  return { status: 'pass' };
}

/** Get ESLint rule IDs that changed between the base manifest and the current manifest. */
export function getChangedEslintRuleIds(
  baseManifestJson: string | null,
  currentManifestJson: string,
): string[] {
  const current = JSON.parse(currentManifestJson) as Record<string, ManifestRule>;
  if (!baseManifestJson) {
    return Object.keys(current).filter((k) => current[k].check.type === 'eslint');
  }
  let base: Record<string, ManifestRule>;
  try {
    base = JSON.parse(baseManifestJson) as Record<string, ManifestRule>;
  } catch {
    return Object.keys(current).filter((k) => current[k].check.type === 'eslint');
  }
  const changed: string[] = [];
  for (const [id, rule] of Object.entries(current)) {
    if (rule.check.type !== 'eslint') continue;
    const baseRule = base[id];
    if (!baseRule || JSON.stringify(baseRule) !== JSON.stringify(rule)) {
      changed.push(id);
    }
  }
  return changed;
}

/** Run the guard-liveness check on the given rule IDs against the provided manifest. Pure. */
export function runGuardLivenessCheck(
  ruleIds: string[],
  manifest: Record<string, ManifestRule>,
): GuardLivenessReport {
  const report: GuardLivenessReport = { failures: [], skipped: [], passed: [], noData: [] };
  for (const id of ruleIds) {
    const rule = manifest[id];
    if (!rule) continue;
    const result = runRuleLiveness(id, rule);
    switch (result.status) {
      case 'pass':
        report.passed.push(id);
        break;
      case 'fail':
        report.failures.push({ ruleId: id, failures: result.failures ?? [] });
        break;
      case 'skipped':
        report.skipped.push(`${id}: ${result.reason ?? 'plugin not available'}`);
        break;
      case 'no-data':
        report.noData.push(id);
        break;
      case 'n/a':
        break;
    }
  }
  return report;
}

/**
 * Gate function for pre-push: loads the manifest, determines changed ESLint rules,
 * and runs the liveness check. Reads the base manifest via `git show`.
 */
export function runGuardLivenessGate(base: string): GuardLivenessReport {
  const currentJson = readFileSync(MANIFEST_PATH, 'utf8');
  const baseResult = runCheck('git', ['show', `${base}:packages/core/manifest/rules-manifest.json`], {
    cwd: REPO_ROOT,
  });
  const baseJson = baseResult.exitCode === 0 ? baseResult.stdout : null;
  const changedIds = getChangedEslintRuleIds(baseJson, currentJson);
  if (changedIds.length === 0) return { failures: [], skipped: [], passed: [], noData: [] };
  const manifest = JSON.parse(currentJson) as Record<string, ManifestRule>;
  return runGuardLivenessCheck(changedIds, manifest);
}
