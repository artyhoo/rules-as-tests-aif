# S5 — anti-hand-edit gate (the sole-writer enforcer) — design

> **Authoritative for:** the S5 stage design of the generator-forbid-mvp umbrella — the provenance-verify model (recompute the canonical content-hash from the emitted manifest, compare to `provenance.json`), the CLI + CI wiring that mechanically reds on a hand-edit, and the explicit M1-self-consistency threat boundary.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Umbrella stage map + §0 decisions — see [`.claude/orchestrator-prompts/generator-forbid-mvp/kickoff.md`](../../../.claude/orchestrator-prompts/generator-forbid-mvp/kickoff.md). The hash function itself — see [`packages/core/synthesizer/canonical-rule-hash.ts`](../../../packages/core/synthesizer/canonical-rule-hash.ts) (S4, the single source of truth this gate imports). S4 emit/provenance model — see [`s4-forbid-compilation-design.md`](s4-forbid-compilation-design.md).

> **Stage:** S5 (final) of generator-forbid-mvp (depends on S4 #695, merged to staging). Acceptance source: umbrella kickoff §2 S5 row + §4 trap T-MVP-B.

## §1 Goal & scope

Make "the generator is the **sole writer** of emitted rule files" a **mechanical CI failure**, not a comment convention. S4 emitted `provenance.json` carrying a per-rule `contentHash = canonicalRuleHash(rule)`. S5 adds the **verifier** that recomputes that hash from the emitted manifest and **reds when a human hand-edited the generated rule content** without regenerating — closing umbrella kickoff §4 trap **T-MVP-B** ("sole-writer as a comment-convention, not a gate").

**In scope (S5-MVP, closes acceptance kickoff §2 S5 row):**

1. A reusable verifier `verify-provenance.ts`: given an emitted bundle dir (`rules-manifest-additions.json` + `provenance.json`), recompute `canonicalRuleHash` per rule from the manifest and compare to the recorded `contentHash`. Imports the S4 hash util — single source of truth.
2. A CLI `verify-provenance-cli.ts` (npm bin `rules-as-tests-verify-provenance` + script `verify:provenance`): exit 0 clean, exit 1 + `::error::` on any mismatch / structural tamper.
3. A **paired-negative** test: clean emit → verifier ok (green); hand-edited manifest → verifier reds (the **прогнанный отказ**, not "should").
4. CI wiring in `audit-self.yml`: a job that emits the S4 declarative fixture, verifies the clean output (exit 0), then corrupts the emitted manifest and asserts the verifier **exits non-zero** — a self-contained both-directions proof inside CI.

**Out of scope (explicit boundaries — T4 premature-close counter):**

- **Forging the hash (the "edit-both-consistently" attack) is OUT — by design, with a precedent.** S5 is a self-consistency checksum (M1): it detects a hand-edit of the rule **content** while `provenance.json` is left stale. An actor who edits the rule **and** recomputes/rewrites the matching hash in `provenance.json` defeats M1 — but that is equivalent to "regenerate the rule by hand", a different threat handled by regenerate-and-diff (M2, the L1–L5 self-application jobs) and, upstream, by signed manifests. This boundary is **identical to Atlas `atlas.sum`** (SSOT #172): `atlas migrate hash` re-blesses edits, so `atlas.sum` likewise does not stop a deliberate re-hash. The realistic threat this project exists to stop — an **AI agent silently hand-editing the generated rule file** — is exactly what M1 catches. Naming this is T4 (boundary stated, not silently skipped), not a weakness to paper over.
- **A committed emit-bundle fixture is OUT.** This is the framework-source repo; it ships no consumer emit-bundle. The CI job emits **fresh** and verifies — deliberately avoiding the S4 dual-consumer-drift trap (a committed on-disk bundle + an in-memory fixture diverging). The verifier is the reusable consumer-side capability; the proof is the in-CI emit→corrupt→red cycle + the vitest paired-negative.
- **Regenerate-from-source (M2) is OUT (already covered).** The `// DO NOT EDIT` + `go generate && git diff` family (buf `checknodiffgenerated`, ent's `generate` job — SSOT #172 notes) requires the **source recipe/research**, which a consumer does not have. S5's M1 verifier needs only the emitted bundle — that is the novel slice.

## §2 Forks resolved (decided on the merits, not by punting)

### §2.1 F1 — verifier home → `synthesizer/`, co-located with `emit` + the hash util

**Decision:** `packages/core/synthesizer/verify-provenance.ts`. **Why determinate:** the verifier operates on **emitted** artifacts (`emit.ts` output) and imports `canonicalRuleHash` (`synthesizer/canonical-rule-hash.ts`); both live in `synthesizer/`. The S3 anti-vacuity gates in `validator/` validate a pre-emit `SynthesisPlan` in memory — a different surface. Co-locating with `emit` keeps the emit/verify pair together (one writes the hash, one checks it).

### §2.2 F2 — verify model → recompute-from-manifest, not store-and-diff-bytes

**Decision:** recompute `canonicalRuleHash({title, check, examples})` from the emitted **manifest entry** and compare to `provenance.json.rules[id].contentHash`. **Why content-hash over raw-file-bytes** (inherited from S4 §2.2): the canonical hash is stable against reformatting/whitespace and still catches a semantic edit. A raw-byte file hash would red on a trivial `prettier` run — false positives that train maintainers to ignore the gate (`#trap-stated-but-not-enforced` inverse). The verifier checks **both directions**: every `provenance` id must have a matching manifest entry with a matching hash (catches content edits + rule deletion), and every manifest id must have a `provenance` entry (catches a rule **added** by hand). Plus a generated-marker integrity check (`generatedBy` + the "do not edit" `note`).

### §2.3 F3 — `canonicalRuleHash` signature → widen to `Pick<…>` (enables import-from-parsed-JSON, stays SSOT)

**Decision:** widen `canonicalRuleHash(rule: SynthesizedRule)` → `canonicalRuleHash(rule: Pick<SynthesizedRule, 'title' | 'check' | 'examples'>)`. **Why determinate:** the function already reads only those three fields; the verifier reconstructs them from parsed JSON (not a full `SynthesizedRule`). Widening the param is additive and behaviour-preserving — `emit.ts`'s `canonicalRuleHash(rule)` with a full `SynthesizedRule` still type-checks (`SynthesizedRule` is assignable to the `Pick`). This keeps **one** hash function across emit + verify (dual-implementation-discipline §7: one logic, not two drifting copies). Touching the S4 file is in-scope: S4 built the util explicitly "for S5 to import" (its header comment).

### §2.4 F4 — CI gate shape → emit-fresh + verify + corrupt-and-assert-red (self-contained both-directions proof)

**Decision:** a new `audit-self.yml` job emits the S4 declarative fixture to a temp dir, runs `verify:provenance` (assert exit 0), then mutates one rule field in the emitted manifest and re-runs `verify:provenance` (assert exit ≠ 0). **Why determinate:** the kickoff S5 acceptance is "ручная правка ... **механически** валит CI (прогнанный отказ, не «должно бы»)". A green-only smoke would prove reachability but not the **red** — the corrupt-and-assert-red step makes the failure path itself a passing CI assertion (T2/T3: a run + output, not "would"). The vitest paired-negative is the second channel (unit-level, runs in the Principles job).

## §3 Design

### §3.1 Verifier (component 1)

`verify-provenance.ts` exports:

```ts
export interface ProvenanceMismatch {
  ruleId: string;
  kind: 'content-hash-mismatch' | 'missing-in-manifest' | 'missing-in-provenance' | 'marker-stripped';
  expectedHash?: string;   // from provenance.json
  actualHash?: string;     // recomputed from the manifest
}
export interface VerifyResult { ok: boolean; rulesChecked: number; mismatches: ProvenanceMismatch[]; }
export function verifyProvenance(bundleDir: string): VerifyResult;
```

- Missing/unparseable `provenance.json` or `rules-manifest-additions.json` → throw `ProvenanceVerifyError` (a deleted provenance file is itself a tamper — the CLI maps it to exit 1).
- `marker-stripped`: `provenance.generatedBy !== 'rules-as-tests-synth'` or the `note` no longer contains `do not edit` → flag (the marker is part of what must not be hand-removed).
- For each provenance rule id: recompute the hash from `manifest[id]` (a small runtime guard extracts `{title, check, examples}`); compare.

### §3.2 CLI (component 2)

`verify-provenance-cli.ts` (`#!/usr/bin/env -S npx tsx`): `argv[2]` = bundle dir; runs `verifyProvenance`; on `ok` → print `verify-provenance: OK (<n> rules)` exit 0; on mismatch/throw → `process.stderr` `::error::` lines listing each mismatch, exit 1. Wired as bin `rules-as-tests-verify-provenance` + script `verify:provenance` in `packages/core/package.json`.

### §3.3 CI job (component 3)

`audit-self.yml` job "Provenance v1 — anti-hand-edit gate (S5)":
1. `synth --from-research synthesizer/fixtures/s4-declarative-research-plan.json --output "$TMP"`.
2. `verify:provenance -- "$TMP"` → assert exit 0.
3. Corrupt: rewrite one `check`/`examples` field in `$TMP/rules-manifest-additions.json` (jq), leaving `provenance.json` stale.
4. `verify:provenance -- "$TMP"` → assert exit ≠ 0; if it exits 0, `::error::` + fail the job ("gate failed to detect a hand-edit").

## §4 Testing (TDD — failing test first, kickoff §5)

| Component | Failing test first | Goes green when |
|---|---|---|
| verifier — clean | emit declarative bundle → `verifyProvenance(dir).ok` is `false` (no verifier) | `verifyProvenance` returns `ok: true`, `rulesChecked ≥ 1` |
| verifier — hand-edit (paired-negative) | mutate a rule field in the emitted manifest → expect `ok:false` but no gate exists | mutated manifest → `ok:false` + `content-hash-mismatch` for that id |
| verifier — added rule | inject a rule into the manifest absent from provenance → expect red | `missing-in-provenance` mismatch |
| verifier — marker stripped | delete the `do not edit` note → expect red | `marker-stripped` mismatch |
| CLI | `verify:provenance` over a corrupted bundle exits 0 (no CLI) | exits 1 + `::error::` |

`tsc --noEmit` (whole workspace) before push — S4 lesson: tsx/vitest do not type-check strictly; the `Pick` widening must not break `emit.ts`. Reproduce the on-disk-fixture CI path locally (`npm run synth … --output … && npm run verify:provenance -- …`) — vitest alone does not cover the audit-self.yml job (S4 dual-consumer-drift lesson).

## §5 Self-application (T15) + active traps

- **T15:** S5 **is** recursive self-application — the framework's thesis ("every rule is an executable artifact failing at the earliest reachable channel") applied to the generator's **own** output: the "sole-writer" rule becomes an executable gate, not prose.
- **T-MVP-B** (the named target): "sole writer" stops being a `// DO NOT EDIT` comment and becomes a CI red on hand-edit (§3.3 + paired-negative).
- **T2/T3** (designing ≠ running): every "reds on hand-edit" claim carries a command + output (the §3.3 corrupt-and-assert-red step + the paired-negative).
- **T4** (premature close): the M1 forge-the-hash boundary is **named** (§1 OUT), not silently skipped; M2 coverage cross-referenced.
- **T14** (clean ≠ no-theatre): the gate ships **with** its paired-negative — a gate with no negative test is itself a vacuity.
- **T16** (pattern-match on name): we ADAPT the Atlas `atlas.sum` **pattern**, we do **not** depend on `atlas` (Go/SQL-migration tool — wrong problem-class for a TS ESLint-rule bundle). Problem class: Atlas = SQL migration directory integrity; ours = emitted ESLint-rule-bundle identity-hash, consumer-side, zero dep. Match on the *mechanism* (per-file checksum + verify verb + CI), not the *domain*.

## §6 Capability-commit discipline + Prior-art

`verify-provenance.ts` is a new file ≥80 LOC under `packages/` → **capability commit**. `Prior-art:` trailer references **SSOT #172**.

- **SSOT #172 (new):** Atlas `atlas.sum` migration-integrity checksum (ariga/atlas, consumed by ent/ent) + `buf checknodiffgenerated` (bufbuild/buf). **Verdict: ADAPT** the `atlas.sum` sum-file-verify pattern (per-rule checksum + a `validate` verb + CI wiring + a `hash`/regenerate re-bless escape) for the ESLint-rule-bundle domain; **BUILD** the implementation (no upstream lib serves the TS/ESLint-rule-bundle problem-class; adopting `atlas` itself = T16). **Zero new dependency** — stdlib `node:crypto` via the S4 `canonical-rule-hash.ts`. Evidence: DeepWiki `ent/ent`+`bufbuild/buf` probe 2026-06-23 (atlas.sum embeds per-migration checksum + `atlas migrate validate` reds on hand-edit; buf relies on regenerate-and-`git diff`). WebSearch ≥3 phrasings confirmed the general content-hash-tamper-detection pattern is standard (stdlib crypto) with no reusable lib for "verify an emitted rule bundle against its own embedded provenance hash, consumer-side". **Falsifier:** a maintained npm package that, given a generated artifact + an embedded content-hash, verifies it consumer-side without the source generator → would flip BUILD→ADOPT.

## §7 Acceptance (mirrors umbrella kickoff §2 S5 row + §5 TDD obligation)

- A hand-edit of an emitted generated file **mechanically** reds CI (a run, not "should bе"). ✔ via §3.3 corrupt-and-assert-red + §4 paired-negative.
- The gate imports the S4 `canonicalRuleHash` — one hash function, emit + verify agree. ✔ via §2.3.
- TDD: hand-edit **passes** first (red — no gate) → add verifier → **rejected**. ✔ via §4 row 2.
- Deterministic, zero paid LLM, zero new dependency. ✔ via §6.

## §8 See also

- [`.claude/orchestrator-prompts/generator-forbid-mvp/kickoff.md`](../../../.claude/orchestrator-prompts/generator-forbid-mvp/kickoff.md) — umbrella stage map (S5 row), §4 traps (T-MVP-B).
- [`s4-forbid-compilation-design.md`](s4-forbid-compilation-design.md) — S4 emit + provenance model this gate verifies.
- [`packages/core/synthesizer/canonical-rule-hash.ts`](../../../packages/core/synthesizer/canonical-rule-hash.ts) — the single-source-of-truth hash the gate imports.
- [`packages/core/synthesizer/emit.ts`](../../../packages/core/synthesizer/emit.ts) — writes `provenance.json` (S4); the gate's input.
- [docs/meta-factory/prior-art-evaluations.md #172](../../prior-art-evaluations.md) — SSOT: Atlas `atlas.sum` ADAPT + bare implementation BUILD.
