# Recommendation-laziness discipline — mechanism layer

> **Class:** C — prose-only, no companion executable artifact. Promotion criterion in §6.
> **Authoritative for:** mechanism layer + named anti-pattern catalogue entry for inline-chat verdict-without-evidence pattern; promotion criterion in §6.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Recommendation discipline rule itself — see [phase-research-coverage.md §1.12](phase-research-coverage.md) (parent rule, source-of-truth for prose discipline). T-trap catalogue — see [ai-laziness-traps.md §2](ai-laziness-traps.md) (sibling enforcement surface).

> **Origin:** 2026-05-25. Codifies the mechanism layer that the parent rule [`phase-research-coverage.md §1.12`](phase-research-coverage.md) (introduced 2026-05-22) explicitly defers to a separate enforcement scaffold. R-phase: [`docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md`](../../docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md) (merged PR #206/#207). Benchmark: [`docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md`](../../docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md) (merged PR #210; verdict: Option D = A+C only, B dropped).

## The discipline

Before issuing any verdict, recommendation, or design call (`ADOPT/BUILD/REJECT/DEFER`, «we should X», «use Y», «pick A over B»), run **at least ONE evidence-bearing tool call** (`Bash | Read | Grep | WebFetch | WebSearch`) in the same turn and **quote its output**.

The H1 always-on reminder (inject-session-bootstrap.sh) is the always-on enforcement channel. This rule is the mechanism layer behind it.

**For ambiguous forks** (no determinate best answer on the project's merits): surface via `AskUserQuestion`, never decide by silent direct action. For clear calls (one option better on the merits): decide and report, do NOT route through a question.

**Anti-pattern:** `#inline-verdict-without-evidence` (T20 in ai-laziness-traps.md).

Full rule + enforcement channels: `.claude/rules/recommendation-laziness-discipline.md` (read on demand).

## See also

- [`phase-research-coverage.md §1.12`](phase-research-coverage.md) — parent rule (prose discipline source-of-truth; this file operationalises it, does not supersede it)
- [`phase-research-coverage.md §1.11`](phase-research-coverage.md) — sibling rule (verify-against-source-of-truth before claim or ship-step)
- [`phase-research-coverage.md §4 #recommendation-skips-own-discipline`](phase-research-coverage.md) — named anti-pattern this rule operationalises (§5 above is its inline-chat-surface specialisation)
- [`ai-laziness-traps.md §2 T20`](ai-laziness-traps.md) — T-trap catalogue (T20 per maintainer override of R-phase §1.4 (b); shipped via PR #212 2026-05-24)
- [`docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md`](../../docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md) — R-phase design (merged PR #206/#207)
- [`docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md`](../../docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md) — benchmark patch (merged PR #210; B-drop verdict)
- [`doc-authority-hierarchy.md §3`](doc-authority-hierarchy.md) — header format spec this file follows
- [`rule-enforcement-channel-selection.md §3-§4`](rule-enforcement-channel-selection.md) — channel-selection rationale (A = always-on UserPromptSubmit; C = path-scoped rule injection)
