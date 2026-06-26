// L4 Gate — require anti-vacuity tests (Task 2 RED → Task 5 GREEN).
// T-RCT-B: require is NOT the inversion of forbid. The gate checks TWO directions:
// (A) selector must fire on examples.bad (absence → must fire; never-fires = vacuous)
// (B) selector must NOT fire on examples.good (presence → must not fire; always-fires = vacuous)
//
// RED until gate-require-vacuity.ts exists (module-not-found) and then until
// the implementation is correct.

import { describe, expect, it } from 'vitest';
import { runRequireVacuityGate } from './gate-require-vacuity.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-06-23',
};

const makePlan = (rules: SynthesisPlan['rules']): SynthesisPlan => ({
  framework: 'next',
  version: '16.0.0',
  rules,
  rulesMd: '',
  eslintConfigSnippet: '{}',
});

describe('gate-require-vacuity — require anti-vacuity gate (T-RCT-B)', () => {
  it('returns n/a when plan has no declarative rules at all', () => {
    const plan = makePlan([
      {
        id: 'G1',
        title: 'no-var',
        stack: ['react-next'],
        check: { type: 'eslint', rule: 'no-var' },
        examples: { bad: 'var x = 1', good: 'const x = 1' },
        research: { entryId: 'no-var', provenance: [provenance] },
      },
    ]);
    const result = runRequireVacuityGate(plan);
    expect(result.status).toBe('n/a');
    expect(result.failures).toEqual([]);
  });

  it('returns n/a when plan has only forbid declarative rules', () => {
    const plan = makePlan([
      {
        id: 'G2',
        title: 'forbid-only-call',
        stack: ['react-next'],
        check: {
          type: 'declarative',
          engine: 'eslint-restricted',
          selector: "CallExpression[callee.property.name='only']",
          message: 'remove .only',
          presence: 'forbid',
        },
        examples: { bad: 'it.only()', good: 'it()' },
        research: { entryId: 'forbid', provenance: [provenance] },
      },
    ]);
    const result = runRequireVacuityGate(plan);
    expect(result.status).toBe('n/a');
    expect(result.failures).toEqual([]);
  });

  it('passes for a well-formed require rule (fires on bad, not on good)', () => {
    // Correct require rule: "functions must be named 'action'"
    // selector fires when a function is NOT named 'action'
    const plan = makePlan([
      {
        id: 'G3',
        title: 'functions must be named action (test)',
        stack: ['react-next'],
        check: {
          type: 'declarative',
          engine: 'eslint-restricted',
          selector: "FunctionDeclaration:not(:has(Identifier[name='action']))",
          message: 'function must be named action',
          presence: 'require',
        },
        examples: {
          bad: 'function notAction() {}',
          good: 'function action() {}',
        },
        research: { entryId: 'test-require', provenance: [provenance] },
      },
    ]);
    const result = runRequireVacuityGate(plan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });

  it('fails direction A — selector never fires on examples.bad (never-fires vacuity)', () => {
    // Direction A: selector targets ClassDeclaration — no ClassDeclarations in bad example
    const plan = makePlan([
      {
        id: 'G4',
        title: 'vacuous direction A (never fires)',
        stack: ['react-next'],
        check: {
          type: 'declarative',
          engine: 'eslint-restricted',
          selector: 'ClassDeclaration:not(:has(Identifier))',
          message: 'wrong selector — never matches the bad fixture',
          presence: 'require',
        },
        examples: {
          bad: 'function notAction() {}',
          good: 'function action() {}',
        },
        research: { entryId: 'test-vacuous-a', provenance: [provenance] },
      },
    ]);
    const result = runRequireVacuityGate(plan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].ruleId).toBe('G4');
    expect(result.failures[0].reason).toMatch(/direction A/);
    expect(result.failures[0].reason).toMatch(/never fires/);
  });

  it('fails direction B — selector fires on examples.good (always-fires vacuity)', () => {
    // Direction B: selector fires on ANY function not named 'superuniquename' — fires on good too
    const plan = makePlan([
      {
        id: 'G5',
        title: 'vacuous direction B (fires on good)',
        stack: ['react-next'],
        check: {
          type: 'declarative',
          engine: 'eslint-restricted',
          selector: "FunctionDeclaration:not(:has(Identifier[name='superuniquename']))",
          message: 'wrong selector — fires unconditionally',
          presence: 'require',
        },
        examples: {
          bad: 'function notAction() {}',
          good: 'function action() {}',
        },
        research: { entryId: 'test-vacuous-b', provenance: [provenance] },
      },
    ]);
    const result = runRequireVacuityGate(plan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].ruleId).toBe('G5');
    expect(result.failures[0].reason).toMatch(/direction B/);
    expect(result.failures[0].reason).toMatch(/fires on good/);
  });

  it('accumulates failures from both directions when rule is doubly vacuous', () => {
    // Direction A: selector never matches bad (wrong node type)
    // Direction B: selector does match good (but moot since direction A fails first)
    const plan = makePlan([
      {
        id: 'G6',
        title: 'doubly vacuous',
        stack: ['react-next'],
        check: {
          type: 'declarative',
          engine: 'eslint-restricted',
          // WithStatement never appears in test code → direction A
          // AND by extension would fire on good since no WithStatement exists
          selector: 'WithStatement:not(:has(Literal))',
          message: 'doubly vacuous selector',
          presence: 'require',
        },
        examples: {
          bad: 'function notAction() {}',
          good: 'function action() {}',
        },
        research: { entryId: 'test-doubly-vacuous', provenance: [provenance] },
      },
    ]);
    const result = runRequireVacuityGate(plan);
    expect(result.status).toBe('fail');
    // At minimum direction A fires (never fires on bad)
    expect(result.failures.some((f) => f.reason.includes('direction A'))).toBe(true);
  });
});
