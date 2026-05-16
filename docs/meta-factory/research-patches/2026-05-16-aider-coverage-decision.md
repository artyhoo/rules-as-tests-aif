<!-- scope:aider-coverage-decision -->
# Research-patch — Aider coverage decision (§7 Decision C resolution)

> **Date:** 2026-05-16
> **Session type:** Post-1A coordination — companion-target §7 Decision C resolution.
> **Predecessor:** [2026-05-16-companion-target-comparison.md §3.7 + §7 Decision C](2026-05-16-companion-target-comparison.md)
> **T7 template:** Problem → Root Cause → Solution → Prevention → Tags
> **Outcome:** Option C2 confirmed — accept condensed Aider coverage; framework-consumer classification preserved with explicit low-confidence flag.

## §1 Problem

[Companion-target comparison §3.7](2026-05-16-companion-target-comparison.md) closed the Aider verdict on WebSearch + general-knowledge basis only. DeepWiki returned «Repository not found» for `paul-gauthier/aider`. §7 Decision C surfaced three options: (C1) request DeepWiki indexing + re-probe after ~week; (C2) accept condensed coverage with low-confidence flag; (C3) defer to follow-up patch when first concrete interop question arises. This patch records C2 as confirmed.

## §2 Root cause

Two-fold:

1. DeepWiki has not indexed `paul-gauthier/aider`. Outside our control; remediation = manual indexing request + ~week wait.
2. Aider's verdict — **framework-consumer** — is structurally consistent with Cline / Codex / Cursor classifications. All four CLI/IDE runtime targets share the same «AI runtime, not companion at framework layer» problem-class analysis. The verdict rests on **architectural-layer match** (T16 per [ai-laziness-traps.md §2](../../.claude/rules/ai-laziness-traps.md)), not on per-feature inventory. Coverage depth therefore is not load-bearing for the verdict.

## §3 Solution

**Decision: Option C2 confirmed.** Current Aider coverage stays as documented in [companion-target-comparison.md §3.7](2026-05-16-companion-target-comparison.md). No DeepWiki indexing request authored, no follow-up research-patch initiated, no Aider verdict re-opened.

Aider continues classified as **framework-consumer** alongside Cline / Codex / Cursor. The explicit **low-confidence flag** from the parent patch is preserved verbatim — readers consuming the verdict downstream see the caveat.

## §4 Prevention

Open a dedicated follow-up research-patch (`docs/meta-factory/research-patches/2026-MM-DD-aider-interop-<scope>.md`) **only when** one of these triggers fires:

- A concrete Aider interop question surfaces (e.g., consumer reports `.aiderignore` colliding with our `install.sh` artefact placement, or git-mode semantics).
- Aider's feature set evolves materially (e.g., adopts skill or ADR formats interacting with our `.claude/` / `.ai-factory/` surfaces).
- A maintainer-level scope decision elevates Aider from runtime-consumer to companion-class candidate (requires explicit kickoff, not autopilot).

Until any trigger fires, condensed-coverage classification stays load-bearing under T16's «problem-class layer match dominates over per-feature inventory» rule. No drive-by re-investigation of Aider for completeness-aesthetics is warranted.

**Anti-pattern guard:** this is **not** an instance of `#prompt-list-anchoring` ([phase-research-coverage.md §4](../../.claude/rules/phase-research-coverage.md)) — the kickoff floor (7 candidates surveyed) was met; Aider is one of 6 candidates classified non-companion by the same problem-class lens. Closure at condensed coverage is methodologically justified, not premature.

## §5 Tags

`#low-confidence-coverage` `#framework-consumer-classification` `#deepwiki-not-indexed` `#problem-class-layer-match`

## §6 See also

- [docs/meta-factory/research-patches/2026-05-16-companion-target-comparison.md §3.7 + §7 Decision C](2026-05-16-companion-target-comparison.md) — parent patch + DECISION-NEEDED surface
- [.claude/rules/ai-laziness-traps.md §2 T16](../../.claude/rules/ai-laziness-traps.md) — pattern-matching-on-name + problem-class match rule
- [.claude/rules/build-first-reuse-default.md §3](../../.claude/rules/build-first-reuse-default.md) — DeepWiki ask_question protocol + WebSearch alternatives
- [.claude/rules/phase-research-coverage.md §3 + §4](../../.claude/rules/phase-research-coverage.md) — research-patches/ format spec + anti-pattern catalog
