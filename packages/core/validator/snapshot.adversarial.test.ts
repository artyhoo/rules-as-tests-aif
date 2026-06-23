// T4 — Aggregate validator snapshots for adversarial fixtures.
// Calls validate(badPlan) and compares the full ValidationReport to a
// frozen expected-adv-*.json — confirms the aggregator routes ok:false and
// the right gate to 'fail'. Mirrors the snapshot.test.ts pattern for
// self + next-16 fixture; only new adversarial snapshots are added here.
// DO NOT touch expected-self-validate.json or expected-fixture-validate.json.
// Gates 7-9 (anti-vacuity cluster): single-token-diff, messageId-coverage,
// autofix-clean adversarial snapshots added at bottom of describe block.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SynthesisPlan } from '../synthesizer/types.ts';
import { validate } from './validate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

// Adversarial fixture 1 (Gate 4): no-restricted-imports forbidding 'react'.
// unrelated.tsx in the negative corpus imports react → Gate 4 rejects.
// Gate 2 passes (negative-test input imports react, triggering the rule).
const tautologyBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G99',
      title: 'adversarial-tautology-no-react',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-restricted-imports' },
      examples: { bad: 'import x from "react"', good: '// nothing imported' },
      'negative-test': {
        input: ['import x from "react"'],
        'expect-violation': 'no-restricted-imports',
      },
      research: { entryId: 'adv-taut', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-imports': [
      'error',
      { paths: [{ name: 'react', message: 'tautology-test' }] },
    ],
  }),
};

// Adversarial fixture 2 (Gate 2): negative-test.input is a comment that
// never triggers no-restricted-imports → Gate 2 rejects.
// Gate 4 passes (lodash is not in the negative corpus).
const neverFiringBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G97',
      title: 'adversarial-never-firing',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-restricted-imports' },
      examples: { bad: 'import _ from "lodash"', good: 'import _ from "lodash-es"' },
      'negative-test': {
        input: ['// no imports here — this input never triggers the rule'],
        'expect-violation': 'no-restricted-imports',
      },
      research: { entryId: 'adv-never-fire', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-imports': [
      'error',
      { paths: [{ name: 'lodash', message: 'use lodash-es' }] },
    ],
  }),
};

// Adversarial fixture 3 (Gate 6 snippet-drop): no-debugger rule present in
// plan but absent from eslintConfigSnippet → Gate 6 rejects.
// Gate 2 passes (debugger statement fires no-debugger via fallback 'error').
// Gate 4 passes (no corpus file has debugger statements).
const snippetDropBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G95',
      title: 'adversarial-snippet-drop',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-debugger' },
      examples: { bad: 'debugger;', good: '// no debugger here' },
      'negative-test': {
        input: ['debugger;'],
        'expect-violation': 'no-debugger',
      },
      research: { entryId: 'adv-snippet-drop', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: '{}',
};

describe('validator adversarial snapshots', () => {
  it('tautology plan: ok=false, Gate 4 fail, matches expected-adv-tautology-validate.json', () => {
    const report = validate(tautologyBadPlan);
    const expected = JSON.parse(
      readFileSync(resolve(HERE, 'expected-adv-tautology-validate.json'), 'utf8'),
    );
    expect(report).toEqual(expected);
  });

  it('never-firing plan: ok=false, Gate 2 fail, matches expected-adv-never-firing-validate.json', () => {
    const report = validate(neverFiringBadPlan);
    const expected = JSON.parse(
      readFileSync(resolve(HERE, 'expected-adv-never-firing-validate.json'), 'utf8'),
    );
    expect(report).toEqual(expected);
  });

  it('snippet-drop plan: ok=false, Gate 6 fail, matches expected-adv-snippet-drop-validate.json', () => {
    const report = validate(snippetDropBadPlan);
    const expected = JSON.parse(
      readFileSync(resolve(HERE, 'expected-adv-snippet-drop-validate.json'), 'utf8'),
    );
    expect(report).toEqual(expected);
  });

  it('single-token-diff plan: ok=false, Gate 7 fail, matches expected-adv-single-token-diff-validate.json', () => {
    const singleTokenDiffBadPlan: SynthesisPlan = {
      framework: 'next', version: '16.0.0',
      rules: [{
        id: 'G91', title: 'adversarial-single-token-diff-bad', stack: ['react-next'],
        check: { type: 'declarative', engine: 'eslint-restricted', selector: 'FunctionDeclaration[generator=true]', message: 'No generator functions allowed', presence: 'forbid' },
        examples: { bad: 'const a = 1; const b = 2; const c = 3; function* gen() { yield a + b + c; }', good: '// no generators here' },
        'negative-test': { input: ['function* gen() { yield 1; }'], 'expect-violation': 'no-restricted-syntax' },
        research: { entryId: 'adv-std-bad', provenance: [provenance] },
      }],
      rulesMd: '',
      eslintConfigSnippet: JSON.stringify({ 'no-restricted-syntax': ['error', { selector: 'FunctionDeclaration[generator=true]', message: 'No generator functions allowed' }] }),
    };
    const report = validate(singleTokenDiffBadPlan);
    const expected = JSON.parse(
      readFileSync(resolve(HERE, 'expected-adv-single-token-diff-validate.json'), 'utf8'),
    );
    expect(report).toEqual(expected);
  });

  it('messageId-coverage plan: ok=false, Gate 8 fail, matches expected-adv-message-id-coverage-validate.json', () => {
    const messageIdCoverageBadPlan: SynthesisPlan = {
      framework: 'next', version: '16.0.0',
      rules: [{
        id: 'G89', title: 'adversarial-messageId-coverage-bad', stack: ['react-next'],
        check: { type: 'declarative', engine: 'eslint-restricted', selector: 'FunctionDeclaration[generator=true]', message: 'Do not use generators', presence: 'forbid' },
        examples: { bad: 'function* gen() { return 1; }', good: 'function gen() { return 1; }' },
        'negative-test': { input: ['function* gen() { yield 1; }'], 'expect-violation': 'no-restricted-syntax' },
        research: { entryId: 'adv-mic-bad', provenance: [provenance] },
      }],
      rulesMd: '',
      eslintConfigSnippet: JSON.stringify({ 'no-restricted-syntax': ['error', { selector: 'FunctionDeclaration[generator=true]', message: 'No generators!' }] }),
    };
    const report = validate(messageIdCoverageBadPlan);
    const expected = JSON.parse(
      readFileSync(resolve(HERE, 'expected-adv-message-id-coverage-validate.json'), 'utf8'),
    );
    expect(report).toEqual(expected);
  });

  it('autofix-clean plan: ok=false, Gate 9 fail, matches expected-adv-autofix-clean-validate.json', () => {
    const autofixCleanBadPlan: SynthesisPlan = {
      framework: 'next', version: '16.0.0',
      rules: [{
        id: 'G87', title: 'adversarial-autofix-clean-bad', stack: ['react-next'],
        check: { type: 'eslint', rule: 'no-extra-parens' },
        examples: { bad: '((x))', good: 'x' },
        'negative-test': { input: ['((x))'], 'expect-violation': 'no-extra-parens' },
        research: { entryId: 'adv-afc-bad', provenance: [provenance] },
      }],
      rulesMd: '',
      eslintConfigSnippet: JSON.stringify({ 'no-extra-parens': 'error' }),
    };
    const report = validate(autofixCleanBadPlan);
    const expected = JSON.parse(
      readFileSync(resolve(HERE, 'expected-adv-autofix-clean-validate.json'), 'utf8'),
    );
    expect(report).toEqual(expected);
  });
});
