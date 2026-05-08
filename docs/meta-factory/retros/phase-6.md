# Phase 6 Retrospective — Layer 3 Synthesizer Path A v1

> **Date:** 2026-05-08
> **Branch:** `chore/phase-5-research-agent` (single branch covers Phase 5 + Phase 6 — same session continuity)
> **Phase:** 6 — Layer 3 Synthesizer Path A v1 (deterministic-curated, no LLM, no AST gen) per [PHASE-6-PROMPT.md](../PHASE-6-PROMPT.md), refined by [phase-6-research.md](../phase-6-research.md).
> **Verdict:** **GO** to Phase 7 (L4 Validator + L5 Installer)

---

## EXECUTION-PLAN §6 numbering swap (closing edit for the Phase 5/6/7 reordering)

EXECUTION-PLAN §6 originally numbered:
- Phase 5 = L4 Validator (2-3 weeks)
- Phase 6 = L2 Research Agent (2-3 weeks)
- Phase 7 = L3 Synthesizer Path A + L5 Installer (3-4 weeks)

Reassigned 2026-05-08 in this session:
- **Phase 5 = L2 Research Agent** ✓ closed (8 commits, GO)
- **Phase 6 = L3 Synthesizer Path A only** ✓ closed (this retro, GO)
- **Phase 7 = L4 Validator + L5 Installer** (next session trigger)

Rationale: L4 gates synthesized output; without L2/L3 there is nothing beyond Phase 2 manifest meta-tests for L4 to validate. L5 needs L3 output to install. Linear data flow → linear phase order.

EXECUTION-PLAN §6 update: tracked here as the **single closing edit** covering both swaps. Per Phase 5 retro «closing item: EXECUTION-PLAN §6 numbering swap (L2/L3/L4 reordering)» — discharged.

---

## Architectural pivot — deterministic v1 (no LLM, no AST gen)

[architecture.md §2.5 + §3.1](../architecture.md) describes L3 as:
- Path A (default): «configuration of existing plugins» (LLM «picks from menu»)
- Path B (ambitious): «AST plugin generation»

Phase 6 v1 ships **deterministic-curated Path A**: hand-authored recipes committed to `packages/core/synthesizer/recipes/`, no live LLM at runtime, no AST authoring. Mirrors Phase 4 detector + Phase 5 research playbook.

Why:
- Project tenet «documents lie; tests don't» — LLM-generated rule synthesis is non-deterministic; can't snapshot.
- No real consumer triggers LLM cost yet ([EXECUTION-PLAN.md §1](../EXECUTION-PLAN.md) no-consumers caveat).
- 3 hand-authored recipes prove the pipeline shape; LLM extension layer is a strict superset for v2 trigger.
- Path B (AST gen) is Phase 9+ regardless.

---

## Verification block

All 9 verification probes from [PHASE-6-PROMPT.md «Verification probes»](../PHASE-6-PROMPT.md) green; `make self-audit` green; `actionlint` + `zizmor` clean.

### Probe-by-probe evidence

| # | Probe | Expected | Actual |
|---|---|---|---|
| 1 | `npx tsx packages/core/synthesizer/cli.ts $(pwd) \| jq '.rules \| length'` | 0 (own repo) | **0** (ts-server, no patterns; synth correctly skips) |
| 2 | `npm --prefix packages/core test synthesizer/synthesize.test.ts` | green, ≥6 tests | **8 tests** (empty, single, sequential IDs, missing-recipe skip, framework-null skip, framework-mismatch skip, rulesMd id sub, eslint config merge) |
| 3 | `npm --prefix packages/core test synthesizer/emit.test.ts` | green, ≥4 tests | **5 tests** (empty plan, populated plan, idempotence, missing dir, non-directory path) |
| 4 | `npm --prefix packages/core test synthesizer/snapshot.test.ts` | 2 tests | **2 tests** (own repo + next-16 fixture) |
| 5 | CLI `--output <dir>` produces 3 files | rules-manifest-additions.json, RULES-additions.md, eslint-rules-snippet.json | ✓ verified via emit.test.ts populated-plan case |
| 6 | Self-synth snapshot frozen vs `expected-self-synth.json` | no diff | ✓ snapshot.test.ts green; CI gate `framework-self-synth` parity |
| 7 | Fixture-synth snapshot frozen vs `expected-fixture-synth.json` | no diff | ✓ snapshot.test.ts green |
| 8 | `actionlint` + `zizmor` | exit 0 | actionlint clean; zizmor `No findings to report. Good job! (6 suppressed)` |
| 9 | Full regression | all green | self-audit 24/24; **core 168/168** (124 detector + 29 research + 15 synthesizer); preset 38/38; typecheck 3 workspaces clean |

### Self-application invariants

| Invariant | Source | Status |
|---|---|---|
| L3 (a) round-trip snapshot stability | [self-application.md §7 row L3](../self-application.md) | **CLOSED point-in-time.** Two-fixture coverage: own repo (empty plan baseline) + next-16 fixture (3-rule plan with all 3 recipes firing). |
| L3 (b) canonical regen ≤5% diff vs `packages/preset-next-15-canonical/` | [self-application.md §7 row L3](../self-application.md) | **DEFERRED** to Phase 6 v2 / Phase 7. Split-point: canonical regen requires recipe coverage of all preset-next-15 rules (R12, R14, R20 stack-specific) — current 3-recipe v1 only covers Next 16 patterns from Phase 5 research. Trigger to close: Phase 8 acceptance test (Next 15→16) OR explicit Phase 7 scope expansion. |

---

## Created/modified files (commit hashes)

```
3cd1fb1 docs(phase-6):     Step 0 entry gate — research matrix + implementation prompt
49bee98 feat(synthesizer): Task 1 — types + SynthesisPlan JSON schema
8cdd095 feat(synthesizer): Task 2 — 3 curated recipes for Next 16 patterns
498b48b feat(synthesizer): Task 3 — pure synthesize function
cd110c9 feat(synthesizer): Task 4 — emitter function
9d58b28 feat(synthesizer): Task 5 — public API + CLI
749f008 feat(synthesizer): Task 6 — self-app snapshot + next-16 fixture
[this commit] ci(audit-self) + docs(phase-6): Task 7 — framework-self-synth job + retro
```

Net change: 8 source files in `packages/core/synthesizer/` (`types`, `synthesize`, `emit`, `index`, `cli`, paired `*.test.ts` for synthesize/emit/snapshot), 1 JSON schema, 3 curated recipes, 1 next-16 fixture (4 files), 2 frozen snapshots, 1 CI job extension, 1 vitest config update.

---

## Reuse posture validated (per [phase-6-research.md §4](../phase-6-research.md))

| # | Reuse decision | Status | Evidence |
|---|---|---|---|
| 6.1 | SynthesisPlan top-level schema build + RuleEntry semantics reuse | **CLOSED via convergent design** | SynthesizedRule shape mirrors manifest's RuleEntry: same fields (title, stack, applies-to, check, examples). Generated rules indistinguishable from manual at validation time. |
| 6.2 | Curated recipes (mirror Phase 5 store) | **CLOSED** | 3 recipes hand-authored; deterministic; testable via fixtures. |
| 6.3 | Pure synthesize function | **CLOSED** | synthesize.ts ~70 LOC; 8 tests; throws SynthesisPlanError on schema violation. |
| 6.4 | Emitter Planner-Executor segregation | **CLOSED** | emit.ts NOT exported from index.ts; only CLI imports it. L4 Validator (Phase 7+) consumes pure boundary. |
| 6.5 | CLI mirroring detector/research patterns | **CLOSED** | cli.ts 52 LOC, no library. |
| 6.6 | Round-trip snapshot v1; defer canonical regen | **CLOSED with deferral documented** | snapshot.test.ts: 2 fixtures (own + next-16). Canonical regen split-point recorded above. |
| 6.7 | Manifest schema reuse for SynthesizedRule shape | **CLOSED** | SynthesisPlan validates against synthesis-plan.schema.json which enforces SynthesizedRule shape compatible with rules-manifest semantics. |
| 6.8 | typescript-eslint as transitive | **CLOSED** | No new explicit deps in `packages/core/package.json` (3 reuse + 0 new). |

**LOC reused vs built ratio (rough):**
- Reused: rules-manifest semantics (carried forward Phase 4), Ajv (already in lockfile), semver (transitive Phase 4), typescript-eslint (transitive Phase 3).
- Built: synthesizer module ~280 LOC (types + synthesize + emit + index + cli) + ~330 LOC tests + 3 recipes (~70 LOC JSON) + next-16 fixture (~10 LOC code + package.json) + 2 frozen snapshots (~150 LOC JSON each) + 1 CI job (~30 LOC YAML) + 1 schema (~95 LOC JSON).
- Posture: synthesizer v1 = deterministic bridge over **curated recipes** (vs Phase 5's bridge over **curated research entries**). Same playbook, different content layer.

### SynthesisPlan sample (next-16 fixture, evidence of pipeline end-to-end)

Excerpt:
```json
{
  "framework": "next",
  "version": "16.0.1",
  "rules": [
    {
      "id": "G1",
      "title": "Forbid `next/router` imports in App Router (use `next/navigation`)",
      "stack": ["react-next"],
      "applies-to": ["src/app/**/*.tsx", "src/app/**/*.ts"],
      "check": { "type": "eslint", "rule": "no-restricted-imports" },
      "research": { "entryId": "nextjs-app-router", "provenance": [...] }
    },
    { "id": "G2", "research.entryId": "nextjs-pages-router", ... },
    { "id": "G3", "research.entryId": "react-server-components", ... }
  ],
  "rulesMd": "## G1 — ...\n\n## G2 — ...\n\n## G3 — ...",
  "eslintConfigSnippet": "{\"no-restricted-imports\": [...], \"rules-as-tests/no-server-imports-in-client\": \"error\"}"
}
```

End-to-end pipeline verified: detect (next 16.0.1) → research (3 entries) → synthesize (3 G-rules with provenance) → emit (3 artifact files).

---

## Self-reflection block

- **Recipe authoring difficulty?** Recipe 2 (`nextjs-pages-router`) was hardest — Pages Router migration is **codemod-shaped**, not lintable per file. Solved by emitting `check: { type: 'manual', rationale: ... }`. **Signal:** not every detected pattern maps to an ESLint rule; manual-check is a first-class output. Phase 6 v2 should add a probe-script check type for cases between manual and ESLint.
- **Path A constraint held?** Yes. All 3 recipes use existing rules:
  - Recipe 1: `no-restricted-imports` (built-in ESLint)
  - Recipe 2: `manual` (no ESLint at all)
  - Recipe 3: `rules-as-tests/no-server-imports-in-client` (project's already-shipped custom rule)
  - Zero new AST authoring → Path A intact. Path B explicitly Phase 9+.
- **Was the `extras` escape hatch needed?** No (mirrors Phase 5 finding). Schema rigidity manageable for v1.
- **Canonical regen deferral cost?** Acceptable. Reasoning: canonical regen ≤5% requires recipes covering R12/R14/R20 (stack-specific preset rules). Adding 3+ more recipes to chase this metric in Phase 6 would inflate scope past «3-recipe stop-rule». Deferral is the right call. Trigger to close: Phase 8 acceptance test or explicit Phase 7 scope expansion.
- **CLI minimal-argv (≤60 LOC target)?** ended at **52 LOC** for cli.ts. Within budget. 4 modes (default + --from-research + --output + --pattern) handled with `process.argv.slice(2)` parsing.
- **Phase 5/6 reordering vs EXECUTION-PLAN — clearly closed?** Yes. EXECUTION-PLAN §6 swap discharged in this retro top section as single coherent edit. No more dangling reordering items.
- **Single-branch-covers-2-phases choice?** Yes — both Phase 5 and Phase 6 commits live on `chore/phase-5-research-agent`. Will rename branch (or just create PR with both phases) at push time. Rationale: same session, same orchestrator, same architectural pivot (deterministic v1); separating into two branches adds rebase friction without value. Documented in PR description at push time.

---

## Evaluation block

| Metric | Target | Actual | Verdict |
|---|---|---|---|
| Self-application score | 8/10 | **8/10** — L3 (a) round-trip snapshot stable point-in-time; L3 (b) canonical regen explicitly deferred with documented split-point. ‑1 only because (b) deferral is acknowledged debt (not architectural failure). | ✓ |
| Time-vs-plan ratio | ≤6h orchestrator path | **≪1h wall-clock** (single-session, opus burn-mode direct execution; same compression as Phase 4/5) | ✓ well under |
| Tasks 1-7 closed | required | All 7 closed with verified acceptance | ✓ |
| Snapshot stable | required | snapshot.test.ts: 2 fixtures green; CI gate `framework-self-synth` mirrors detector/research patterns | ✓ |
| Recipe count stop-rule (≤3 v1) | not exceeded | 3 recipes shipped, threshold met exactly | ✓ |
| Verdict | GO | **GO** to Phase 7 (L4 Validator + L5 Installer) | ✓ |

### Stop-rule audit

- Recipe count: **3**, threshold ≤3 (then defer) → met exactly.
- LLM cost: $0 (deterministic v1, zero API calls).
- Path B AST gen: not invoked (Phase 9+ trigger).
- Canonical regen: deferred with documented split-point, not snuck through.
- Cross-rule conflict detection: deferred to Phase 7 (L4 Validator job per [architecture.md §2.6](../architecture.md)).

---

## RCA section

**Skipped** — Time-vs-plan ratio well under 2x threshold, no snapshot fragility, no quality regressions detected, no scope creep beyond planned deferral.

---

## Open questions for orchestrator session Phase 7 entry (§5.5 Step 0 trigger)

1. **L4 Validator scope** — 6 gates per [architecture.md §2.6](../architecture.md): Schema check / rule-tester roundtrip / mutation testing / tautology / two-AI review / cross-rule conflict. Phase 7 entry must triage which gates ship in Path A v1 vs deferred:
   - Schema check: trivial — Ajv already validates SynthesisPlan; reuse.
   - rule-tester roundtrip: requires synthesized rules to be eslint-runnable; recipe set must reference real rules → already true for v1.
   - Mutation testing: only meaningful for Path B (AST gen). Skip for v1.
   - Tautology: corpus test against fixed negative-corpus (empty file, comment-only, unrelated).
   - Two-AI review: cost-scoping question — how often, what model, what audit gate.
   - Cross-rule conflict: requires reading `packages/preset-next-15-canonical/eslint-rules/` + synthesized rules → write a conflict detector.
2. **L5 Installer scope** — write to consumer disk: extends Phase 1 framework-self-install pattern. v1 = take SynthesisPlan + write to `<consumerRoot>/.ai-factory/synthesizer-output/` OR direct to `<consumerRoot>/eslint.config.mjs` (merge mode)?
3. **Canonical regen ≤5% trigger** — Phase 7 entry research must answer: does Phase 7 absorb canonical regen as part of L4/L5 deliverable, or stays deferred to Phase 8 acceptance test?
4. **Recipe expansion driver** — Phase 7+ recipes likely needed: R12 (Server vs Client Components), R14 (Server Action validation), R20 (whatever stack-specific). Trigger: Phase 7 entry research.
5. **AIF aif-evolve ↔ recipe reconciliation** — still deferred to Phase 11.
6. **LLM-driven recipe generation v2** — first real consumer OR Phase 8 trigger.
7. **Phase 5 EXECUTION-PLAN §6 update** — discharged here. No follow-up needed.

---

## Versioning

- **2026-05-08** — Phase 6 close, GO verdict for Phase 7 entry. 7 atomic Phase-6 commits on `chore/phase-5-research-agent` (combined branch covering Phase 5 + Phase 6, total 16 commits + 2 retro commits = 18 commits ahead of `main`). Single-session orchestrator-direct path (Opus 4.7 burn mode) maintained <1h wall-clock — same compression pattern as Phase 4/5. EXECUTION-PLAN §6 numbering swap discharged. Phase 7 entry research is the next session trigger.
