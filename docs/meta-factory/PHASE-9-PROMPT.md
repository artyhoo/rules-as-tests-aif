# Phase 9 Implementation Prompt — deterministic housekeeping + Phase 11.1 closure tail

> **Назначение:** self-contained prompt для Phase 9 implementation orchestrator session. Output = 4 BUILD areas merged on `main` per [phase-9-entry-research.md §5](phase-9-entry-research.md): A6 recipe duplication policy, A7 `next/any/` resolution tier, A8 glob-overlap calibration corpus, A9 AIF GATE-RESULT-CONTRACT.md schema validation.
> **Версия:** 1.0.0 — 2026-05-08 (post-PR-#13-merge `e1f5ef2` + post-entry-prompt commit `5c6f26f`).
> **Triggered by:** [phase-9-entry-research.md](phase-9-entry-research.md) GO verdict per [retros/phase-9-entry.md](retros/phase-9-entry.md).
> **Honest time estimate:** ≈1 day wall-clock single session. ~6-10 atomic commits + retro. All 4 areas deterministic, all stop-rule-compliant per [phase-9-entry-research.md §6](phase-9-entry-research.md). 5 LLM-bearing areas (A1-A5) DEFER with refined triggers — **out of scope**, do not re-litigate.

---

## §1. Identity & Context

**Repo:** `/Users/art/code/rules-as-tests-aif`
**Base branch:** create new `docs/phase-9-implementation` (or `feat/phase-9-implementation` if mixed-path; the branch name is a session call) from `main` HEAD `5c6f26f` (post-`docs(phase-9-entry): commit entry prompt artifact post-PR-#13-merge`). Pull and verify HEAD before forking.
**You are:** Opus orchestrator + implementer. Mixed docs + code phase. **Second downstream consumer of the Phase 8.8 mechanism** (the first was Phase 9 entry research, observed-zero-FP).

**Phase 9 implementation scope is deliberately small** — 4 BUILD areas, all deterministic, all pre-validated stop-rule-compliant. The entry research [§5](phase-9-entry-research.md) refined Phase 9 *down* from a 9-area candidate list. **Do not widen scope** in this session; reverting any DEFER requires a new entry-research cycle per [retros/phase-9-entry.md Open Q #1-#5](retros/phase-9-entry.md).

**Post-merge coverage-gap context (commit `f92f60b`, branch base):** the entry research closed §13.10 #2 ROI re-evaluation negative on a 5-candidate context7 base (Cursor / Continue.dev / Factory ESLint Plugin / Cody / Aider). Two candidates were NOT checked but should have been — **AIF `/aif-evolve`** (LLM-driven rule synthesis from accumulated fix patches; already an integrated dependency per [aif-comparison.md](aif-comparison.md)) and the **Oh My ClaudeCode family** (multi-agent orchestration in our exact runtime). The DEFER stance carries forward unchanged; the user's commit recorded the gap as a 2-line note in [open-questions.md §13.10](open-questions.md) closure-criteria block. **Phase 9 implementation scope (A6/A7/A8/A9) is unaffected** per the commit's own claim. The gap is relevant to A6's §13.10 #2 trigger-wording sub-task — see §4 T1 sub-task #3.

### §1.1 Pre-resolved decisions (do not re-open)

The drafting session that produced this prompt resolved 7 open questions from the Phase 9 entry retro. Decisions are baked into §3 and §4 below; re-opening is a `REVISE` on PR #13, not a Phase 9 implementation activity. Summary table:

| # | Question | Decision | Rationale (short) |
|---|---|---|---|
| §3.1 | Phase 9 vs Phase 8.X naming | **Phase 9** (full phase) | Entry research, retro, prompt all already named Phase 9; renaming = cross-ref churn for no benefit; 8.X is for retroactive bolt-ons (Phase 8.8 was), Phase 9 is forward execution of fresh scope. |
| §3.2 | Task ordering A6/A7/A8/A9 | **A6 → A7 → A8 → A9** | Housekeeping (A6/A7) stabilizes recipe + research-store surface before A8 calibration consumes that surface. A9 last gives the retro a clean Phase 11.1-closure climax. |
| §3.3 | §13.10 #2 trigger refinement wording | N=15 recipes; "plugin-menu pattern" = ≥3 concurrent framework targets requiring per-framework rule namespace AND no single hand-curated preset fits. **Lands as A6 sub-task** (recipe count drives the metric). | Concrete N: 3× current ~5-6 recipes — Factory's 21 is industry signal; 15 keeps 1.4× buffer. Plugin-menu definition makes the trigger falsifiable. |
| §3.4 | A8 calibration corpus shape | **Mutation corpus from canonical-v15** — 5 mutants: drop rule / drop ESLint-key / tighten glob / compound / identity. Each has computed expected score from current weights. | Mutation = deterministic, regenerable, no hand-validation cost. Hand-authored divergent plans push validation cost onto the author with no reproducibility. |
| §3.5 | A9 Phase 11.1 closure granularity | **Validation-only + emit-path test assertion + AIF schema snapshot.** NO CI hard-fail gate. | Phase 11.1 acceptance language is "validation"; hard-fail risks false-positives on AIF schema drift. Warn-first principle from [prior-art-evaluations.md §5 staleness policy](prior-art-evaluations.md). |
| §3.6 | P0 vs P1 split — mandatory or scope-permitting? | **All 4 mandatory in Phase 9.** P0 (A6/A9) vs P1 (A7/A8) is a retro-time fallback only. | Phase 9 is small enough to ship all 4 (~1 day). Splitting introduces a Phase 9.X tail without a clear stop-rule. |
| §3.7 | Output file naming | `docs/meta-factory/PHASE-9-PROMPT.md` | Per §3.1 naming decision. |

**Alternatives rejected** (one line each, for audit trail):
- §3.1 «Phase 8.X»: rejected — bolt-on naming for forward execution is misleading; Phase 8.8 was retroactive, Phase 9 is forward.
- §3.2 «A9 first to remove dependency»: rejected — A9 is independent of A6/A7/A8 in BOTH orderings; the corpus-stability argument outweighs the «remove dep early» bias.
- §3.3 «defer trigger wording to follow-up»: rejected — trigger refinement is the Phase 9 entry verdict's natural close; deferring leaves §13.10 #2 in stale state.
- §3.4 «hand-authored divergent plans»: rejected — costs hand-validated expected scores and creates a maintenance burden the calibration test does not need.
- §3.5 «validation + CI gate»: rejected — escalates to hard-fail before any consumer feedback on FP rate; violates warn-first principle.
- §3.6 «ship only P0, defer P1 to Phase 9.X»: rejected — Phase 9.X tail without clear stop-rule is anti-pattern; total Phase 9 cost ≤1 day either way.

## §2. Обязательное чтение (in order)

1. [docs/meta-factory/phase-9-entry-research.md](phase-9-entry-research.md) §5 + §6 — final BUILD vs DEFER matrix; per-area stop-rule projection; cost projection ($0 LLM spend).
2. [docs/meta-factory/retros/phase-9-entry.md](retros/phase-9-entry.md) — verification block, self-application, Open Q #1-#5 (resolved in §1.1 above; do not re-open).
3. [docs/meta-factory/EXECUTION-PLAN.md §6.0](EXECUTION-PLAN.md) — deterministic-v1 stop-rules (NO LLM at runtime / NO new explicit deps / NO yargs-commander / NO Path B AST gen). All 4 still locked.
4. [docs/meta-factory/EXECUTION-PLAN.md §5.5 Step 1.5](EXECUTION-PLAN.md) — mandatory SSOT consult for any unmatched capability that surfaces during implementation (expected: no new SSOT entries this phase; the matrix is closed).
5. [docs/meta-factory/prior-art-evaluations.md](prior-art-evaluations.md) — SSOT, 5 entries; expected to remain at 5 after Phase 9.
6. [docs/meta-factory/aif-comparison.md §9](aif-comparison.md) — REUSE matrix; A9 reuses `aif-gate-result` GATE-RESULT-CONTRACT.md schema, not building competitor.
7. [docs/meta-factory/aif-comparison.md §7 Phase 11.1 subtask](aif-comparison.md) — Phase 8 closed L4/L5 emission + wire format; A9 closes the remaining "schema validation against fetched-fresh schema" item.
8. [docs/meta-factory/retros/phase-8.md](retros/phase-8.md) Self-reflection #5 / #6 / #9 — root justifications for A6 (recipe duplication), A7 (`next/any/` tier), A8 (calibration).
9. [docs/meta-factory/open-questions.md §13.10](open-questions.md) entry #2 — current trigger wording + post-merge coverage-gap note (commit `f92f60b`); A6 sub-task edits the trigger condition column without overwriting the gap note.
10. [packages/core/research/load.ts](../../packages/core/research/load.ts) — current 3-tier resolution (`<framework>/<major>.x/` → `<framework>/<major-1>.x/` → `shared/`); A7 inserts a 4th `any/` tier.
11. [packages/core/diff/preset-similarity.ts](../../packages/core/diff/preset-similarity.ts) — current `W_RULES=0.4 / W_KEYS=0.4 / W_GLOBS=0.2` weights (88 LOC post-PR-#11 fix); A8 builds calibration corpus targeting these.
12. [packages/core/validator/to-aif-gate-result.ts](../../packages/core/validator/to-aif-gate-result.ts) — current emit (67 LOC); A9 wraps emit-path with hand-rolled validator.
13. [CLAUDE.md](../../CLAUDE.md) + [.husky/pre-push](../../.husky/pre-push) — Phase 8.8 mechanism (capability commit detection + `Prior-art:` trailer); A8 calibration test will likely cross the 80-LOC threshold and require a trailer.
14. [docs/meta-factory/retros/phase-7.5.md](retros/phase-7.5.md) — closest docs-only retro reference for the Phase 9 retro structure (this Phase has both docs and code, but the retro framing pattern carries).

## §3. Hard constraints

1. **Inherit [§6.0](EXECUTION-PLAN.md) stop-rules verbatim.** All 4 BUILD areas are pre-validated stop-rule-compliant per [phase-9-entry-research.md §6.1](phase-9-entry-research.md). Do **not** preempt §6.0 amendments — if unforeseen conflict surfaces, halt and route via REVISE.
2. **Phase 8.8 mechanism active.** Before any *capability* commit (per [.husky/pre-push](../../.husky/pre-push) detection — new explicit dep / ≥50 LOC under new `packages/core/<dir>/` / ≥80 LOC anywhere under `packages/`) MUST: (a) consult [prior-art-evaluations.md](prior-art-evaluations.md) per §5.5 Step 1.5; (b) carry a `Prior-art:` trailer per [CLAUDE.md](../../CLAUDE.md) syntax. No new SSOT entries expected — the matrix is closed; if a fresh capability surfaces (unlikely), apply ≥3 phrasings + same-commit SSOT add per [prior-art-evaluations.md §3](prior-art-evaluations.md).
3. **Principle 08** (`packages/core/principles/08-prior-art-cited.test.ts`) MUST stay green. No new research files expected; existing files retain their SSOT citations.
4. **NO new explicit deps** in `package.json`. A9 ships a hand-rolled JSON-shape validator (≤50 LOC), NOT Ajv. Transitive deps via existing packages are fine.
5. **NO LLM at runtime** in any of L1-L5 hot paths. All 4 BUILD areas are deterministic — A8 corpus is computed mutations, not generated; A9 validator is pure data-shape check.
6. **NO yargs/commander.** No new CLIs in Phase 9; `process.argv` parsing only if any flag is added.
7. **NO Path B AST gen.** A8 mutations are JSON edits over the canonical-v15 fixture, not AST manipulation.
8. **All 7 §1.1 decisions are CLOSED.** Re-opening is a REVISE on PR #13, not Phase 9 implementation. If the implementation session disagrees with a decision, surface it in T5 retro Open Q for the *next* session — do NOT silently change it.
9. **Atomic commits, conventional-commits, English subjects, no emoji, no `--no-verify`, no force-push.**
10. **≤500 lines** per shipped reference doc; transient artifacts (research, retros) ≤200 LOC. PHASE-9-PROMPT.md is exempt (this very file).
11. **Apply principle to itself.** A6 sub-task #2 edits §13.10 entry #2 trigger wording in the SAME commit as the recipe consolidation that drives the metric (recipe-count threshold) — co-locating the policy edit with the reason for it.
12. **Acceptance gate before retro:** `cd packages/core && npm test --run` ≥246 pass (no regression from current baseline of 246 / 40 files); `make self-audit` green; principle 08 green.

## §4. Task list

### T1 — A6: recipe duplication policy + §13.10 #2 trigger refinement

**Why:** Phase 8 retro [Self-reflection #6](retros/phase-8.md) flagged that `react-server-components.json` and `next-r12-no-server-imports-in-client.json` both emit the same ESLint rule (`rules-as-tests/no-server-imports-in-client`) — duplication that bloats the recipe surface and dilutes the recipe-count metric driving §13.10 #2.

**Single-source policy (decided):** ≤1 synthesizer recipe per emitted ESLint rule. Canonical = the version-tagged R-numbering recipe (`next-r12-no-server-imports-in-client`); delete the generic `react-server-components` synthesizer recipe; the research-store entry at `packages/core/research/store/next/16.x/react-server-components.json` documents the canonical pattern but routes synthesis through the surviving recipe.

**Sub-tasks:**

1. **Recipe collapse:**
   - Delete `packages/core/synthesizer/recipes/react-server-components.json`.
   - Update `next-r12-no-server-imports-in-client.json` `applies-to` to the **union** of the two prior recipes' globs (broader of `["src/**/*.tsx"]` and `["src/app/**/*.tsx", "src/components/**/*.tsx"]` → `["src/**/*.tsx"]` already covers both).
   - Reroute any research-store / synthesis-plan cross-refs from `patternId: react-server-components` → `next-r12-no-server-imports-in-client`. The research-store JSON entry filename can stay (research store is the catalog, recipes are the emit slot); but its `patternId` must align with the surviving synthesizer recipe.
   - Regen synthesizer expected fixtures (`expected-fixture-synth.json`, `expected-self-synth.json`); update canonical-v15 frozen snapshot.
2. **Single-source policy doc:**
   - Add 5-10 line note at the head of `packages/core/synthesizer/recipes/recipe.schema.json` (`description` field) OR a `recipes/README.md` (whichever is more idiomatic per the existing layout): "Single-source: one synthesizer recipe per emitted ESLint rule. Collisions are resolved by deletion + research-store re-route, not layered emission. Phase 9 A6 closure (2026-05-08)."
3. **§13.10 entry #2 trigger refinement** (apply principle to itself per Hard Constraint #11):
   - Edit `docs/meta-factory/open-questions.md §13.10` **table row** "2 | Path A LLM gen («picks from menu»…)" `Trigger condition` column. **Do not delete** the post-merge coverage-gap paragraph that commit `f92f60b` appended below the closure-criteria block — that paragraph stays as-is; the trigger-condition column is a separate edit surface.
   - **New trigger-column wording:** "Phase 8 acceptance test passes deterministic; Phase 9 entry research validates ROI (closed negative 2026-05-08, [phase-9-entry-research.md §5 row A1](phase-9-entry-research.md)). **Next re-evaluation:** recipe count exceeds 15 (3× post-A6 baseline of ~5) AND ≥3 framework targets concurrently shipped (e.g. Next + Remix + SvelteKit) require per-framework rule namespace selection AND no single hand-curated preset fits all recipe surfaces."
   - **Candidate-base note** (added below the closure-criteria block, after the f92f60b paragraph, NOT replacing it): "Next re-evaluation candidate base **must include** the original 5 (Cursor / Continue.dev / Factory ESLint Plugin / Cody / Aider) **plus** the two flagged in `f92f60b`: AIF `/aif-evolve` and the Oh My ClaudeCode family. Skipping any of the 7 = REVISE on the entry research." This makes the gap actionable for the next session, not just descriptive.

**Verification:**
```bash
test ! -f packages/core/synthesizer/recipes/react-server-components.json
grep -E "patternId.*react-server-components" packages/core/synthesizer/recipes/*.json   # 0 hits
cd packages/core && npm test --run synthesizer/snapshot 2>&1 | tail -3                  # green
grep -E "recipe count exceeds 15" docs/meta-factory/open-questions.md                   # 1 hit
```

**Commit subjects (atomic):**
- `refactor(synthesizer): A6 — collapse react-server-components recipe into next-r12 (single-source policy)`
- `docs(open-questions): §13.10 #2 trigger refined (recipe count 15 + ≥3 framework targets)`

**Prior-art trailer guidance:** recipe deletion + JSON edits unlikely to cross the 80-LOC threshold; if it does, trailer = `Prior-art: prior-art-evaluations.md#4 (Factory ESLint Plugin, WATCHLIST — recipe count <15 keeps hand-roll path; SSOT entry rationale already cites this trigger).` Otherwise: `Prior-art: skipped — refactor only, no new capability (recipe duplication collapse, no external analog)`.

### T2 — A7: `next/any/` resolution tier in `load.ts`

**Why:** Phase 8 retro [Self-reflection #5](retros/phase-8.md) flagged that R12 / R14 / R20 are version-agnostic across Next 15 and 16; the current 3-tier resolver duplicates each entry under both `next/15.x/` and `next/16.x/`. A new `next/any/` tier collapses the duplication and answers the authoring convention question ("when does an entry deserve `any/` vs versioned dirs?") in code.

**Authoring convention (decided):** an entry belongs in `<framework>/any/` if and only if it has identical content across all currently-shipped major versions. Entries with version-divergent content (e.g. an `app-router` entry shaped differently in Next 13 vs Next 15) stay in versioned dirs. Migration: this phase only collapses **the three currently-known duplicates** (R12 / R14 / R20); other entries stay where they are.

**Sub-tasks:**

1. **Add resolution tier:**
   - Edit `packages/core/research/load.ts` `candidatePaths()`: insert `<framework>/any/<patternId>.json` between the major-1 fallback and the `shared/` tier (per the existing comment block ordering 1 → 2 → 3 → 4).
   - Update the doc-comment header listing tier order.
2. **Migrate three duplicates:**
   - Move `next/15.x/next-r12-no-server-imports-in-client.json` → `next/any/next-r12-no-server-imports-in-client.json`; delete the 16.x copy. Repeat for R14 and R20.
   - Verify byte-identical content between 15.x and 16.x copies BEFORE deletion (`diff` shows no diff). If diff exists, halt and surface as REVISE (this is a precondition; a divergent entry stays in versioned dirs per the convention).
3. **Tests:**
   - Extend `packages/core/research/load.test.ts` (or the equivalent) with a case asserting `loadEntries('next', '15.4.0', ['next-r12-no-server-imports-in-client'])` resolves to `next/any/...`.
   - Add a regression test: `loadEntries('next', '14.0.0', ['next-r12-no-server-imports-in-client'])` ALSO resolves to `next/any/...` (older majors hit the new tier, not the major-1 fallback when only `any/` has the entry).

**Verification:**
```bash
test -f packages/core/research/store/next/any/next-r12-no-server-imports-in-client.json
test -f packages/core/research/store/next/any/next-r14-require-form-safe-parse.json
test -f packages/core/research/store/next/any/next-r20-require-use-server-directive.json
test ! -f packages/core/research/store/next/15.x/next-r12-no-server-imports-in-client.json
test ! -f packages/core/research/store/next/16.x/next-r12-no-server-imports-in-client.json
cd packages/core && npm test --run research 2>&1 | tail -3                              # green
```

**Commit subject:** `feat(research): A7 — add next/any/ resolution tier; migrate R12/R14/R20 (collapses 15.x↔16.x duplication)`

**Prior-art trailer guidance:** `load.ts` patch is small (~5-10 LOC); if total commit crosses 80 LOC due to test additions, trailer = `Prior-art: skipped — load.ts authoring-convention refactor, internal collapse, no external analog (semver-coerce resolver pattern is hand-rolled per §6.0 #2 stop-rule).`

### T3 — A8: glob-overlap weight calibration corpus

**Why:** [phase-8-research.md §3](phase-8-research.md) seeded `W_RULES=0.40 / W_KEYS=0.40 / W_GLOBS=0.20` as initial guesses. Phase 8 acceptance ran reflexive (regen-vs-frozen, similarity=1.0 by construction); divergent-plan calibration data does not exist. Phase 9 builds the corpus so the weights become **data-backed** rather than guessed; future weight tweaks become regression-guarded.

**Corpus shape (decided):** 5 mutation cases derived programmatically from `canonical-v15` (or the equivalent post-A6 frozen snapshot):

| # | Mutation | Expected effect on similarity | Computed expected score (current weights) |
|---|---|---|---|
| 1 | Identity (no mutation) | 1.0 | `1.0` |
| 2 | Drop 1 rule out of N total | rules-overlap = (N-1)/N; keys/globs unchanged | `0.4·((N-1)/N) + 0.4·1 + 0.2·1 = ...` (compute in test) |
| 3 | Drop 1 ESLint config key out of K total | keys-overlap = (K-1)/K; rules/globs unchanged | `0.4·1 + 0.4·((K-1)/K) + 0.2·1 = ...` |
| 4 | Tighten 1 glob (`src/**/*.ts` → `src/app/**/*.ts`) | glob-overlap reduced; rules/keys unchanged | `0.4·1 + 0.4·1 + 0.2·g`, where `g` = `globOverlap(orig, tightened)` |
| 5 | Compound (mutation #2 + #3) | rules and keys both reduced; globs unchanged | `0.4·((N-1)/N) + 0.4·((K-1)/K) + 0.2·1` |

**Sub-tasks:**

1. **Test file:** `packages/core/diff/preset-similarity.calibration.test.ts` (new, ~80-150 LOC).
2. **Mutator helpers** (inline in the test file, or in a sibling `preset-similarity.calibration-fixtures.ts` ≤50 LOC if cleaner): pure functions taking the canonical plan + mutation params, returning a mutated SynthesisPlan.
3. **Assertions:** for each mutant, compute expected score from current `W_*` weights and assert `presetSimilarity(canonical, mutant)` matches within ±0.01 tolerance.
4. **Doc note** in `preset-similarity.ts` header: append "Weights are data-backed by `preset-similarity.calibration.test.ts` mutation corpus (Phase 9 A8). Tweaks to W_* require updating the corpus's expected-score column."

**Verification:**
```bash
test -f packages/core/diff/preset-similarity.calibration.test.ts
cd packages/core && npm test --run diff/preset-similarity.calibration 2>&1 | tail -3    # green; 5 cases pass
grep -E "calibration.test.ts|data-backed" packages/core/diff/preset-similarity.ts        # 1+ hit
```

**Commit subject:** `test(diff): A8 — preset-similarity calibration corpus (5 mutants from canonical-v15)`

**Prior-art trailer guidance:** test file likely ≥80 LOC → capability commit per hook detection. Trailer = `Prior-art: skipped — internal calibration corpus, no external analog (similarity metric is hand-rolled per phase-9-entry-research.md §4.A8; A8 already DEFER-evaluated as no SSOT match).`

### T4 — A9: AIF GATE-RESULT-CONTRACT.md schema validation (Phase 11.1 closure tail)

**Why:** Phase 8 Task 8.4 partial-closed Phase 11.1 — wire format + emit shipped, but the [§7 Phase 11.1 acceptance](aif-comparison.md) item "schema validation against fetched-fresh schema" remained open. A9 closes that item with a hand-rolled validator (per [§6.0 #2](EXECUTION-PLAN.md) — no Ajv) + a pinned schema snapshot.

**Granularity (decided):** validation-only + emit-path test assertion + pinned schema snapshot. **NO CI hard-fail gate.** Rationale per §1.1 row §3.5.

**Sub-tasks:**

1. **Fetch fresh AIF schema:**
   - Run `mcp__context7__query-docs` against `/lee-to/ai-factory` with query "GATE-RESULT-CONTRACT.md schema schema_version blockers affected_files suggested_next 2026 latest schema". Capture the fields + types.
   - Snapshot the schema (the type / constraint table, not the full markdown) into `packages/core/validator/aif-gate-result-schema.snapshot.md` (≤200 LOC).
   - Add a header line "Snapshotted from /lee-to/ai-factory @ 2026-05-08 via context7. Re-fetch on Phase 11+ entry research."
2. **Hand-rolled validator** in `packages/core/validator/aif-gate-result-schema.ts` (≤50 LOC):
   - Pure function `validateAifGateResult(obj: unknown): { ok: boolean; errors: string[] }`.
   - Checks the fields enumerated in [phase-9-entry-research.md §4.A4+§4.A9](phase-9-entry-research.md): `schema_version: 1`, `gate ∈ {"verify","review","security","rules"}`, `status ∈ {"pass","warn","fail"}`, `blocking: boolean`, `blockers[]` shape, `affected_files[]: string[]`, `suggested_next.{command, reason}`.
   - No external deps; pure type-narrowing + value checks.
3. **Emit-path assertion:**
   - Extend `packages/core/validator/to-aif-gate-result.test.ts` with a case calling `validateAifGateResult(fromValidationReport(report))` and asserting `.ok === true` for the existing test fixtures. Repeat for `fromInstallReport`.
4. **Phase 11.1 pointer update:**
   - Edit `docs/meta-factory/aif-comparison.md §7 Phase 11.1 subtask` block: change "Schema validation against AIF GATE-RESULT-CONTRACT.md schema (fetched fresh via context7). — **deferred** to Phase 11 entry" → "**closed Phase 9 A9 (2026-05-08)** via hand-rolled validator [`packages/core/validator/aif-gate-result-schema.ts`](../../packages/core/validator/aif-gate-result-schema.ts) + pinned snapshot [`aif-gate-result-schema.snapshot.md`](../../packages/core/validator/aif-gate-result-schema.snapshot.md). Re-fetch on Phase 11+ entry research per snapshot header."
   - Update the Phase 11.1 status header: "PARTIAL CLOSE in Phase 8" → "CLOSED in Phase 9 A9".

**Verification:**
```bash
test -f packages/core/validator/aif-gate-result-schema.ts
test -f packages/core/validator/aif-gate-result-schema.snapshot.md
cd packages/core && npm test --run validator/to-aif-gate-result 2>&1 | tail -3          # green; new assertion case passes
grep -E "CLOSED in Phase 9 A9" docs/meta-factory/aif-comparison.md                       # 1 hit
grep -E "schema_version|blocking|suggested_next" packages/core/validator/aif-gate-result-schema.ts | wc -l  # ≥3
```

**Commit subjects (atomic, in order):**
- `feat(validator): A9 — pin AIF GATE-RESULT-CONTRACT.md schema snapshot (context7 fetch 2026-05-08)`
- `feat(validator): A9 — hand-rolled aif-gate-result schema validator (no Ajv per §6.0 #2)`
- `test(validator): A9 — emit-path assertion via validateAifGateResult on existing fixtures`
- `docs(aif-comparison): §7 Phase 11.1 closed (A9 — schema validation shipped)`

**Prior-art trailer guidance:** the validator is a capability commit per hook detection (likely ≥50 LOC under new `validator/` subdir scope, depending on how the hook reads it). Trailer = `Prior-art: aif-comparison.md#9 (REUSE — AIF GATE-RESULT-CONTRACT.md schema, no SSOT entry needed; A9 ships hand-rolled validator per §6.0 #2 stop-rule, not Ajv dep).` The snapshot commit is a docs commit; trailer = `Prior-art: skipped — pinned snapshot of fetched-fresh AIF schema, REUSE per aif-comparison.md#9, no new capability.`

### T5 — Retro `retros/phase-9.md` (≤200 LOC) + GO/REVISE verdict

**Standard retro shape** mirroring [retros/phase-9-entry.md](retros/phase-9-entry.md):

1. Header (date, branch, phase = 9, verdict).
2. Scope (4 BUILD areas closed).
3. Verification block (table: probe / expected / actual; see §5 acceptance).
4. Self-application — Phase 8.8 mechanism observation: SSOT consult discipline (no new entries this phase, expected); principle 08 green; trailer compliance per capability commit. **Observed FP rate** for the second downstream consumer of the mechanism (cumulative with Phase 9 entry's zero).
5. Stop-rule audit — §6.0 #1-#4 held cell-by-cell; no amendment needed.
6. Time-vs-plan ratio (target ≈1 day; >2× triggers RCA).
7. **Verdict** — GO / REVISE / STOP for the next phase. Likely close: GO and route Open Questions for Phase 10 (or Phase 9.5 if amendments surface).
8. Open Questions for Phase 10 entry (informational; carries forward [retros/phase-9-entry.md Open Q #5](retros/phase-9-entry.md) — principle 08 scope widening).

**Commit subject:** `docs(phase-9): T5 — retro + verdict for Phase 10 entry`

## §5. Acceptance criteria

```bash
# Branch hygiene
git diff main --name-only | grep -vE "^(docs/meta-factory/(PHASE-9-PROMPT|phase-9-entry-research|aif-comparison|open-questions|retros/phase-9)\.md|packages/core/(synthesizer/recipes/|research/(load\.ts|store/next/(any|15\.x|16\.x)/)|diff/preset-similarity|validator/(aif-gate-result-schema(\.snapshot)?(\.ts|\.md)|to-aif-gate-result\.test\.ts)|principles/.*|.*expected-.*-synth\.json))" | grep -v "^$" && echo "FAIL: unexpected files" || echo "OK"

# Atomic commits — task list expands to 6-10 atomic + retro
git log main..HEAD --oneline | wc -l                                                     # 7-12 expected

# Conventional commits, English subjects, no emoji
git log main..HEAD --pretty=format:'%s' | grep -cE '^(docs|feat|test|refactor|chore)(\(.+\))?: '   # = total commits
git log main..HEAD --pretty=format:'%s' | grep -E '[\xF0-\xF7][\x80-\xBF]+' && echo "FAIL: emoji" || echo "OK"

# Prior-art trailer compliance on capability commits (hook will block on push regardless)
git log main..HEAD --pretty=format:'%H%n%B%n---%n' | grep -cE '^Prior-art:'              # ≥1 (T3 calibration; T4 validator)

# Test suite — no regression from baseline 246/40
cd packages/core && npm test --run 2>&1 | tail -3                                        # ≥246 pass

# Self-audit
make self-audit                                                                          # green

# Principle 08 (citations)
cd packages/core && npm test --run principles/08-prior-art-cited 2>&1 | tail -3          # green

# Per-area smoke tests (cross-ref the §4 verification blocks)
test ! -f packages/core/synthesizer/recipes/react-server-components.json                 # A6
test -d packages/core/research/store/next/any                                            # A7
test -f packages/core/diff/preset-similarity.calibration.test.ts                         # A8
test -f packages/core/validator/aif-gate-result-schema.ts                                # A9
test -f packages/core/validator/aif-gate-result-schema.snapshot.md                       # A9

# Retro shipped
test -f docs/meta-factory/retros/phase-9.md
[ "$(wc -l < docs/meta-factory/retros/phase-9.md)" -le 200 ]
```

**Content acceptance:**
- All 4 BUILD areas (A6/A7/A8/A9) closed; each verified per §4 sub-task verification block.
- §13.10 #2 trigger wording updated with concrete N=15 + plugin-menu definition (A6 sub-task).
- Phase 11.1 pointer updated to "CLOSED in Phase 9 A9" in [aif-comparison.md §7](aif-comparison.md).
- No new SSOT entries (matrix closed; if one surfaces, halt + REVISE).
- Retro carries forward Phase 9 entry Open Q #5 (principle 08 scope widening) as Phase 10 entry candidate.

## §6. What NOT to do

1. **DO NOT widen scope to A1-A5.** Phase 9 entry research closed those DEFER with refined triggers; reverting requires a new entry-research cycle, not Phase 9 implementation.
2. **DO NOT preempt §6.0 stop-rule amendments.** All 4 BUILD areas pre-validated stop-rule-compliant per [phase-9-entry-research.md §6.1](phase-9-entry-research.md). If unforeseen conflict surfaces — halt + REVISE.
3. **DO NOT add new SSOT entries casually.** The matrix is closed at 5 entries. If a fresh capability-area surfaces during implementation (unlikely; the matrix is exhaustive), apply [§5.5 Step 1.5](EXECUTION-PLAN.md) full discipline (≥3 phrasings + same-commit add) — do not skip.
4. **DO NOT widen principle 08 scope.** [retros/phase-9-entry.md Open Q #5](retros/phase-9-entry.md) explicitly defers this past Phase 9. Adding retros / aif-comparison.md to principle 08 scope is a Phase 10+ decision.
5. **DO NOT split a BUILD area into Phase 9.X.** All 4 are mandatory in this Phase per §1.1 row §3.6. P0/P1 distinction is retro-time fallback only — the prompt commits to the full 4.
6. **DO NOT introduce yargs / commander / Ajv / ts-morph.** §6.0 #2 + #3 stop-rules. A8 corpus is JSON edits; A9 validator is hand-rolled.
7. **DO NOT bypass `--no-verify` if pre-push hook blocks.** Investigate the trailer or capability-detection failure; fix the trailer body. Bypass = REVISE on the merging PR.
8. **DO NOT silently change a §1.1 decision.** If the implementation strongly disagrees with a decision, surface it in T5 retro Open Q for the *next* session and continue with the decision as written.
9. **DO NOT regenerate `prior-art-evaluations.md` `Last reviewed` dates wholesale.** Only entries that actively match a Phase 9 capability area (none expected). The closed-matrix invariant says no entries match.
10. **DO NOT add emoji, no `--no-verify`, no force-push, no `git config` edits.**

## §7. PR plan

```bash
gh pr create --base main --head docs/phase-9-implementation \
  --title "feat: Phase 9 implementation — A6/A7/A8/A9 (housekeeping + Phase 11.1 closure)" \
  --body "$(cat docs/meta-factory/retros/phase-9.md | head -60)"
```

PR description = retro head section (sections 1-3: header, scope, verification block). Reviewer (you / future Claude session / @Yhooi2) verifies acceptance criteria from §5.

The PR title intentionally drops the `docs(...)` prefix — Phase 9 is mixed code+docs, primary surface is `feat(...)`-equivalent work in `packages/core/`. Branch name is the orchestrator's call; `docs/phase-9-implementation` mirrors the entry branch's `docs/phase-9-entry-research` pattern even though the surface is mixed.

## §8. Post-merge

1. **GO verdict** → next session opens Phase 10 entry research (not in scope here). Phase 10 candidates: real-corpus validation (per [§13.12](open-questions.md)); principle 08 scope widening (per [retros/phase-9-entry.md Open Q #5](retros/phase-9-entry.md)); preset versioning policy (per [§13.13](open-questions.md)). Trigger conditions per §13.1x SSOTs.
2. **REVISE verdict** → re-open this Phase 9 implementation session to address findings; ≥1 atomic delta commit per finding addressed; new retro section appended.
3. **STOP verdict** → unlikely (all 4 BUILD areas pre-validated). If it fires, document why; the Phase 8.8 mechanism + entry research artifacts remain authoritative for any future Phase N+.

After Phase 9 close: archive [phase-9-entry-research.md](phase-9-entry-research.md) per its own §header transient-artifact policy (cross-referenced from `retros/phase-9.md`, not deleted).

---

**Reference materials packed for self-contained execution.** Branch from `main` HEAD `5c6f26f`. Atomic commits. 4 BUILD areas in order A6 → A7 → A8 → A9. Phase 8.8 mechanism is the live forward gate; this session is its **second downstream consumer** (cumulative observed-FP rate informs principle 08 scope widening Open Q for Phase 10).
