// S5: anti-hand-edit gate — the generator is the SOLE writer of emitted rule
// files. Recomputes canonicalRuleHash from the EMITTED manifest and compares to
// the contentHash recorded in provenance.json (S4). A mismatch = the generated
// rule content was hand-edited after emission. Makes umbrella kickoff §4 trap
// T-MVP-B ("sole writer as a comment-convention") a mechanical CI failure.
//
// ADAPTs the Atlas `atlas.sum` migration-integrity pattern (SSOT #172): per-rule
// checksum + a verify verb + CI wiring. Self-consistency (M1) only — an actor who
// edits BOTH the rule and its recorded hash defeats it, exactly as `atlas migrate
// hash` re-blesses edits; that "regenerate by hand" threat is M2's (regen + diff,
// the L1–L5 self-application jobs). The realistic threat here — an agent silently
// hand-editing a generated file — is what this catches. Imports the S4 hash util
// (single source of truth); zero new dependency (stdlib crypto).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalRuleHash } from './canonical-rule-hash.ts';
import type { SynthesizedRule } from './types.ts';

const MANIFEST_FILE = 'rules-manifest-additions.json';
const PROVENANCE_FILE = 'provenance.json';
const GENERATED_BY = 'rules-as-tests-synth';
const MARKER = 'do not edit';

export class ProvenanceVerifyError extends Error {
  constructor(
    public readonly path: string,
    reason: string,
  ) {
    super(`Cannot verify provenance at ${path}: ${reason}`);
    this.name = 'ProvenanceVerifyError';
  }
}

export type ProvenanceMismatchKind =
  | 'content-hash-mismatch'
  | 'missing-in-manifest'
  | 'missing-in-provenance'
  | 'marker-stripped';

export interface ProvenanceMismatch {
  ruleId: string;
  kind: ProvenanceMismatchKind;
  expectedHash?: string;
  actualHash?: string;
}

export interface VerifyResult {
  ok: boolean;
  /** Number of rules recorded in provenance.json that were checked. */
  rulesChecked: number;
  mismatches: ProvenanceMismatch[];
}

function readJsonObject(path: string): Record<string, unknown> {
  if (!existsSync(path)) {
    throw new ProvenanceVerifyError(path, 'file not found (was it deleted?)');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new ProvenanceVerifyError(path, `not valid JSON: ${(err as Error).message}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ProvenanceVerifyError(path, 'expected a JSON object at the top level');
  }
  return parsed as Record<string, unknown>;
}

type RuleIdentity = Pick<SynthesizedRule, 'title' | 'check' | 'examples'>;

/**
 * Verify that every rule in an emitted bundle still matches the content-hash
 * recorded in its provenance.json — i.e. no generated rule file was hand-edited.
 *
 * @param bundleDir directory holding `rules-manifest-additions.json` + `provenance.json`
 * @throws ProvenanceVerifyError on a missing / unparseable provenance or manifest file
 */
export function verifyProvenance(bundleDir: string): VerifyResult {
  const dir = resolve(bundleDir);
  const provenance = readJsonObject(resolve(dir, PROVENANCE_FILE));
  const manifest = readJsonObject(resolve(dir, MANIFEST_FILE));

  const mismatches: ProvenanceMismatch[] = [];

  // Generated-marker integrity: the "do not edit" marker is itself part of what
  // a hand-edit must not strip (deleting it would otherwise mute the warning).
  const note = typeof provenance['note'] === 'string' ? provenance['note'] : '';
  if (provenance['generatedBy'] !== GENERATED_BY || !note.toLowerCase().includes(MARKER)) {
    mismatches.push({ ruleId: '(bundle)', kind: 'marker-stripped' });
  }

  const provRules = (
    typeof provenance['rules'] === 'object' && provenance['rules'] !== null
      ? provenance['rules']
      : {}
  ) as Record<string, { contentHash?: string }>;
  const provIds = Object.keys(provRules);

  // provenance → manifest: every recorded rule must be present + hash-matching.
  for (const id of provIds) {
    const expectedHash = provRules[id]?.contentHash;
    if (!(id in manifest)) {
      mismatches.push({ ruleId: id, kind: 'missing-in-manifest', expectedHash });
      continue;
    }
    // canonicalRuleHash reads only title/check/examples — extra manifest fields
    // (stack, research, …) are ignored, so the whole entry is safe to pass.
    const actualHash = canonicalRuleHash(manifest[id] as RuleIdentity);
    if (actualHash !== expectedHash) {
      mismatches.push({ ruleId: id, kind: 'content-hash-mismatch', expectedHash, actualHash });
    }
  }

  // manifest → provenance: a rule added by hand has no provenance entry.
  for (const id of Object.keys(manifest)) {
    if (!(id in provRules)) {
      mismatches.push({ ruleId: id, kind: 'missing-in-provenance' });
    }
  }

  return { ok: mismatches.length === 0, rulesChecked: provIds.length, mismatches };
}
