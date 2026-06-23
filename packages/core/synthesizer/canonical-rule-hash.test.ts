import { describe, expect, it } from 'vitest';
import { canonicalRuleHash } from './canonical-rule-hash.ts';
import type { SynthesizedRule } from './types.ts';

const rule = (selector: string): SynthesizedRule => ({
  id: 'G1',
  title: 'T',
  stack: ['react-next'],
  check: { type: 'declarative', engine: 'eslint-restricted', selector, message: 'm', presence: 'forbid' },
  examples: { bad: 'a', good: 'b' },
  research: { entryId: 'x', provenance: [] },
});

describe('canonicalRuleHash — deterministic content hash for provenance', () => {
  it('is stable across calls for identical content', () => {
    expect(canonicalRuleHash(rule('S'))).toBe(canonicalRuleHash(rule('S')));
  });

  it('is a 64-char hex sha256', () => {
    expect(canonicalRuleHash(rule('S'))).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when identity-bearing content changes', () => {
    expect(canonicalRuleHash(rule('S1'))).not.toBe(canonicalRuleHash(rule('S2')));
  });

  it('ignores key order in nested objects (canonical)', () => {
    const a: SynthesizedRule = rule('S');
    const b: SynthesizedRule = {
      ...rule('S'),
      examples: { good: 'b', bad: 'a' },
    };
    expect(canonicalRuleHash(a)).toBe(canonicalRuleHash(b));
  });
});
