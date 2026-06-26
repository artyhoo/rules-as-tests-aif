// Fixture-parity harness for require-form-safe-parse (R14) — declarative migration.
//
// PROVES the exempt-aware wrapper (rules-as-tests/restricted-syntax-audit-exempt)
// reaches FULL parity with the (now-deleted) handwritten rule across every fixture
// from the original require-form-safe-parse.test.ts — INCLUDING the per-line
// `audit:exempt` case that bare `no-restricted-syntax` could not express (the former
// documented GAP). The wrapper runs the identical esquery selector but suppresses a
// report on any line carrying `audit:exempt`, exactly as the handwritten rule did via
// `context.sourceCode.lines`.
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
  '../../core/synthesizer/recipes/next-r14-require-form-safe-parse.json',
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
      files: ['**/*.{ts,tsx}'],
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

// Every fixture from require-form-safe-parse.test.ts (the handwritten rule's spec).
const VALID: Array<[string, string]> = [
  ['no FormData parameter — rule does not apply', `export async function action(input: { name: string }) { return input; }`],
  [
    'FormData + safeParse — OK',
    `export async function action(formData: FormData) {
       const parsed = schema.safeParse(Object.fromEntries(formData));
       return parsed;
     }`,
  ],
  [
    'FormData under different name + safeParse — OK',
    `export async function action(fd: FormData) {
       schema.safeParse(fd.get('name'));
     }`,
  ],
  [
    'globalThis.FormData qualified + safeParse — OK',
    `export async function action(fd: globalThis.FormData) {
       schema.safeParse(Object.fromEntries(fd));
     }`,
  ],
  [
    'arrow function with FormData + safeParse — OK',
    `export const submit = async (formData: FormData) => {
       const result = schema.safeParse(Object.fromEntries(formData));
       return result;
     };`,
  ],
  [
    'safeParse in helper inside body — OK',
    `export async function action(formData: FormData) {
       const data = Object.fromEntries(formData);
       const parsed = userSchema.safeParse(data);
       return parsed.data;
     }`,
  ],
  [
    'audit:exempt on FormData param — SUPPRESSED (former GAP, now closed)',
    `export async function action(formData: FormData /* audit:exempt */) {
       return formData.get('name');
     }`,
  ],
];

const INVALID: Array<[string, string]> = [
  [
    'named async FormData param, no safeParse',
    `export async function action(formData: FormData) {
        return formData.get('name');
      }`,
  ],
  [
    'arrow FormData param, no safeParse',
    `export const submit = async (fd: FormData) => {
        const name = fd.get('name');
        return name;
      };`,
  ],
  [
    'sync FormData param, no safeParse',
    `export function sync(formData: FormData) {
        const obj = Object.fromEntries(formData);
        return obj;
      }`,
  ],
  [
    'multiple params incl FormData, no safeParse',
    `export async function action(input: string, fd: FormData) {
        return fd.get(input);
      }`,
  ],
];

describe('require-form-safe-parse declarative parity — exempt-aware wrapper (R14)', () => {
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

  // The former GAP, asserted explicitly: the handwritten rule read the param line
  // for `audit:exempt` and suppressed; the wrapper does the same. Bare
  // no-restricted-syntax fired here (false positive) — that is what this migration fixes.
  it('audit:exempt suppresses the report (wrapper parity with handwritten — GAP closed)', () => {
    const exempt = `export async function action(formData: FormData /* audit:exempt */) {
       return formData.get('name');
     }`;
    const withoutExempt = `export async function action(formData: FormData) {
       return formData.get('name');
     }`;
    expect(check(exempt)).toHaveLength(0);
    // Paired-negative: the SAME code without the exemption still fires.
    expect(check(withoutExempt).length).toBeGreaterThan(0);
  });
});
