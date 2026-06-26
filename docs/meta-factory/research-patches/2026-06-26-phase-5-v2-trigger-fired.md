<!-- scope:stage-2-generate-path -->
# Phase-5 v2 trigger fired — sequencing-commitment record (issue #646)

**Date:** 2026-06-26 (gap discovered during #646 closure verification) · **Author:** #646-closure session

## Problem

Issue [#646](https://github.com/Yhooi2/rules-as-tests-aif/issues/646) «Sequencing commitment (hybrid decision)» mandated: *on Stage 1 close → the merging session writes `docs/meta-factory/research-patches/<date>-phase-5-v2-trigger-fired.md` (fires the deferred Phase-5 v2 trigger) AND opens the Stage 2 tracking umbrella.*

Both stages then shipped:

- **Stage 1** (curated `react-spa` + `react-native` presets) — merged via #713/#714; `done.md` at [`multi-stack-install-wiring-iphase/done.md`](../../../.claude/orchestrator-prompts/multi-stack-install-wiring-iphase/done.md) (2026-06-24).
- **Stage 2** (live-LLM generate-path, Path A only) — `stage-2-generate-path` umbrella, Stages 0–5 merged #668/#674/#680/#686/#690/#691; `done.md` (2026-06-23). Its kickoff backward-check ([`stage-2-generate-path/kickoff.md:6,90`](../../../.claude/orchestrator-prompts/stage-2-generate-path/kickoff.md)) states it «fires the deferred Phase-5 v2 trigger ([open-questions.md §13.10](../open-questions.md))».

**The gap:** the Stage 2 umbrella *built* the live-LLM path (the first real LLM v2 invocation in L2/L3/L4) but **never updated [open-questions.md §13.10](../open-questions.md) to record the trigger as fired** — §13.10 areas 1 (L2 LLM research) and 2 (Path A L3 gen) stayed marked `OPEN, v2 trigger` despite both having shipped. Nor was the mandated `*-phase-5-v2-trigger-fired.md` patch written. Doc-vs-reality drift: the SSOT for trigger conditions said «not yet invoked» while the code path was live and merged — exactly the failure the project's thesis («documents lie; tests don't») exists to surface.

## Root Cause

Process gap: an umbrella whose backward-check **claims** it fires a deferred trigger has no enforced step that updates that trigger's SSOT status at `done.md` time. The `done.md` convention ([CLAUDE.md «Umbrella closure convention»](../../../CLAUDE.md)) records the closure but does not cross-check the umbrella's own «fires trigger X» claim against X's recorded status. Maps to the focus-tunnel family in [`phase-research-coverage.md §4`](../../../.claude/rules/phase-research-coverage.md) — `#recursive-self-application-gap` (discipline applied to the new code, not to the deferred-question register the code discharges).

## Solution

This patch + the paired [open-questions.md §13.10/§13.11](../open-questions.md) edits (same PR):

- §13.10 area 1 (L2 LLM research) + area 2 (Path A L3 gen) → marked **FIRED via Stage 2** (#668–#691, Path A only), with evidence pointer. Areas 3 (Path B AST gen), 4 (Gate 5 two-AI review), 5 (Gate 3 Stryker) remain `OPEN` — explicitly OUT-of-scope-HARD per [`stage-2-generate-path/kickoff.md:60`](../../../.claude/orchestrator-prompts/stage-2-generate-path/kickoff.md), their own later triggers.
- §13.11 (cost model) → trigger condition («first LLM v2 invocation») noted as **fired**, but the cost-tracking infrastructure stays deferred: Stage 2 chose install-time-on-consumer-subscription with `$0` paid-LLM-in-CI, so no cost-log was built. Status stays `OPEN` with a firing note.

## Prevention

**Before writing an umbrella's `done.md`, if the umbrella's kickoff backward-check claims it «fires deferred trigger X / closes deferred question Y», update X/Y's status in its SSOT (open-questions / closed-questions) in the same closure step.** A `done.md` that asserts a trigger fired while the trigger's own register still says `OPEN` is the drift. Generic «be thorough» is rejected — the operational form is: grep the kickoff backward-check for «fires|closes … §13.x», then confirm §13.x reflects it before closure.

## Tags

`#recursive-self-application-gap` `#done-md-skips-trigger-status-sync` `#deferred-question-fired-but-not-recorded`
