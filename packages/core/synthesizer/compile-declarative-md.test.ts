import { describe, expect, it } from 'vitest';
import { compileDeclarativeMd } from './compile-declarative-md.ts';
import type { SynthesizedRule } from './types.ts';

const rule = (): SynthesizedRule => ({
  id: 'G1',
  title: 'Forbid `.only` in test calls',
  stack: ['react-next'],
  check: {
    type: 'declarative',
    engine: 'eslint-restricted',
    selector: "CallExpression[callee.property.name='only']",
    message: 'remove .only — it silently disables sibling tests',
    presence: 'forbid',
  },
  examples: { bad: 'it.only(...)', good: 'it(...)' },
  research: { entryId: 'test-only-forbid-declarative', provenance: [] },
});

describe('compileDeclarativeMd — generate RULES.md fragment from a declarative spec', () => {
  it('renders a heading with the assigned id and title', () => {
    const md = compileDeclarativeMd(rule());
    expect(md).toContain('## G1 — Forbid `.only` in test calls');
  });

  it('includes the forbid message and selector (no handwritten template)', () => {
    const md = compileDeclarativeMd(rule());
    expect(md).toContain('remove .only — it silently disables sibling tests');
    expect(md).toContain("CallExpression[callee.property.name='only']");
  });

  it('marks the check as a declarative forbid', () => {
    const md = compileDeclarativeMd(rule());
    expect(md.toLowerCase()).toContain('forbid');
    expect(md).toContain('no-restricted-syntax');
  });

  it('throws on a non-declarative rule (guards misuse)', () => {
    const eslintRule = { ...rule(), check: { type: 'eslint' as const, rule: 'no-x' } };
    expect(() => compileDeclarativeMd(eslintRule)).toThrow();
  });
});
