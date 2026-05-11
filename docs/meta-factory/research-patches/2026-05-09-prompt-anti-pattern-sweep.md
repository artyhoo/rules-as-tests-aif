<!-- scope:methodology -->
# 2026-05-09 prompt anti-pattern sweep — `#operational-doc-redefines-goal` in filename-exempt prompts

> Verification artifact for PR #16 reviewer's MINOR finding: the goal-hierarchy restructure (PR #16) added [`.claude/rules/doc-authority-hierarchy.md`](../../../.claude/rules/doc-authority-hierarchy.md) with §2 «Required for» / «Folder-level authority» / «Filename-convention authority» categories. The L2 audit pass added Authoritative-for headers to 30+ docs in the «Required for» + «Folder-level» categories, but did NOT sweep the «Filename-convention authority» category (transient `*-PROMPT.md` files) for §4 anti-patterns. Two of nine prompt files contained live `#operational-doc-redefines-goal` violations.
>
> **Verdict:** mitigated via per-file historical disclaimer (parallel to `self-application.md:8` precedent); rule's filename-convention exemption preserved.

## Problem

Two prompts, both dated 2026-05-07 (pre-2026-05-09 fix), contained authority-claim language contradicting the post-fix README hierarchy:

- [docs/meta-factory/ORCHESTRATOR-START-PROMPT.md:20](../ORCHESTRATOR-START-PROMPT.md) — «**Главная цель проекта (north star):** рекурсивное применение собственного тезиса. … **Self-application — invariant каждого слоя, не отдельная фича.**»
- [docs/meta-factory/REVIEWER-PROMPT.md:29](../REVIEWER-PROMPT.md) — «**Project goal (north star):** rules-as-tests-aif декларирует "documents lie; tests don't". … Это и есть **философский blocker**, который Phase 1 закрывает.»

Both files are filename-exempt from §2 header rule per [doc-authority-hierarchy.md §2](../../../.claude/rules/doc-authority-hierarchy.md) — `*-PROMPT.md` is listed under «Filename-convention authority». But §4 anti-pattern `#operational-doc-redefines-goal` explicitly names «phase prompt» as in-scope. Filename exemption blocks the *header requirement*, not the *anti-pattern check*.

A third occurrence ([REVIEWER-PROMPT.md:56](../REVIEWER-PROMPT.md), «§1 (north star)») was a cosmetic reference to the pre-fix EXECUTION-PLAN §1 framing, not an authority claim — fixed in the same commit.

## Root Cause

Anti-pattern: [`#recursive-self-application-gap`](../../../.claude/rules/phase-research-coverage.md) (§4 of phase-research-coverage rule).

PR #16 L2 audit pass scope was «add headers to all docs in §2 Required-for + Folder-level categories». The §4 anti-pattern sweep on filename-exempt category was procedurally not included — the recursive self-application check (BLOCKER §5.A from reviewer pass) was applied at the *header rule* level (own rule file enforced by own [principle 09 test](../../../packages/core/principles/09-doc-authority-hierarchy.test.ts)) but not at the *anti-pattern §4* level (own rule's anti-pattern textual signatures applied across the project doc tree).

The reviewer pass on PR #16 surfaced the gap as MINOR finding, exercising rule §4's own «surface as a coverage-gap patch» mechanism — i.e. expected post-merge follow-up, not blocker.

## Solution

Per-file historical disclaimer block at top of each affected prompt, mirroring [`self-application.md:8`](../self-application.md) precedent for handling pre-2026-05-09 framing:

```markdown
> **Historical artifact (YYYY-MM-DD).** Do not use as project goal source. Project goal is owned by [README.md#why-this-exists](../../README.md#why-this-exists); the «<offending phrase>» framing in §«<section>» below predates the 2026-05-09 goal-hierarchy fix. Read as design context only — anti-pattern `#operational-doc-redefines-goal` per [.claude/rules/doc-authority-hierarchy.md §4](../../.claude/rules/doc-authority-hierarchy.md). Filename-exempt from §2 header rule (`*-PROMPT.md` convention); explicit disclaimer per same rule's escape hatch.
```

Other 7 prompt files (PHASE-2/3/3-RETROFIT/4/5/6/9/9-ENTRY-PROMPT.md) verified clean by `grep -nE "(north star|central thesis|main goal|Главная цель)" docs/meta-factory/*-PROMPT.md docs/meta-factory/PHASE-*-PROMPT.md` — no further violations.

## Prevention

PRIORITY CHECK rule: when adding or modifying a §4 anti-pattern in [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md), run that anti-pattern's textual signature against **all** docs the rule applies to, including filename-exempt categories. Filename exemption is a header-requirement scope, not an anti-pattern scope.

Operationalisable form: «before closing rule's §4 anti-pattern addition, sweep `docs/**/*.md` and `.claude/**/*.md` for the anti-pattern's textual signature; surface findings as patch entries.»

L3 trigger ([open-questions.md §13.21](../open-questions.md)) extends this to generated user-facing docs (templates/, .ai-factory/, generated RULES.md/CLAUDE.md/AGENTS.md). When L3 work activates, the same anti-pattern sweep applies to generated-doc surfaces.

Promotion path when this gap shape recurs: if a 2nd «filename-exempt category missed in anti-pattern sweep» patch lands within 6 months, distill the PRIORITY CHECK rule into [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md) as a 7th checklist item («§4 anti-pattern signatures sweep across full doc tree, including filename-exempt categories»).

## Tags

`#recursive-self-application-gap` `#operational-doc-redefines-goal` `#filename-exempt-anti-pattern-blind-spot`
