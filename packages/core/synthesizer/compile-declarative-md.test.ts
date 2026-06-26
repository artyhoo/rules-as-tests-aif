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

  // RED Task 1: presence:'require' produces "require" wording, not "forbid"
  // Fails until Task 4 (compiler require branch) is implemented.
  it('[RED→GREEN] renders "require" wording for presence:require rules', () => {
    const requireRule: SynthesizedRule = {
      ...rule(),
      title: 'Async exports must have use-server (test)',
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: "FunctionDeclaration[async=true]:not(:has(Literal[value='use server']))",
        message: "async exports must include 'use server'",
        presence: 'require',
      },
    };
    const md = compileDeclarativeMd(requireRule);
    expect(md).toContain('require');
    expect(md).not.toContain('forbid');
  });

  it('[RED→GREEN] G3b switch — throws for unknown engine', () => {
    const unknownEngine: SynthesizedRule = {
      ...rule(),
      check: {
        type: 'declarative',
        engine: 'unknown-engine' as unknown as 'eslint-restricted',
        selector: 'Identifier',
        message: 'test',
        presence: 'forbid',
      },
    };
    expect(() => compileDeclarativeMd(unknownEngine)).toThrow(/Unsupported engine/);
  });
});
