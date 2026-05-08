# Research patches

Accumulator for prior-art coverage gaps surfaced after a phase entry research session has merged. Each file documents one gap, mirrored from the AIF `/aif-evolve` skill-context patch format.

## Why this exists

[Phase 8.8](../retros/phase-8.8.md) formalised the **recording** layer of build-vs-reuse (SSOT + principle 08 + `Prior-art:` commit trailer + pre-push hook). Phase 9 entry research surfaced a methodology gap: nothing forced the **searching** layer — a 5-candidate context7 sweep produced a load-bearing «no production analog» claim that missed two production-grade candidates in adjacent paradigms (AIF `/aif-evolve`, Oh My ClaudeCode family). [Commit `f92f60b`](https://github.com/Yhooi2/rules-as-tests-aif/commit/f92f60b) recorded the gap; [`.claude/rules/phase-research-coverage.md`](../../../.claude/rules/phase-research-coverage.md) formalised the methodology; this directory is where future gaps land.

## File format (one patch per gap)

Filename: `YYYY-MM-DD-<short-slug>.md` (date the gap was discovered, not the date of the original lookup).

Required sections:

- **Problem** — concrete statement: which file, which section, which claim was load-bearing, what was missed. Cite by file path + line / section.
- **Root Cause** — which checklist item from [`.claude/rules/phase-research-coverage.md` §1](../../../.claude/rules/phase-research-coverage.md) failed; or, if no item maps, propose a 6th-item candidate. Cite the matching anti-pattern tag from §4.
- **Solution** — what the recording-side fix was (commit reference, doc edit, SSOT amendment if applicable). This is the *backstop* — the patch's primary value is Prevention below.
- **Prevention** — the operationalisable rule that, if applied at the time of the original lookup, would have caught the gap. Form: «before closing X, also check Y». Generic guidance («be more careful») is rejected.
- **Tags** — `#kebab-case` tags, one per failure mode. Reused across patches; aggregation triggers below.

Body length: ≤100 LOC per patch. Longer narratives belong in retros, not here.

## Aggregation / distillation

When a tag accumulates on **≥3 patches**, the next phase entry research session (or a dedicated tooling session) distills the prevention rules into [`.claude/rules/phase-research-coverage.md` §1](../../../.claude/rules/phase-research-coverage.md) checklist. Threshold mirrors AIF's «6/10 patches → priority-check rule» heuristic, scaled down to our smaller corpus.

Distillation is recorded in the rule's commit message — citing source patches by path — so the audit trail from accumulated incident → operational rule remains explicit.

## Index

- [`2026-05-08-aif-omg-coverage-gap.md`](2026-05-08-aif-omg-coverage-gap.md) — first patch; AIF `/aif-evolve` + Oh My ClaudeCode missed in Phase 9 entry §4.A1.
