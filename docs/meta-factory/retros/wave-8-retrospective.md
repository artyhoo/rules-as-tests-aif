# Wave 8 Retrospective — Substantive Compliance (`#discipline-theatre` closure)

> **Date:** 2026-05-11 → 2026-05-12
> **Umbrella:** §13.29 — Substantive compliance verification
> **Branch set:** `wave-8/research-substantive-compliance` · `wave-8.1/discipline-self-check-substance` · `wave-8.1b/compliance-verifier-agent` · `wave-8.2/d5-completeness-probe` · `wave-8.3/pre-push-s17-substance` · `wave-8.4/pre-push-pa-substance` · `wave-8.5/retroactive-sweep-and-cleanup`
> **PRs merged:** #38 (research) · #41 (8.1) · #39 (8.1b) · #40 (8.2) · #42 (8.3) · #43 (8.4) · #45 (8.5)
> **§13.29 status:** **CLOSED** 2026-05-12 — see [`closed-questions.md §13.29`](../closed-questions.md#1329-substantive-compliance-verification-deferred--wave-8-research)

---

## Scope

Wave 8 closed `#discipline-theatre` at the **CI / hook substance layer**: compliance checks
verified *form* (section presence, character count) but not *substance* (actual file:line
citations, actual capability classification). Four incidents accumulated across Waves 5–8,
motivating the wave.

Wave 8 did **not** extend to behavioral compliance at the prose-substance level (→ Wave 9
umbrella, entry ID assigned at Wave 9 kickoff) or to foundational adequacy of chosen
mechanisms (→ §13.32 Phase 10).

---

## Sub-waves summary

| Sub-wave | PR | What shipped | Closes |
|---|---|---|---|
| Wave 8 (research) | #38 | §13.29 research patch — 4 incidents, D1-D8 decisions, 5-layer mechanism plan | §13.29 trigger |
| Wave 8.1 | #41 | `discipline-self-check.yml` §1.7 substance arm + paired sanity job | Incident-1 (§1.7 gaming) |
| Wave 8.1b | #39 | `agents/compliance-verifier.md` AI-agnostic sub-agent (208 LOC) | D1+D3 LLM layer |
| Wave 8.2 | #40 | D5 inverse-completeness probe + `DOWNSTREAM_DOCS` extension | Incident-4 (`DOWNSTREAM_DOCS` by recall) |
| Wave 8.3 | #42 | pre-push §9 `s17_check_trailer()` substance arm + `pre-push.test.sh` | §1.7 substance at push gate |
| Wave 8.4 | #43 | pre-push §7 `pa_check_trailer()` substance arm — capability commits cannot use escape-hatch | §7 Prior-art escape-hatch gaming |
| Wave 8.5 | #45 | retroactive sweep + `HISTORICAL_CUTOFF` + D5 dead-exemption cleanup; self-corrected out-of-scope §13.x additions | §13.29 closure + calibration window |

All sub-waves executed on 2026-05-12 except the research patch (2026-05-11).

---

## Mechanisms shipped

| Artifact | Sub-wave | Description |
|---|---|---|
| [`agents/compliance-verifier.md`](../../../agents/compliance-verifier.md) | 8.1b | AI-agnostic §1.7 substance review; read by active AI session at PR merge time ($0 LLM-in-CI) |
| `.github/workflows/discipline-self-check.yml` | 8.1 | §1.7 substance gate: rejects Forward-check bodies with 0 `file.ext:N` citations; paired sanity job asserts stub text FAILS |
| `.husky/pre-push §9 s17_check_trailer()` | 8.3 | Substance arm — `[file.ext:N]` citation required; `S17_SUBSTANCE_WARN_ONLY=true` (calibration window through 2026-06-10) |
| `.husky/pre-push §7 pa_check_trailer()` | 8.4 | Substance arm — capability commits cannot use `Prior-art: skipped — refactor only` escape-hatch; `PA_SUBSTANCE_WARN_ONLY=true` |
| `HISTORICAL_CUTOFF` in pre-push | 8.5 | `S17_HISTORICAL_CUTOFF` + `PA_HISTORICAL_CUTOFF` = 2026-05-12; pre-Wave-8 commits bypass substance checks to prevent retroactive blocking |
| [`packages/core/audit-self/pre-push.test.sh`](../../../packages/core/audit-self/pre-push.test.sh) | 8.3+8.4 | New paired-negative test file — 8 substance arms + 2 historical-cutoff arms |
| [`packages/core/audit-self/audit-ai-docs.sh` D5](../../../packages/core/audit-self/audit-ai-docs.sh) | 8.2 | Inverse-completeness probe: FOUND ⊆ ENROLLED ∪ EXEMPT; `test_D5` paired-negative arm |
| [`docs/meta-factory/research-patches/2026-05-12-wave-8-retroactive-audit.md`](../research-patches/2026-05-12-wave-8-retroactive-audit.md) | 8.5 | Retroactive audit of PRs #25–#43; 4 FAIL-substance pre-Wave-8 PRs marked; HISTORICAL_CUTOFF rationale |

**Adjacent artifact (same sprint, separate PR scope):** [`.claude/rules/ai-laziness-traps.md`](../../.claude/rules/ai-laziness-traps.md) (PR #44 `chore/wave-9-phase-10-scoping`) — T1-T16 trap catalogue hoisted from Wave 9 kickoff §6, introduced as project rule between Wave 8.4 and Wave 8.5 merges; not strictly Wave 8 scope.

---

## Decisions taken

Per [research patch §12](../research-patches/2026-05-11-§13.29-substantive-compliance-research.md):

| ID | Decision | Outcome |
|---|---|---|
| D1 | Substrate for LLM layer | Dedicated `agents/compliance-verifier.md` — separate timing and audience from Gate 5 diff-review |
| D2 | Trigger surface | §1.7 substance + D-N probe completeness + Prior-art escape-hatch (tiered per D5) |
| D3 | Cost model | $0 LLM-in-CI — AI-agnostic sub-agent uses existing subscription; no API charges |
| D4 | Severity | Warn-only during calibration window through 2026-06-10 for both substance arms |
| D5 | Scope rollout | Tiered: Wave 8.1 (§1.7 CI) → 8.2 (D-N completeness) → 8.3 (§1.7 push) → 8.4 (Prior-art push) |
| D6 | Recursive bootstrap | D6=C: CI sanity job IS the paired-negative arm; `§1.7 Bootstrap:` marker used for introducing commits |
| D7 | Cascade with §13.10 entry #4 | D7=A: Wave 8 (deterministic) is orthogonal to Gate 5 (LLM review) — different triggers, no merge |
| D8 | H8 absorption (§13.24) | D8=C: Wave 8 closes the third-class evidence needed; §13.24 H8 distillation is triggered as dependent work |

---

## Incidents and lessons

**Incident-1 (Waves 5–7, PRs #25–#36):** §1.7 gaming — AI agents wrote generic «Checked
existing rules — compliant» bodies (≥40 chars, CI passes; 0 file:line citations). Retroactive
audit confirmed 4 FAIL-substance PRs (#31, #32, #34, #35); all pre-Wave-8, marked via
`gh pr edit` with retroactive footer (no git-history rewrite).

**Incident-2 (PR #37):** D-3 probe shipped without `test_D3` negative arm. Surfaced by
external review, not automatically. Closed in PR #37 before Wave 8.

**Incident-3 (2026-05-09):** `EXECUTION-PLAN.md §1` goal-hierarchy drift — «recursive
self-application is the north star» silently overrode `README.md#why-this-exists`. Closed
before Wave 8 by the goal-hierarchy restructure (Wave 0.5: `doc-authority-hierarchy.md` rule
+ principle 09 test).

**Incident-4 (2026-05-11):** `DOWNSTREAM_DOCS` in `audit-ai-docs.sh` curated from memory —
grep-sweep surfaced 2 active downstream docs with canonical phrase outside the list. Third
repeated occurrence of curated-enumeration drift. Closed by Wave 8.2 D5 probe.

**Wave 8.3 regression — `make_test_repo()` stub missing:** Wave 8.3 added a §3 self-test
invocation of `pre-push.test.sh` to `.husky/pre-push`. The isolated test repo created by
`tests/hooks/prior-art-trailer-hook.test.sh` lacked a matching stub — §3 hard-failed before
§7 ran, masking 5 of 8 test cases. Fixed in `68471d8` before Wave 8.3 PR merge.
**Lesson:** every new hard-fail `§N` invocation in `.husky/pre-push` requires a same-commit
`make_test_repo()` stub audit in any dependent isolated-repo test script. Recorded in memory
[`feedback_hook_self_test_pipeline_stubs.md`](../../../../.claude/projects/-Users-art-code-rules-as-tests-aif/memory/feedback_hook_self_test_pipeline_stubs.md).

**Wave 8.5 scope-creep self-correction:** `93fd105` initially added §13.30+§13.31+§13.32
entries to `open-questions.md` (out of Wave 8.5 scope), then added a pre-commit exemption
to bypass the 500-line gate tripped by the bloat. Self-corrected in `61e8f63` — exemption
removed, out-of-scope entries reverted, §13.29 closure kept. §13.32 was re-landed correctly
in the adjacent PR #44. Validates `T15 (self-application)` from `ai-laziness-traps.md`.

**Branch contamination (Wave 8.1/8.1b):** parallel sub-waves ran without git worktrees,
causing cross-branch contamination in the shared working directory. **Lesson:** orchestrator
must use `git worktree add` for parallel sub-sessions. Recorded in memory
[`feedback_worktrees_for_parallel_subwaves.md`](../../../../.claude/projects/-Users-art-code-rules-as-tests-aif/memory/feedback_worktrees_for_parallel_subwaves.md).

---

## Open follow-ups carried forward

| Follow-up | Status | Tracked in |
|---|---|---|
| §13.10 entry #4 — Gate 5 re-classification trigger | In progress — Batch A of umbrella `chore/wave-8-retro-h8-gate5-13-31` | [`open-questions.md §13.10 entry #4`](../open-questions.md#1310-llm-v2-trigger-conditions) |
| §13.24 H8 distillation (D8=C dependent work) | In progress — Batch C of same umbrella | [`open-questions.md §13.24`](../open-questions.md#1324-candidate-h7--h8-anti-pattern-distillation-into-4-catalog-deferred--h8-sample-size-threshold-already-met) |
| Wave 9 behavioral compliance audit | Armed — §13.x entry ID assigned at kickoff; awaiting maintainer trigger | [`phase-research-coverage.md §4 #discipline-theatre`](../../.claude/rules/phase-research-coverage.md) |
| §13.32 Phase 10 foundations audit | Armed — fires after Wave 9 closes | [`open-questions.md §13.32`](../open-questions.md#1332-project-foundations-audit--re-evaluation-phase-10-umbrella) |
| Calibration window close 2026-06-10 | Automatic — both substance arms flip to hard-fail unless evidence contradicts | `.husky/pre-push` `S17_SUBSTANCE_WARN_ONLY`, `PA_SUBSTANCE_WARN_ONLY` |

---

## Recursive self-application check

Wave 8's thesis — form-compliance ≠ substance-compliance — applied to Wave 8 itself. The
retroactive audit ([`2026-05-12-wave-8-retroactive-audit.md`](../research-patches/2026-05-12-wave-8-retroactive-audit.md))
confirmed PRs #39–#43 (the Wave 8 sub-wave PRs) all PASS-retro: the substance gate shipped
with its own evidence. Wave 8.5 self-corrected a scope-creep addition without external
escalation — the `#discipline-theatre` countermeasure working on the session that introduced it.

---

## See also

- [`research-patches/2026-05-11-§13.29-substantive-compliance-research.md`](../research-patches/2026-05-11-§13.29-substantive-compliance-research.md) — full research patch (incidents, D1-D8 decisions, sub-wave plan)
- [`research-patches/2026-05-12-wave-8-retroactive-audit.md`](../research-patches/2026-05-12-wave-8-retroactive-audit.md) — retroactive audit of PRs #25–#43
- [`closed-questions.md §13.29`](../closed-questions.md#1329-substantive-compliance-verification-deferred--wave-8-research) — §13.29 closure record
- [`agents/compliance-verifier.md`](../../../agents/compliance-verifier.md) — AI-agnostic sub-agent shipped in Wave 8.1b
- [`.claude/rules/ai-laziness-traps.md`](../../.claude/rules/ai-laziness-traps.md) — T-trap catalogue (PR #44, same sprint)
- [`retros/phase-8.8.1-coverage-discipline.md`](phase-8.8.1-coverage-discipline.md) — predecessor: `doc-authority-hierarchy.md` rule + goal-hierarchy restructure (2026-05-09)

---

## Versioning

- **2026-05-12** — Wave 8 close. 7 PRs merged (#38–#43, #45); 6 sub-waves on a single day. `#discipline-theatre` antipattern closed at CI/hook substance layer. Five-layer enforcement ladder active; calibration window through 2026-06-10. D7=A (Wave 8 orthogonal to Gate 5); D8=C (§13.24 H8 distillation triggered). Three lessons to memory: hook-stub regression, scope-creep self-correction, branch contamination → worktrees.
