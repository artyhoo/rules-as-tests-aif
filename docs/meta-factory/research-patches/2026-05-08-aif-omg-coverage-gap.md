# Patch 2026-05-08 — AIF `/aif-evolve` + Oh My ClaudeCode coverage gap

## Problem

[`phase-9-entry-research.md` §4.A1](../phase-9-entry-research.md) closed [`open-questions.md §13.10` entry #2](../open-questions.md) ROI re-evaluation **negative** based on a 5-candidate context7 sweep (Cursor, Continue.dev, Factory ESLint Plugin, Cody/Sourcegraph, Aider). The load-bearing claim:

> «No production tool implements LLM-driven «picks from menu» of existing ESLint rules given a codebase. 5-candidate coverage … reinforces the negative-existence claim.»

Two production-grade candidates with structurally adjacent rule-synthesis surfaces were **not** checked at the time:

- **AIF `/aif-evolve`** — LLM-driven rule synthesis from accumulated fix patches in skill-context domain. Not «picks from a menu of ESLint rules» literally, but the same *function* one paradigm step removed: skill-context `priority-check` rules synthesised from tagged patches. Already an integrated dependency per [`aif-comparison.md`](../aif-comparison.md).
- **Oh My ClaudeCode** family (`/code-yeongyu/oh-my-openagent`, `/yeachan-heo/oh-my-claudecode`, etc.) — multi-agent orchestration with autonomous-rule workflows in our exact runtime (Claude Code).

The verdict («Path A LLM gen DEFER») happens to be defensible on other grounds (cost arithmetic, Phase 9 stop-rule conflicts), so the gap did not change the outcome — but the load-bearing *reason* stated in the research file was incomplete. Recorded post-merge in commit `f92f60b` with a §13.10 entry #2 trailer note.

## Root Cause

Three of the five §1 checklist items in [`.claude/rules/phase-research-coverage.md`](../../../.claude/rules/phase-research-coverage.md) failed at the time of the §4.A1 lookup:

1. **§1.1 Own-stack sweep — `#own-stack-blind-spot`.** AIF was treated as «integrated dependency» (used since Phase 0.5 for the bridge surface, formalised in Phase 8.8 as the SSOT consult target) and never queried as a *competitor* for the L3 capability area. AIF `/aif-evolve` lives one directory away in the same library `/lee-to/ai-factory` we already consult — but the consult was scoped to «match existing SSOT entries», not «sweep AIF surfaces for adjacent capability».
2. **§1.3 Semantic-distance check — `#semantic-anchor`.** All 5 candidates were anchored on the surface vocabulary «ESLint rule / linter rule / code review rule». No counter-search at one paradigm step removed («skill self-improvement», «patch distillation», «accumulated lessons learned») — which is exactly where AIF `/aif-evolve` lives.
3. **§1.5 Prompt-list ≠ complete — `#prompt-list-anchoring`.** The Phase 9 entry prompt's Hard Constraint #5 + #10 listed «≥3 candidates per area»; T3.2 + T7 delta-fix landed at 5 (Cursor, Continue, Factory, Cody, Aider). The floor became the ceiling — closing was procedurally compliant but methodologically incomplete because §1.1 + §1.3 above were not run.

§1.4 (adversarial check on negative-existence claims) **also** would have caught this had it been applied — a counter-prompt «if a tool synthesised lint rules from accumulated incident patches, where would it live?» surfaces `/aif-evolve` immediately. Tag `#negative-existence-claim` applies.

## Solution

[Commit `f92f60b`](https://github.com/Yhooi2/rules-as-tests-aif/commit/f92f60b) appended «Entry #2 — Phase 9 entry coverage gap (recorded post-merge 2026-05-08)» to [`open-questions.md §13.10`](../open-questions.md), naming AIF `/aif-evolve` and Oh My ClaudeCode as candidates the next entry-research session reopening §13.10 entry #2 **must** include in its base. The current DEFER verdict carries forward — only the *recorded reason* is now corrected; no re-litigation of A1.

Phase 9 implementation prompt ([`PHASE-9-PROMPT.md`](../PHASE-9-PROMPT.md), shipped via PR #15) propagates the same context into §1 / §2 / §4 T1 sub-task #3 so the next downstream consumer carries the corrected base.

## Prevention

Operationalisable rules — to be cited verbatim in future entry-research session checklists. Each is the load-bearing prevention; «be more careful» is rejected.

1. **Before closing any Step 1.5 prior-art lookup, sweep own-stack dependencies for adjacent-capability surfaces.** Concrete: `grep -E "^/[a-z-]+/" docs/meta-factory/aif-comparison.md` lists integrated-tool surfaces; for each, ask «does this surface ship a feature in the capability area under research?». A «no» must be defended, not assumed.
2. **Before accepting a negative-existence claim, run a category sweep.** Categories to enumerate: agent harnesses, AI orchestration platforms (Claude Code skills, Continue.dev rules, Cursor `.mdc`), IDE-integrated assistants, CLI authoring frameworks, codemod toolkits. Hit ≥1 candidate per category before closing.
3. **Before accepting a 5-candidate sweep as complete, run an adversarial counter-prompt.** Form: «if a production tool implementing X existed, where would it live? what would its docs page say?» If the counter-prompt surfaces a candidate not in the base, the lookup is incomplete and the verdict is provisional.
4. **Treat the prompt-listed candidate floor (typically 3-5) as the *floor*, not the *ceiling*.** Closing at the floor is permitted only if rules 1-3 above also hold. If they don't, the lookup must continue past the listed minimum.

## Tags

`#coverage-gap` `#own-stack-blind-spot` `#semantic-anchor` `#prompt-list-anchoring` `#negative-existence-claim`
