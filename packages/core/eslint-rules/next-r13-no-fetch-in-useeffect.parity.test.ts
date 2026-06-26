// Parity test for R13 (data-fetching pattern) declarative recipe — NARROW scope.
// Forbids bare fetch() inside a useEffect callback (fetch-in-useEffect only).
// Broad TanStack/SWR-without-validation coverage = future follow-up.
// Gate 7 (single-token-diff) + rule-tester anti-vacuity verified inline.

import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const recipe = JSON.parse(
  readFileSync(resolve(HERE, '../synthesizer/recipes/next-r13-no-fetch-in-useeffect.json'), 'utf8'),
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
  return linter.verify(code, config, { filename: 'test.tsx' }).filter((m) => m.ruleId === 'no-restricted-syntax');
}

describe('R13 no-fetch-in-useeffect declarative parity (selector from next-r13-no-fetch-in-useeffect.json)', () => {
  describe('VALID — no bare fetch() inside useEffect; must produce 0 violations', () => {
    it('useEffect calling loadData() (recipe examples.good)', () => {
      expect(check(`useEffect(() => { loadData(); }, []);`)).toHaveLength(0);
    });

    it('useQuery with fetch inside queryFn is not flagged (not inside useEffect)', () => {
      const code = `useQuery({ queryKey: ['orders'], queryFn: () => fetch('/api/orders') });`;
      expect(check(code)).toHaveLength(0);
    });

    it('fetch() at module top-level is not flagged', () => {
      expect(check(`fetch('/api/init');`)).toHaveLength(0);
    });

    it('useEffect with no fetch call is not flagged', () => {
      expect(check(`useEffect(() => { setLoading(true); }, []);`)).toHaveLength(0);
    });
  });

  describe('INVALID — bare fetch() inside useEffect; must produce ≥1 violation', () => {
    it('useEffect arrow callback with fetch() (recipe examples.bad)', () => {
      expect(check(`useEffect(() => { fetch(url); }, []);`).length).toBeGreaterThan(0);
    });

    it('useEffect function expression with fetch()', () => {
      expect(check(`useEffect(function() { fetch('/api/data'); }, []);`).length).toBeGreaterThan(0);
    });

    it('useEffect with fetch inside nested arrow', () => {
      const code = `useEffect(() => {
  const load = () => fetch('/api/orders');
  load();
}, []);`;
      expect(check(code).length).toBeGreaterThan(0);
    });

    it('negative-test inputs from recipe both produce violations', () => {
      for (const input of recipe.rule['negative-test'].input) {
        expect(check(input as string).length, `Expected violation for: ${input}`).toBeGreaterThan(0);
      }
    });
  });
});
