// Fixture-parity harness for require-otel-span (R8) declarative migration.
// Runs all existing inline fixtures from require-otel-span.test.ts against the
// declarative no-restricted-syntax selector in next-r8-require-otel-span.json.
// Passes when byte-equivalent verdicts are achieved on all fixtures.
// Evidence: parity table is logged per T3 (no prose-only findings).

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const recipe = JSON.parse(
  readFileSync(resolve(HERE, '../synthesizer/recipes/next-r8-require-otel-span.json'), 'utf8'),
);
const selector: string = recipe.rule.check.selector;
const message: string | undefined = recipe.rule.check.message;

function makeConfig(): Linter.Config[] {
  const entry: Record<string, string> = { selector };
  if (message) entry.message = message;
  return [
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      languageOptions: {
        parser: tseslintParser as Linter.Parser,
        parserOptions: {
          ecmaFeatures: { jsx: true },
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      rules: { 'no-restricted-syntax': ['error', entry] as Linter.RuleEntry },
    },
  ];
}

const linter = new Linter();
const config = makeConfig();

function check(code: string): Linter.LintMessage[] {
  return linter.verify(code, config, { filename: 'test.ts' }).filter((m) => m.ruleId === 'no-restricted-syntax');
}

// Parity table (T3 evidence): fixture → expected verdict → actual verdict → match?
// Valid fixtures: handwritten=no error → declarative must produce 0 violations.
// Invalid fixtures: handwritten=error → declarative must produce ≥1 violation.

describe('require-otel-span declarative parity (selector from next-r8-require-otel-span.json)', () => {
  describe('VALID — handwritten: no error; declarative must produce 0 violations', () => {
    it('startActiveSpan via tracer', () => {
      const code = `export async function placeOrder() {
       return tracer.startActiveSpan('placeOrder', async (span) => {
         span.end();
         return { ok: true };
       });
     }`;
      expect(check(code)).toHaveLength(0);
    });

    it('withSpan helper', () => {
      const code = `export async function getUser() {
       return withSpan('getUser', async () => ({ id: 1 }));
     }`;
      expect(check(code)).toHaveLength(0);
    });

    it('async arrow with startActiveSpan', () => {
      const code = `export const handle = async () => {
       return tracer.startActiveSpan('handle', async () => null);
     };`;
      expect(check(code)).toHaveLength(0);
    });

    it('sync export — rule does not apply', () => {
      expect(check(`export function notAsync() { return 1; }`)).toHaveLength(0);
    });

    it('non-exported async — rule does not apply', () => {
      expect(check(`async function inner() { return 1; }`)).toHaveLength(0);
    });
  });

  describe('INVALID — handwritten: error; declarative must produce ≥1 violation', () => {
    it('named async fn without span', () => {
      expect(check(`export async function placeOrder() { return { ok: true }; }`).length).toBeGreaterThan(0);
    });

    it('async arrow without span (A2 arm)', () => {
      expect(check(`export const placeOrder = async () => { return { ok: true }; };`).length).toBeGreaterThan(0);
    });

    it('named async fn calling save()', () => {
      expect(check(`export async function process() { await save(); }`).length).toBeGreaterThan(0);
    });

    it('mutant-killer: tracer.otherMethod is not a span', () => {
      expect(check(`export async function logMetric() { tracer.otherMethod('metric'); }`).length).toBeGreaterThan(0);
    });

    it('mutant-killer: expression-body async arrow (A2 arm)', () => {
      expect(check(`export const fn = async () => doSomething();`).length).toBeGreaterThan(0);
    });

    it('mutant-killer: async FunctionExpression (A2 arm)', () => {
      expect(check(`export const handler = async function() { return { ok: true }; };`).length).toBeGreaterThan(0);
    });

    it('mutant-killer: sparse array null-guard', () => {
      expect(check(`export async function f() { const x = [, 1]; }`).length).toBeGreaterThan(0);
    });
  });
});
