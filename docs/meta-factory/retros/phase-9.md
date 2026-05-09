# Phase 9 Implementation Retrospective — A6/A7/A8/A9 closed; Phase 11.1 sealed

> **Date:** 2026-05-09
> **Branch:** `docs/phase-9-implementation` (forked from `main` HEAD `1accb67`, the merge commit of PR #17 closing the prompt anti-pattern sweep).
> **Phase:** 9 implementation — 4 BUILD areas (A6/A7/A8/A9) per [PHASE-9-PROMPT.md](../PHASE-9-PROMPT.md). **Second downstream consumer** of Phase 8.8 mechanism (cumulative observed-zero-FP × 2 sessions).
> **Verdict:** **GO** to Phase 10 entry. All 4 areas closed; Phase 11.1 transitioned PARTIAL CLOSE → CLOSED. 8 atomic commits + this retro.

## Scope

4 BUILD areas closed per [phase-9-entry-research.md §5](../phase-9-entry-research.md):

- **A6** — recipe duplication policy (`react-server-components` synthesizer recipe collapsed into `next-r12-no-server-imports-in-client`); single-source policy doc; §13.10 #2 trigger refined (recipe count > 15 + ≥3 framework targets + plugin-menu definition; candidate-base widened to 7 incl. AIF `/aif-evolve` + Oh My ClaudeCode per `f92f60b` gap)
- **A7** — `next/any/` resolution tier in [load.ts](../../../packages/core/research/load.ts); R12/R14/R20 migrated (byte-identical precondition verified)
- **A8** — [`preset-similarity.calibration.test.ts`](../../../packages/core/diff/preset-similarity.calibration.test.ts) — 5-mutant regression-guard corpus (NOT statistical calibration of W_* values per [retros/phase-8.md SR#9](phase-8.md))
- **A9** — pinned AIF schema snapshot (context7 fetch 2026-05-09) + hand-rolled validator (no Ajv per §6.0 #2) + emit-path test assertion + Phase 11.1 status pointer

5 DEFER areas (A1-A5, all LLM-bearing) untouched per phase-9-entry verdicts; refined triggers retain force.

## Verification block

| # | Probe | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Branch hygiene — `git diff main --name-only` allowlisted | yes | 28 files all under expected paths | ✅ |
| 2 | Atomic commits ahead of main (ex retro) | 7-12 | 8 task + this retro = 9 | ✅ |
| 3 | Conventional-commits compliance | 8/8 | 8/8 | ✅ |
| 4 | English subjects, no emoji | required | 8/8 EN, no emoji | ✅ |
| 5 | `Prior-art:` trailer compliance | ≥1 (capability commits) | 8/8 commits trailered | ✅ |
| 6 | Test suite — no regression from baseline 253/41 | ≥253 | **267/42** (+14 tests, +1 file) | ✅ |
| 7 | Pre-push hook | green | 5 pass / 0 fail; principles 41/41 | ✅ (≡ self-audit) |
| 8 | Principle 08 + 09 green | required | 41/41 | ✅ |
| 9 | A6 smoke — `react-server-components.json` deleted | required | ✅ | ✅ |
| 10 | A7 smoke — `next/any/` dir + 3 entries | required | r12/r14/r20 in `any/` ✅ | ✅ |
| 11 | A8 smoke — calibration test exists | required | ✅ | ✅ |
| 12 | A9 smoke — validator + snapshot exist | required | ✅ + ✅ | ✅ |
| 13 | A9 smoke — `aif-comparison.md §7` shows CLOSED | required | ✅ | ✅ |
| 14 | This retro ≤200 LOC | required | yes | ✅ |

## Self-application — Phase 8.8 mechanism dogfooded × 2

| Layer | Surface | Phase 9 evidence |
|---|---|---|
| 1 — meta-test | [`principles/08-prior-art-cited.test.ts`](../../../packages/core/principles/08-prior-art-cited.test.ts) | green throughout; no new research files (matrix closed at 5 — held); existing files retain SSOT citations |
| 2 — process gate | [`EXECUTION-PLAN.md §5.5 Step 1.5`](../EXECUTION-PLAN.md) | no fresh capability surfaced (matrix closed); 0 new SSOT entries — expected per phase-9-entry verdict |
| 3 — developer-time | [`.husky/pre-push`](../../../.husky/pre-push) + commit trailer | 8/8 commits carry `Prior-art:` trailer; pre-push hook clean throughout (no `--no-verify` bypass) |

**Cumulative observed-FP rate (mechanism × 2 sessions):** **zero**. First downstream consumer (Phase 9 entry research, 2026-05-08) reported zero FP; this implementation session adds another zero. Recommendation re-asserted: widen principle 08 scope from «phase research files only» to «include retros + aif-comparison.md». Defer to Phase 10 entry per spec [§3 #8 / §6 #4](../PHASE-9-PROMPT.md) (Open Q below).

**SSOT growth:** 5 entries at Phase 9 entry close → 10 entries now. Net +5 from PR #16 (Option E baseline #6-#10 — Arc42 / AGENTS.md / AIF Step 0 / Cline / matklad), 0 from this Phase 9 implementation. Matrix-closed invariant held.

## Stop-rule audit (§6.0 cell-by-cell)

- **§6.0 #1 NO LLM at runtime** — held. A8 corpus = computed mutations (pure deep-clone-and-edit). A9 validator = pure data-shape check.
- **§6.0 #2 NO new explicit deps** — held. A9 ships hand-rolled `validateAifGateResult` (~55 code lines, 77 LOC total), not Ajv. `package.json` untouched.
- **§6.0 #3 NO yargs/commander** — held. No CLI surface added.
- **§6.0 #4 NO Path B AST gen** — held. A8 mutations are JSON edits over canonical-v15 fixture.
- **NO `--no-verify` / force-push / emoji / git config edits** — held across 8 commits.
- **Apply principle to itself (§3 #11)** — **honored** in B1 single atomic commit (collapse + §13.10 #2 trigger refinement co-located per reviewer Option (a) resolution; spec internal contradiction §3 #11 vs §4 T1 surfaced — see Self-reflection #1).
- **All 7 §1.1 decisions CLOSED** — held; none re-opened. One spec-internal contradiction surfaced (Open Q below) but didn't reverse a §1.1 decision.

## Time-vs-plan ratio

- **Target:** ≈1 day wall-clock single session per [PHASE-9-PROMPT.md §0](../PHASE-9-PROMPT.md).
- **Actual:** ≈1 hour orchestrator wall-clock (burn mode, mixed Mode A inline Agent Opus + 1 Mode B Opus session for B1 + старшая sama for trivial B2/B8/B9).
- **Ratio:** well under target. Same compression as Phase 4-8.8 entry (≈30 min). >2× trigger did NOT fire.

## Self-reflection (§2 prompts)

1. **Когда ошибся — почему?** Reviewer pass on the implementation plan caught a spec-internal contradiction: [§3 #11 «SAME commit»](../PHASE-9-PROMPT.md#L71) vs [§4 T1 commit subjects (two separate)](../PHASE-9-PROMPT.md#L104). Resolution: Option (a) — honor §3 #11 invariant («apply principle to itself»), merge collapse + trigger into single atomic commit (B1 commit `6ae8149`). The contradiction was caught at plan-review stage, not execution stage; no retroactive fixup needed.
2. **Мог ли пропускать раньше?** The same shortcut (skim spec §X commit subjects without cross-checking against §Y invariants) was available in Phase 8.8 drafting and Phase 9 entry. Both passed without surfacing because invariant statements were aligned with task structure. Phase 9 implementation prompt drafting introduced the divergence (drafting added `single-source policy doc` as a new sub-task without renumbering §3 #11's reference to «sub-task #2»). Methodology = **lookup-not-skim** when commit subjects appear in spec.
3. **Как не пропускать?** Maps to [phase-research-coverage §1.5 «Prompt-list ≠ complete»](../../../.claude/rules/phase-research-coverage.md): spec-internal commit-subject lists are a floor-not-ceiling per Hard Constraint #11 «apply principle to itself» when present. Operationalisable: «before treating §4 task-list commit subjects as authoritative, cross-check against §3 hard constraints for invariants that would force regrouping».
4. **Какой урок?** Reviewer pass on plans (not just on deliverables) catches spec-internal drift the spec author didn't notice. Worth running reviewer step on **every** non-trivial plan before execution — adds ~5 min to plan, prevents 1-2 atomic commits' worth of REVISE rework.
5. **Did the principle established in this phase apply to its own design?** Phase 9 implementation didn't introduce a new principle (it consumed Phase 8.8 mechanism + applied scope-frozen decisions from §1.1). Closest-applicable §2.5 audit: did the **drafting** of PHASE-9-PROMPT.md apply Hard Constraint #11 «apply principle to itself» to its own commit-subject list? **No** — that's exactly the contradiction surfaced in #1 above. Recursive-self-application gap one level up: the prompt-drafting session formalized the «apply principle to itself» invariant but did not apply it to the prompt's own §4 task-list commit-subject decomposition.

## Mode B Opus burn-mode pattern observation

User-driven burn mode + «no Sonnet, all Opus»: file-prompt for B1 (manual handoff to new Opus session), Mode A inline Agent Opus for B3/B4/B5/B6/B7 (no `model: "sonnet"` → naturally inherited Opus), старшая sama for B2/B8/B9 (trivial docs + synthesis-heavy retro). Worked smoothly for all 9 batches. Cumulative subagent Opus pool ~150k; orchestrator direct Opus ~70k. No 429, no quota-related friction. **Pattern documented** for future burn-mode umbrellas where audit-trail consistency + Opus-quota-spend is desired.

## Open Questions for Phase 10 entry

1. **Principle 08 scope widening** (carry-forward from [phase-9-entry retro Open Q #5](phase-9-entry.md)). Cumulative observed-FP after **2 sessions** = zero. Sufficient signal to widen scope from «phase research files only» to «include retros + aif-comparison.md»? Trigger: 3rd session of zero-FP, OR Phase 10 entry research surfaces a coverage gap the wider scope would have caught.
2. **Spec-internal contradiction discipline** — single instance surfaced in Phase 9 (§3 #11 vs §4 T1). Not worth retrofitting unless pattern recurs. Trigger: 2nd similar contradiction within 6 months → distill into a [phase-research-coverage §4 anti-pattern](../../../.claude/rules/phase-research-coverage.md) (e.g. `#spec-internal-contradiction`).
3. **AIF schema staleness re-fetch** — current pin 2026-05-09; per snapshot header re-fetch trigger fires «Phase 11+ entry research». Phase 10 may not require re-fetch yet; trigger remains armed. Cross-ref: [aif-gate-result-schema.snapshot.md](../../../packages/core/validator/aif-gate-result-schema.snapshot.md) — Re-fetch trigger section.
4. **Open-questions §13.21 / §13.22** (deferred from PR #16) remain ARMED, not fired. L3 doc-authority (templates/, .ai-factory/) trigger requires consumer adoption; own-conventions evolution into L2 Research Agent triggers on Phase 5+ ship.

## Versioning

- **2026-05-09** — Phase 9 implementation close, **GO** verdict to Phase 10 entry. 8 task commits + this retro = 9 total on `docs/phase-9-implementation` (forked from `main` HEAD `1accb67`, post-PR-#17-merge). Single-session burn mode (Opus 4.7 orchestrator) ≈1 hour wall-clock; 5 of 8 batches via Mode A inline Agent Opus, 1 via Mode B file-prompt (Opus session), 2 via старшая sama. Second downstream consumer of Phase 8.8 mechanism: principle 08 / process gate / commit trailer convention all exercised, observed-zero-FP × 2 sessions cumulative. Phase 11.1 transitioned PARTIAL CLOSE → CLOSED via A9 (hand-rolled validator + pinned snapshot).
