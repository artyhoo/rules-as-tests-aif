# aif harvest — false-done / internal-park guard (design)

> **Status:** approved (operator, 2026-06-23). Design A of A/B/C.
> **Authoritative for:** the our-side guard that stops `harvest` from silently shipping aif partial/parked work on the ambiguous `done + 0-commits-ahead + dirty-tree` path.
> **NOT authoritative for:** the upstream root cause (aif coordinator/reviewGate `done` transition — out of this repo); project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## Problem

aif-handoff can mark a task `status=done` while its agent **internally parked** subtasks and left the work **uncommitted/partial**, instead of setting `blocked`/`manualReviewRequired`. Live incident 2026-06-23 (stage-2-generate-path Stage 3, task `eb610df4`, $7.44): the agent implemented T1, narrated "parking T2-T6" on a documented spec gap, but by then the task had reached `review` — where `park.ts:139` **refuses** the park ("Finding F": aif resumes a review-stage task to `done` without re-implementing the answer). The park was swallowed; the task completed to `done` with T1 uncommitted. Only manual post-`done` commit-verification caught it before harvest.

The danger: `harvest.ts:143-150` treats `done + 0-commits-ahead + dirty-tree` as a **legitimate rework leg** (the #370/#457 regression class) and does `git add -A` + commit + push **silently**. A parked/partial task has the **same mechanical shape** → harvest would ship the partial work as a PR. The discriminator (complete-rework vs parked-partial) is **semantic**, not mechanical.

## Constraints (discovered, file-verified)

- **Root cause is upstream:** the `done`-transition logic (`coordinator.ts`/`reviewGate.ts`) lives in the aif container, **not** in our `packages/runtime-bridge/`. We cannot cheaply fix it; an our-side guard is the only proportionate option.
- **#370/#457 must not regress:** the 0-ahead auto-commit path exists deliberately for *legitimate* uncommitted rework. The guard must not break that — only stop the **silent** auto-ship.
- **Empirically rare path:** the 0-ahead auto-commit signature (`chore(harvest): commit reworked aif task`) fired only **~2-3 times** in the project's entire git history (`6edc5986`/`a839c1c5` = one task; `bca86532`). So the guard fires rarely → autopilot is preserved for the common `≥1 commit ahead` case (e.g. the *successful* Stage-3 task `a9b3cdc6` had 1 commit → never hits this path).
- **No-paid-LLM:** the guard is pure TS over the already-fetched task record + the existing injected git deps — zero API calls ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).

## Design A (approved)

**Change the `commitsAhead === 0` branch in `harvestTask` (`harvest.ts:144`) from "silently commit+push" to "surface for confirm, unless explicitly confirmed".**

1. **`HarvestOpts` gains `confirmRework?: boolean`** (default falsy). It is the operator's explicit "yes, this dirty tree IS a complete rework — commit and ship it" escape hatch.
2. **`harvestTask`, on `dirty && commitsAhead === 0`:**
   - if `opts.confirmRework !== true` → **return early** with `needsConfirm: true` (NO commit, NO push, NO PR), carrying `parkSignals` (informational) — the operator inspects and re-runs with the escape hatch if it really is a rework.
   - if `opts.confirmRework === true` → proceed exactly as today (`commitAll` + push + PR) — the #370/#457 path, now opt-in instead of silent.
   - The `≥1 commit ahead` path and the clean path are **unchanged** (full autopilot).
3. **`scanParkSignals(task)` — pure, informational, NOT load-bearing.** Greps `implementationLog` + `reviewComments` + `blockedReason` + `plan` for park markers: `/\bpark(ed|ing)?\b/i`, `park-candidate`, `manualReviewRequired`, `blocked_external`, `not mine to override`, the `OPEN_QUESTION_ANCHOR` literal (`## ⏸ OPEN QUESTION`). Returns matched markers. The gate fires on `0-ahead` **regardless** of this scan, so a missed/oddly-phrased park never causes a silent ship — the scan only makes the surfaced message informative ("aif's log shows an internal park → likely incomplete").
4. **`HarvestResult` gains `needsConfirm?: boolean` + `parkSignals?: string[]`.** The CLI (`cli/harvest.ts`), on `needsConfirm`, prints the ambiguity + parkSignals + the exact `--confirm-rework` re-run command, and **exits non-zero without pushing** (graceful, no silent half-egress — matching the existing `dirtyTreeLeftBehind` surfacing style). A `--confirm-rework` CLI flag sets `opts.confirmRework`.

### Why A over B/C (recorded)

- **B (keep silent auto-commit + a park-language scan that gates only on a positive match):** makes the semantic scan *load-bearing* → a false-negative re-ships partial work. Rejected — the failure mode we're fixing must not depend on grep recall.
- **C (post-`done` run the kickoff's acceptance/expected-artifacts before harvest):** most robust but needs a new kickoff convention (declare expected artifacts) + a runner. YAGNI for a path that fires ~2-3×/project-history.

## Test plan (principle 02 paired)

`harvest.test.ts` (DI deps stubbed, no shell-out):
- **(pos)** `0-ahead + dirty + no confirmRework` → `needsConfirm===true`, `commitAll` NOT called, `pushBranch` NOT called.
- **(escape)** `0-ahead + dirty + confirmRework:true` → `commitAll` + `pushBranch` called (the #370/#457 path preserved).
- **(neg, autopilot)** `≥1 commit ahead + dirty` → push existing, `dirtyTreeLeftBehind`, `commitAll` NOT called — unchanged.
- **(neg, clean)** clean tree → push, no commit — unchanged.
- **`scanParkSignals`:** (pos) a log containing "parking T2-T6" → returns a marker; (neg) a clean log → `[]`.

## §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (pure TS, zero API); [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (no upstream tool does "guard our own harvest egress against partial aif work" — BUILD, thin, on the existing module); [dual-implementation-discipline.md §2(iv)](../../../.claude/rules/dual-implementation-discipline.md) (runtime-bridge TS library — capability-commit gate, not delivery-channel triage). Reuses the existing `commitsAhead`/`hasUncommittedChanges` DI deps — no new git seam.
- **Backward-check:** extends `harvest.ts` (does not supersede); preserves the #370/#457 rework path as an opt-in (`--confirm-rework`) instead of removing it; the `dirtyTreeLeftBehind` surfacing precedent is mirrored for the new `needsConfirm` surface. The Stage-3 lesson (memory `stage2-generate-path-state`) is the origin incident.
