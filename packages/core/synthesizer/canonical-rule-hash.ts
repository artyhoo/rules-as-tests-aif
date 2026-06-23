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

export function canonicalRuleHash(rule: SynthesizedRule): string {
  const identity = { title: rule.title, check: rule.check, examples: rule.examples };
  const json = JSON.stringify(canonicalize(identity));
  return createHash('sha256').update(json).digest('hex');
}
