// Fixture-parity harness for require-use-server-directive (R20) — declarative migration.
//
// PROVES the exempt-aware wrapper (rules-as-tests/restricted-syntax-audit-exempt)
// reaches FULL parity with the (now-deleted) handwritten rule across every fixture
// from the original require-use-server-directive.test.ts — INCLUDING the per-line
// `// audit:exempt` case that bare `no-restricted-syntax` could not express (former GAP).
//
// The selector + message are read from the SHIPPED recipe so this guards the actual
// declarative spec, not a hand-copied selector.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';
import { restrictedSyntaxAuditExempt } from '../../core/eslint-rules/restricted-syntax-audit-exempt.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RECIPE = resolve(
  HERE,
  '../../core/synthesizer/recipes/next-r20-require-use-server-directive.json',
);
const recipe = JSON.parse(readFileSync(RECIPE, 'utf8')) as {
  rule: { check: { selector: string; message: string } };
};
const selector = recipe.rule.check.selector;
const message = recipe.rule.check.message;

const WRAPPER = 'rules-as-tests/restricted-syntax-audit-exempt';

function check(code: string): Linter.LintMessage[] {
  const linter = new Linter();
  const config = [
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
      plugins: {
        'rules-as-tests': {
          rules: { 'restricted-syntax-audit-exempt': restrictedSyntaxAuditExempt },
        },
      },
      rules: { [WRAPPER]: ['error', { selector, message }] },
    },
  ] as unknown as Linter.Config[];
  return linter
    .verify(code, config, { filename: 'test.ts' })
    .filter((m) => m.ruleId === WRAPPER);
}

// Every fixture from require-use-server-directive.test.ts (the handwritten rule's spec).
const VALID: Array<[string, string]> = [
  ['no async export — rule does not apply', `export function sync() { return 1; }`],
  [
    "'use server' present + async export — OK",
    `'use server';\nexport async function action() { return 1; }`,
  ],
  [
    'double-quoted directive — OK',
    `"use server";\nexport async function action() { return 1; }`,
  ],
  [
    'default async export with directive — OK',
    `'use server';\nexport default async function action() { return 1; }`,
  ],
  [
    'multiple async exports with directive — OK',
    `'use server';
     export async function a() { return 1; }
     export async function b() { return 2; }`,
  ],
  ['only synchronous export named — does not apply', `export const value = 42;`],
  [
    'audit:exempt on async export line — SUPPRESSED (former GAP, now closed)',
    `export async function action() { return 1; } // audit:exempt`,
  ],
  [
    'async non-exported function — does not apply',
    `async function helper() { return 1; }
     export const x = 1;`,
  ],
];

const INVALID: Array<[string, string]> = [
  ['named async export, no directive', `export async function action() { return 1; }`],
  [
    'import + named async export, no directive',
    `import { db } from './db';
export async function action() { return db.q(); }`,
  ],
  [
    'directive not first statement — does not count',
    `import './side-effect';
'use server';
export async function action() { return 1; }`,
  ],
  [
    'non-string-literal first statement',
    `const x = 1;
export async function action() { return 1; }`,
  ],
  ['default async export, no directive', `export default async function action() { return 1; }`],
];

describe('require-use-server-directive declarative parity — exempt-aware wrapper (R20)', () => {
  describe('PARITY: VALID fixtures → 0 violations (incl. audit:exempt — GAP CLOSED)', () => {
    it.each(VALID)('%s', (_label, code) => {
      expect(check(code)).toHaveLength(0);
    });
  });

  describe('PARITY: INVALID fixtures → ≥1 violation', () => {
    it.each(INVALID)('%s', (_label, code) => {
      expect(check(code).length).toBeGreaterThan(0);
    });
  });

  it('multiple async exports without directive → one violation per export (parity)', () => {
    const code = `export async function a() { return 1; }
export async function b() { return 2; }`;
    expect(check(code).length).toBeGreaterThanOrEqual(2);
  });

  it('// audit:exempt suppresses the report (wrapper parity with handwritten — GAP closed)', () => {
    const exempt = `export async function action() { return 1; } // audit:exempt`;
    const withoutExempt = `export async function action() { return 1; }`;
    expect(check(exempt)).toHaveLength(0);
    // Paired-negative: the SAME code without the exemption still fires.
    expect(check(withoutExempt).length).toBeGreaterThan(0);
  });
});
