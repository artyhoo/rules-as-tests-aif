// Fixture-parity harness for require-form-safe-parse (R14) declarative migration.
// Runs all existing inline fixtures from require-form-safe-parse.test.ts against the
// declarative no-restricted-syntax selector in next-r14-require-form-safe-parse.json.
//
// Result: PARTIAL PARITY — plain FormData + safeParse cases match; per-line audit:exempt
// exemption is NOT expressible in esquery (comment-based). R14 is RETAINED handwritten.
// The GAP block below is the evidence (T3 — parity table with quoted output).
// Additional documented gap: TSQualifiedName (globalThis.FormData) bad-case is handled
// by the union selector arm [typeName.right.name='FormData'], but the existing fixture
// set has no bad TSQualifiedName case, so this arm is untested by existing fixtures.

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';

// Selector from the declarative migration attempt (R14 retained handwritten — recipe reverted to type:"eslint").
// Kept here as standalone gap-documentation: esquery covers the main case but cannot handle audit:exempt.
const selector: string =
  `:function:not(:has(CallExpression[callee.property.name='safeParse'])):has(Identifier[typeAnnotation.typeAnnotation.typeName.name='FormData'], Identifier[typeAnnotation.typeAnnotation.typeName.right.name='FormData'])`;
const message: string | undefined =
  `Function accepts FormData but does not call .safeParse(...). Validate the form input with a Zod schema (R14).`;

function makeConfig(): Linter.Config[] {
  const entry: Record<string, string> = { selector };
  if (message) entry.message = message;
  return [
    {
      files: ['**/*.{ts,tsx}'],
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

describe('require-form-safe-parse declarative parity (selector from next-r14-require-form-safe-parse.json)', () => {
  describe('PARITY: VALID — declarative must produce 0 violations (main-case fixtures)', () => {
    it('no FormData parameter — rule does not apply', () => {
      const code = `export async function action(input: { name: string }) { return input; }`;
      expect(check(code)).toHaveLength(0);
    });

    it('FormData + safeParse — OK', () => {
      const code = `export async function action(formData: FormData) {
       const parsed = schema.safeParse(Object.fromEntries(formData));
       return parsed;
     }`;
      expect(check(code)).toHaveLength(0);
    });

    it('FormData under different name + safeParse — OK', () => {
      const code = `export async function action(fd: FormData) {
       schema.safeParse(fd.get('name'));
     }`;
      expect(check(code)).toHaveLength(0);
    });

    it('globalThis.FormData qualified + safeParse — OK (TSQualifiedName, has safeParse so no error)', () => {
      const code = `export async function action(fd: globalThis.FormData) {
       schema.safeParse(Object.fromEntries(fd));
     }`;
      expect(check(code)).toHaveLength(0);
    });

    it('arrow function with FormData + safeParse — OK', () => {
      const code = `export const submit = async (formData: FormData) => {
       const result = schema.safeParse(Object.fromEntries(formData));
       return result;
     };`;
      expect(check(code)).toHaveLength(0);
    });

    it('safeParse in helper inside body — OK', () => {
      const code = `export async function action(formData: FormData) {
       const data = Object.fromEntries(formData);
       const parsed = userSchema.safeParse(data);
       return parsed.data;
     }`;
      expect(check(code)).toHaveLength(0);
    });
  });

  describe('PARITY: INVALID — declarative must produce ≥1 violation (main-case fixtures)', () => {
    it('named async FormData param, no safeParse', () => {
      const code = `export async function action(formData: FormData) {
        return formData.get('name');
      }`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('arrow FormData param, no safeParse', () => {
      const code = `export const submit = async (fd: FormData) => {
        const name = fd.get('name');
        return name;
      };`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('sync FormData param, no safeParse', () => {
      const code = `export function sync(formData: FormData) {
        const obj = Object.fromEntries(formData);
        return obj;
      }`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('multiple params incl FormData, no safeParse', () => {
      const code = `export async function action(input: string, fd: FormData) {
        return fd.get(input);
      }`;
      expect(check(code).length).toBeGreaterThan(0);
    });
  });

  describe('GAP: audit:exempt — NOT expressible in esquery (comment-based)', () => {
    it('audit:exempt on FormData param: declarative selector fires (FALSE POSITIVE — retention justification)', () => {
      // The handwritten rule reads the source line for 'audit:exempt' on the param
      // and suppresses the report. ESQuery cannot access comments — structurally inexpressible.
      // Evidence: the declarative selector fires on this fixture (1 violation),
      // while the handwritten rule correctly produces 0 errors.
      // Conclusion: R14 is RETAINED handwritten; audit:exempt is a documented gap.
      const code = `export async function action(formData: FormData /* audit:exempt */) {
       return formData.get('name');
     }`;
      const violations = check(code);
      // Asserts the gap EXISTS: selector fires (false positive) on an exempt fixture.
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});
