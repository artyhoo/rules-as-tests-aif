# Phase 9 Implementation Prompt Drafting — Retrospective

> **Date:** 2026-05-08
> **Branch:** `docs/phase-9-coverage-gap` (forked from `main` HEAD `5c6f26f`; user-side commit `f92f60b` recording Phase 9 entry coverage gap landed on the same branch base before this drafting session's first commit).
> **Phase:** 9 prompt drafting — converts the GO verdict from [retros/phase-9-entry.md](phase-9-entry.md) into an executable [PHASE-9-PROMPT.md](../PHASE-9-PROMPT.md).
> **Verdict:** **GO** — launch Phase 9 implementation session with `docs/meta-factory/PHASE-9-PROMPT.md` as input.

---

## Scope

Pure docs phase — single shipped artifact `docs/meta-factory/PHASE-9-PROMPT.md` (307 LOC, ≤500 cap). Resolved 7 open questions from [retros/phase-9-entry.md](phase-9-entry.md) (Q #1-#5 from that retro plus the meta-prompt's §3.1 naming + §3.7 file path) inline in §1.1; baked decisions into §3 hard constraints and §4 task list. Captured the user-side post-merge coverage-gap context (commit `f92f60b`) in §1, §2, and §4 T1 sub-task #3.

Mirrors the [PHASE-9-ENTRY-PROMPT.md](../PHASE-9-ENTRY-PROMPT.md) structural template (identity → mandatory reading → hard constraints → task list → acceptance → NOT-to-do → PR plan → post-merge) and the [retros/phase-7.5.md](phase-7.5.md) docs-only retro framing pattern.

---

## Verification block

| # | Probe | Expected | Actual |
|---|---|---|---|
| 1 | `git diff main --name-only` non-allowlisted | empty (only `PHASE-9-PROMPT.md`, `retros/phase-9-prompt-draft.md`, and the user's `open-questions.md` 2-line addition) | **OK: docs-only** |
| 2 | Commits ahead of main (excluding f92f60b user-side) | 4 task + 1 retro = 5 | **5 (T1+T2+T3+T4 + this retro)** |
| 3 | Conventional-commits compliance | 5/5, English subjects, no emoji | **5/5** |
| 4 | All 7 open questions resolved with rationale + alternative-rejected | required | **7/7 in §1.1 table + rejection list** |
| 5 | Naming decision: Phase 9 (full phase) | required | **Phase 9 — §1.1 row §3.1** |
| 6 | Task ordering A6 → A7 → A8 → A9 | required | **§4 T1-T4 in that order** |
| 7 | §13.10 #2 trigger refinement: concrete N + plugin-menu definition | N=15 + ≥3 framework targets | **§4 T1 sub-task #3** |
| 8 | A8 corpus shape: mutation corpus | required | **§4 T3, 5 mutants from canonical-v15** |
| 9 | A9 closure granularity: validation-only + emit-path test + snapshot, NO CI hard-fail | required | **§4 T4 sub-tasks 1-4** |
| 10 | All 4 BUILD areas mandatory in Phase 9 | required | **§1.1 row §3.6 + §6 row 5** |
| 11 | Output file: `docs/meta-factory/PHASE-9-PROMPT.md` | required | **307 LOC, ≤500 cap** |
| 12 | f92f60b coverage-gap context incorporated | required (§1, §2, §4 T1 sub-task #3) | **all 3 surfaces touched** |
| 13 | Cross-refs resolve | every `[…](…)` link points to extant file | **all resolved post-T4 fix** |
| 14 | Test suite (no regression) | ≥246 pass / 40 files | **246/40 pass** |
| 15 | `make self-audit` | green | **34/34 pass** |
| 16 | Principle 08 | green | **7/7 pass** |
| 17 | Each shipped reference ≤500 LOC | required | **PHASE-9-PROMPT.md = 307; this retro ≤200** |

---

## Decision summary (the 7 open questions)

| # | Question | Decision |
|---|---|---|
| §3.1 | Phase 9 vs Phase 8.X naming | **Phase 9** (full phase) |
| §3.2 | Task ordering | **A6 → A7 → A8 → A9** |
| §3.3 | §13.10 #2 trigger refinement wording | N=15; plugin-menu = ≥3 frameworks + no single hand-curated preset fits; lands as A6 sub-task |
| §3.4 | A8 corpus shape | mutation corpus from canonical-v15 (5 mutants) |
| §3.5 | A9 closure granularity | validation-only + emit-path assertion + AIF schema snapshot, NO CI hard-fail |
| §3.6 | P0/P1 mandatory or scope-permitting | all 4 mandatory in Phase 9 |
| §3.7 | Output file path | `docs/meta-factory/PHASE-9-PROMPT.md` |

Full rationale + alternative-rejected list lives in [PHASE-9-PROMPT.md §1.1](../PHASE-9-PROMPT.md). The implementation session's hard-constraint #8 forbids silent re-litigation; surface disagreements as Phase 10 entry Open Q.

---

## Self-application — Phase 8.8 mechanism observation

The drafting session is **a meta-consumer** of the mechanism, not a downstream phase consumer (the Phase 9 implementation session will be the second downstream consumer; Phase 9 entry research was the first). Discipline applied this session:

| Layer | Surface | Evidence |
|---|---|---|
| 1 — meta-test | `principles/08-prior-art-cited.test.ts` | green throughout (no new research files this phase; PHASE-9-PROMPT.md is a prompt artifact, not a research file — outside principle 08 scope) |
| 2 — process gate | `EXECUTION-PLAN.md §5.5 Step 1.5` | not invoked — no fresh capability surfaced during prompt drafting (matrix closed at 5 SSOT entries; this session reuses verdicts) |
| 3 — developer-time | `.husky/pre-push` + commit trailer | 4 task commits + 1 retro = 5 commits; none crossed the capability-detection threshold (all are ≤300-LOC docs edits to PHASE-9-PROMPT.md), so trailers were `skipped — …` with substantive ≥20-char rationale per CLAUDE.md syntax |

**SSOT growth:** 0 new entries (matrix stays at 5: #1 Autogrep, #2 Netlify, #3 fitness functions, #4 Factory ESLint Plugin, #5 Anthropic web_search). Expected outcome — the entry research closed scope for Phase 9.

**Coverage gap surfaced post-merge** (recorded by user-side `f92f60b` on this branch base): the Phase 9 entry research checked 5 candidates for §13.10 #2; AIF `/aif-evolve` and Oh My ClaudeCode family were missed. This is **not a self-application failure of the drafting session** — it's a downstream-discipline note about the prior session. The drafting session incorporated the gap into [PHASE-9-PROMPT.md §1, §2, §4 T1](../PHASE-9-PROMPT.md) so the next entry-research session must include the 7-candidate base.

---

## Stop-rule audit

- **§6.0 #1 NO LLM at runtime** — held trivially (docs-only drafting; no runtime).
- **§6.0 #2 NO new explicit deps** — held; `package.json` untouched.
- **§6.0 #3 NO yargs/commander** — held; no CLI changes.
- **§6.0 #4 NO Path B AST gen** — held trivially.
- **NO `--no-verify` / force-push / emoji** — held across all 5 commits.
- **Atomic commits, conventional-commits, English subjects** — held (5/5).
- **≤500 LOC per shipped reference** — held (PHASE-9-PROMPT.md = 307; this retro will close ≤200).
- **Apply principle to itself** — held: PHASE-9-PROMPT.md §4 T1 sub-task #3 instructs the implementation session to apply principle 08 discipline to the §13.10 #2 trigger edit (co-locate the policy edit with the recipe-count metric driving the trigger).

---

## Time-vs-plan ratio

- Target per meta-prompt §0: 1-2 hours single session.
- Actual: ≈40 min wall-clock from branch checkout to this retro draft. Same compression as Phase 4-9-entry.
- Ratio: well under target. Single-session burn mode held.
- >2× trigger: did NOT fire (no RCA needed).

---

## Self-reflection block

1. **Branch state surprise — non-failure outcome.** The branch checkout was to `docs/phase-9-prompt-draft` per the meta-prompt §1, but the user-side commit `f92f60b` landed on the parallel `docs/phase-9-coverage-gap` branch (forked from the same `5c6f26f` HEAD) before T1's first commit. Reflog shows an external `checkout` between this session's actions. Reasonable call: stay on `docs/phase-9-coverage-gap` (where T1 already landed), incorporate the user's coverage-gap context into PHASE-9-PROMPT.md as a delta-fix (T3), continue. Alternative considered: reset T1 and re-fork from `5c6f26f`. Rejected — throws away the user's relevant context for §13.10 #2 candidate-base discipline. The branch-name decision drift (prompt-draft → coverage-gap) is purely cosmetic; the prompt artifact at the merge target is what matters.
2. **Open question resolutions are decisions, not deferrals.** Per memory note about the 2026-05-07 reviewer/orchestrator role-separation incident, this session refused to defer any of the 7 open questions to the implementation session. All 7 are answered in §1.1 with rationale + alternative-rejected; the implementation session's hard-constraint #8 forbids silent re-litigation. The pattern — **the orchestrator that drafts a prompt commits the strategy decisions; the executing session runs them** — is the durable separation of concerns; this retro affirms it.
3. **Naming decision rationale was not obvious upfront.** The Phase 9 entry retro Self-reflection #5 explicitly flagged that Phase 9 implementation could land as a Phase 8.X-style sub-phase. The drafting session resolved Phase 9 (full phase) per the cross-ref-churn argument, but the alternative is defensible — Phase 8.X micro-phases are cheaper retros. Recording the alternative-rejected entry in §1.1 keeps the decision auditable.
4. **f92f60b context integration is small but load-bearing.** Three surface edits in T3: §1 paragraph, §2 row 9 cross-ref update, §4 T1 sub-task #3 candidate-base note. The 5+2=7 candidate base requirement is now actionable for the next entry research session, not just descriptive. This converts the user's «recording» commit into an enforceable downstream constraint without re-opening the §13.10 #2 verdict.
5. **Self-review surfaced one cross-ref typo (T4).** A Prior-art trailer example inside backticks referenced `docs/meta-factory/phase-9-entry-research.md` as if PHASE-9-PROMPT.md were at the repo root; corrected to plain text inside the trailer example since the link was inert under backticks anyway. **Lesson:** trailer examples should always use plain prose for path references, not markdown links — backticks render the link inert and the reader pastes the raw text.
6. **Five commits is at the floor of the «4-6» acceptance band.** Splitting differently (e.g. Decision-body as its own commit before §1-§4) would have hit 5-6; folding T3 (f92f60b context delta-fix) into T4 (self-review) would have hit 4. Five is the right grain for this scope. Same off-by-one heuristic from [retros/phase-9-entry.md Self-reflection #1](phase-9-entry.md) applies: «1 atomic commit per logical change» works when changes are clearly distinct; tighter packing risks coupling.

---

## Open questions for Phase 9 implementation session

These carry forward into [PHASE-9-PROMPT.md §6](../PHASE-9-PROMPT.md) NOT-to-do constraints; they do **not** require resolution in the implementation session — they're informational reminders for retro time:

1. **Principle 08 scope widening** (carried from [retros/phase-9-entry.md Open Q #5](phase-9-entry.md)) — observed-zero-FP after Phase 9 entry will likely become observed-zero-FP after Phase 9 implementation; widening the principle to include retros and aif-comparison.md becomes safer with each consumer. Phase 10 entry candidate, not Phase 9 work.
2. **Coverage-gap candidate base for next §13.10 #2 re-eval** — must include AIF `/aif-evolve` + Oh My ClaudeCode family per `f92f60b`. PHASE-9-PROMPT.md §4 T1 sub-task #3 records this as a candidate-base note in open-questions.md.
3. **Phase 8.8 mechanism FP rate after second downstream consumer** — Phase 9 implementation will be the second consumer; cumulative observed FP rate informs the principle 08 scope-widening decision in #1.

---

## Versioning

- **2026-05-08** — Phase 9 prompt drafting close, **GO** verdict for Phase 9 implementation. 4 atomic doc commits + this retro = 5 total on `docs/phase-9-coverage-gap` (forked from `main` HEAD `5c6f26f`; user-side `f92f60b` landed on the same branch base before T1). Single-session burn mode (Opus 4.7) ≈40 min wall-clock — same compression as Phase 4-9-entry. PHASE-9-PROMPT.md = 307 LOC ≤500 cap; cross-refs resolved post-T4 fix; principle 08 + 246/246 test suite + `make self-audit` green throughout. The drafting session resolved 7 open questions inline; the implementation session is hard-constrained from re-litigating them per §3 #8.
