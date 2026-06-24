// Fixture-parity harness for require-use-server-directive (R20) declarative migration.
// Runs all existing inline fixtures from require-use-server-directive.test.ts against the
// declarative no-restricted-syntax selector in next-r20-require-use-server-directive.json.
//
// Result: PARTIAL PARITY — main-case fixtures match; per-line audit:exempt exemption
// is NOT expressible in esquery (comment-based). R20 is RETAINED handwritten.
// The GAP block below is the evidence (T3 — parity table with quoted output).

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';

// Selector from the declarative migration attempt (R20 retained handwritten — recipe reverted to type:"eslint").
// Kept here as standalone gap-documentation: esquery covers the main case but cannot handle audit:exempt.
const selector: string =
  `Program:not(Program:has(ExpressionStatement:first-child > Literal[value='use server'])) ExportNamedDeclaration > FunctionDeclaration[async=true], Program:not(Program:has(ExpressionStatement:first-child > Literal[value='use server'])) ExportDefaultDeclaration > FunctionDeclaration[async=true]`;
const message: string | undefined =
  `Server Action file must start with 'use server' directive at the top of the file (R20).`;

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

describe('require-use-server-directive declarative parity (selector from next-r20-require-use-server-directive.json)', () => {
  describe('PARITY: VALID — declarative must produce 0 violations (main-case fixtures)', () => {
    it('sync export — rule does not apply', () => {
      expect(check(`export function sync() { return 1; }`)).toHaveLength(0);
    });

    it("'use server' + named async export — OK", () => {
      expect(check(`'use server';\nexport async function action() { return 1; }`)).toHaveLength(0);
    });

    it('"use server" double-quoted — OK', () => {
      expect(check(`"use server";\nexport async function action() { return 1; }`)).toHaveLength(0);
    });

    it("'use server' + default async export — OK", () => {
      expect(check(`'use server';\nexport default async function action() { return 1; }`)).toHaveLength(0);
    });

    it("'use server' + multiple async exports — OK", () => {
      const code = `'use server';
     export async function a() { return 1; }
     export async function b() { return 2; }`;
      expect(check(code)).toHaveLength(0);
    });

    it('only sync export — rule does not apply', () => {
      expect(check(`export const value = 42;`)).toHaveLength(0);
    });

    it('non-exported async function — does not apply', () => {
      const code = `async function helper() { return 1; }
     export const x = 1;`;
      expect(check(code)).toHaveLength(0);
    });
  });

  describe('PARITY: INVALID — declarative must produce ≥1 violation (main-case fixtures)', () => {
    it('named async export without use server', () => {
      expect(check(`export async function action() { return 1; }`).length).toBeGreaterThan(0);
    });

    it('import + named async export without use server', () => {
      const code = `import { db } from './db';
export async function action() { return db.q(); }`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('directive not first statement — does not count', () => {
      const code = `import './side-effect';
'use server';
export async function action() { return 1; }`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('non-string-literal first statement', () => {
      const code = `const x = 1;
export async function action() { return 1; }`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('default export without use server', () => {
      expect(check(`export default async function action() { return 1; }`).length).toBeGreaterThan(0);
    });
  });

  describe('GAP: audit:exempt — NOT expressible in esquery (comment-based)', () => {
    it('audit:exempt on async export line: declarative selector fires (FALSE POSITIVE — retention justification)', () => {
      // The handwritten rule reads the source line for '// audit:exempt' and suppresses
      // the report. ESQuery cannot access comments — this is structurally inexpressible.
      // Evidence: the declarative selector fires on this fixture (1 violation),
      // while the handwritten rule correctly produces 0 errors.
      // Conclusion: R20 is RETAINED handwritten; audit:exempt is a documented gap.
      const code = `export async function action() { return 1; } // audit:exempt`;
      const violations = check(code);
      // Asserts the gap EXISTS: selector fires (false positive) on an exempt fixture.
      expect(violations.length).toBeGreaterThan(0);
    });

    it('multiple violations — one per export (multi-export case)', () => {
      const code = `export async function a() { return 1; }
export async function b() { return 2; }`;
      // Two exports, each fires — consistent with handwritten rule behavior.
      expect(check(code).length).toBeGreaterThanOrEqual(2);
    });
  });
});
