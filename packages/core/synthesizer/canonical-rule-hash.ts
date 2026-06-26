// S4: deterministic content hash over a rule's identity-bearing fields.
// S5's anti-hand-edit gate imports THIS function (single source of truth) so
// the provenance hash emitted here and the hash recomputed at check-time agree.
// Hashes canonical (key-sorted) JSON of title + check + examples — stable
// against reformatting, sensitive to semantic edits.
import { createHash } from 'node:crypto';
import type { SynthesizedRule } from './types.ts';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = canonicalize((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

// Param is the identity sub-shape (not the full rule): emit.ts passes a whole
// SynthesizedRule (assignable), and S5's verifier passes a parsed-JSON manifest
// entry cast to this Pick — one hash function across emit + verify (SSOT).
export function canonicalRuleHash(
  rule: Pick<SynthesizedRule, 'title' | 'check' | 'examples'>,
): string {
  const identity = { title: rule.title, check: rule.check, examples: rule.examples };
  const json = JSON.stringify(canonicalize(identity));
  return createHash('sha256').update(json).digest('hex');
}
