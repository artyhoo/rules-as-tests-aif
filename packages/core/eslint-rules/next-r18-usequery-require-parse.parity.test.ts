// Parity test for R18 (TanStack Query validation) declarative recipe.
// Verifies: selector fires on queryFn WITHOUT .parse()/.safeParse() (bad),
// and does NOT fire on queryFn WITH .parse()/.safeParse() (good).
// Gate 10 (require-vacuity) direction A + B validated inline.

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const recipe = JSON.parse(
  readFileSync(resolve(HERE, '../synthesizer/recipes/next-r18-usequery-require-parse.json'), 'utf8'),
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

describe('R18 usequery-require-parse declarative parity (selector from next-r18-usequery-require-parse.json)', () => {
  describe('VALID — queryFn has .parse() or .safeParse(); must produce 0 violations', () => {
    it('queryFn calls schema.parse()', () => {
      expect(check(`useQuery({ queryFn: () => schema.parse(fetchData()) })`)).toHaveLength(0);
    });

    it('queryFn calls schema.safeParse()', () => {
      expect(check(`useQuery({ queryFn: () => schema.safeParse(fetchData()) })`)).toHaveLength(0);
    });

    it('queryFn calls parse on async fetch result', () => {
      const code = `useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    const res = await fetch('/api/orders');
    return OrderSchema.parse(await res.json());
  },
});`;
      expect(check(code)).toHaveLength(0);
    });

    it('queryFn validates point-free via `.then(Schema.parse)` (regression lock: a parse REFERENCE passed as a callback, not a parse() call)', () => {
      // Locks the broadened selector (MemberExpression, not CallExpression-only).
      // Under the original narrow selector this idiomatic compliant form was a
      // false positive — the guard-liveness inconsistency surfaced by PR #711.
      expect(
        check(`useQuery({ queryFn: () => fetch('/api/orders').then(r => r.json()).then(OrderSchema.parse) })`),
      ).toHaveLength(0);
    });

    it('non-queryFn arrow function is not flagged', () => {
      expect(check(`const fn = () => fetchData();`)).toHaveLength(0);
    });

    it('object property named differently is not flagged', () => {
      expect(check(`useQuery({ fetcher: () => fetchData() })`)).toHaveLength(0);
    });
  });

  describe('INVALID — queryFn lacks .parse() or .safeParse(); must produce ≥1 violation', () => {
    it('queryFn arrow returning raw fetchData() (recipe examples.bad)', () => {
      expect(check(`useQuery({ queryFn: () => fetchData() })`).length).toBeGreaterThan(0);
    });

    it('queryFn async arrow returning response.json() without parse', () => {
      const code = `useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    const res = await fetch('/api/orders');
    return res.json();
  },
});`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('mutant-killer: .parseAsync is not in the allowed list', () => {
      expect(check(`useQuery({ queryFn: () => schema.parseAsync(fetchData()) })`).length).toBeGreaterThan(0);
    });
  });
});
