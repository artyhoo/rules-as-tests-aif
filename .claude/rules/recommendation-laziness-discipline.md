# Recommendation-laziness discipline — mechanism layer

> **Class:** C — prose-only, no companion executable artifact. Promotion criterion in §6.
> **Authoritative for:** mechanism layer + named anti-pattern catalogue entry for inline-chat verdict-without-evidence pattern; promotion criterion in §6.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Recommendation discipline rule itself — see [phase-research-coverage.md §1.12](phase-research-coverage.md) (parent rule, source-of-truth for prose discipline). T-trap catalogue — see [ai-laziness-traps.md §2](ai-laziness-traps.md) (sibling enforcement surface).

> **Origin:** 2026-05-25. Codifies the mechanism layer that the parent rule [`phase-research-coverage.md §1.12`](phase-research-coverage.md) (introduced 2026-05-22) explicitly defers to a separate enforcement scaffold. R-phase: [`docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md`](../../docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md) (merged PR #206/#207). Benchmark: [`docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md`](../../docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md) (merged PR #210; verdict: Option D = A+C only, B dropped).

## §1 Problem

R-phase §1.1 documented 3 inline-verdict events in a single session under a live H1 always-on reminder — evidence that the H1 reminder alone is empirically insufficient. The parent rule [`phase-research-coverage.md §1.12`](phase-research-coverage.md) introduces the prose discipline («Lead with a reasoned recommendation; act when the best path is clear») but leaves enforcement open with the note: «Mechanical enforcement of (1) is blocked until the recommendation-detector recall is fixed — prose-only meanwhile.» This file is the mechanism layer that fills that enforcement gap, scoped to what the benchmark verdict permits. Full evidence base at [`docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md §0/§1.1`](../../docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md).

## §2 Trigger (when this rule fires)

An AI session is about to issue an **inline-chat verdict, recommendation, or design call** — any of:

- Verdict words: `ADOPT`, `BUILD`, `REJECT`, `DEFER`
- Directive phrases: «we should X», «use Y», «pick A over B», «лучше Z», «выбираем W», «recommend X»

— **without having run at least one evidence-bearing tool call** (`Bash | Read | Grep | Glob | WebFetch | WebSearch`) in the same turn. The recommendation is fabricated from training-data or session-recall rather than grounded in present-moment verification.

## §3 The rule

Parent rule [`phase-research-coverage.md §1.12`](phase-research-coverage.md) states:

> «Lead with a reasoned recommendation; act when the best path is clear.»

**Operationalisation:** Before issuing any verdict or recommendation in dialogue, run **at minimum one evidence-bearing tool call** in the same turn and **quote its output** (file:line, command result, or fetched excerpt). The recommendation is then backed rather than vibes-only.

**This file does NOT redefine `phase-research-coverage.md §1.12` — it operationalises it.** The prose discipline source-of-truth remains §1.12. This file is the mechanism layer that §1.12 explicitly defers.

## §4 Enforcement channel

Two layers ship per Option D = A+C benchmark verdict:

**(A) H1 wording in `.claude/hooks/inject-session-bootstrap.sh:11`** (Sub-wave A of this I-phase) — always-on UserPromptSubmit injection; deterministic; fires every turn. Channel per [`rule-enforcement-channel-selection.md §4`](rule-enforcement-channel-selection.md): UserPromptSubmit digest, always-on.

**(C) T-trap in `.claude/rules/ai-laziness-traps.md §2`** (Sub-wave C of this I-phase) — expected **T21 per R-phase §1.4 (b) pre-resolution; cross-reference amendable in follow-up commit if Sub-wave C lands with a different number**. Auto-loaded session-start via `.claude/rules/*.md` CC convention; path-scoped reinforcement via `inject-matching-rule.sh` when touching `.claude/rules/**`.

**(B) Stop-hook scan — EXPLICITLY DROPPED** per [`narrow-b-benchmark.md §1.5`](../../docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md):

> `FP_rate = 84.2% (Wilson 95% CI: [62%, 95%], n=19) >> 20% threshold → Drop narrow-B from Option D. Option D = A+C only.`

Not shipped. Re-introduction requires a new R-phase + benchmark (per benchmark §Prevention §4 — «двухуровневый подход»: narrow dict + lemma-based matching = future R-phase fork).

**Recall caveat (load-bearing per kickoff §5 S3):** any post-hoc grep tooling proposed in the future MUST account for the benchmark's recall caveat. Benchmark §1.3 Метрики block computes `recall = TP/(TP+FN) = 3/3 = 1.0 (грубо; n=10 no-match sample only)`. Benchmark §T19 Cold-QA explicitly downgrades this: «recall=1.0 on n=10 no-match sample is speculative; не следует интерпретировать как `filter не пропускает настоящих verdicts`. Настоящий recall, скорее всего, низкий: большинство genuine verdict acts находятся в длинных turns (>750 chars) и turns с tool_use.» Automated grep cannot claim catch-rate without a manual classification sample on a representative production corpus.

## §5 Anti-patterns

- **`#inline-verdict-without-evidence`** — verdict or recommendation issued in dialogue without a preceding evidence-bearing tool call in the same turn. Specialisation of parent anti-pattern [`#recommendation-skips-own-discipline`](phase-research-coverage.md) (§4 of parent rule) onto the inline-chat surface. Cross-reference to T21 (expected; see §4 (C) caveat above).

## §6 Promotion to Class A / retirement

**Promotion to Class A (principle test):** when 3+ documented in-session violations within 6 months are recorded — each with file:line evidence in `.claude/rules/` or `research-patches/` — consider a mechanical post-hoc grep gate. Per benchmark §1.3 + §T19 recall caveat (recall=1.0 on n=10 is speculative — true recall likely low; most genuine verdict acts live in long turns >750 chars or turns with tool_use), any such gate **MUST** include a manual classification sample on a representative production corpus before claiming any catch-rate. Automated metrics alone are insufficient.

**Retirement:** 12 consecutive months with zero recorded incidents → archive to `CLAUDE.md` prose. Matches peer-rule retirement criteria in [`reviewer-discipline.md §4`](reviewer-discipline.md) and [`parallel-subwave-isolation.md §4`](parallel-subwave-isolation.md).

## See also

- [`phase-research-coverage.md §1.12`](phase-research-coverage.md) — parent rule (prose discipline source-of-truth; this file operationalises it, does not supersede it)
- [`phase-research-coverage.md §1.11`](phase-research-coverage.md) — sibling rule (verify-against-source-of-truth before claim or ship-step)
- [`phase-research-coverage.md §4 #recommendation-skips-own-discipline`](phase-research-coverage.md) — named anti-pattern this rule operationalises (§5 above is its inline-chat-surface specialisation)
- [`ai-laziness-traps.md §2`](ai-laziness-traps.md) — T-trap catalogue (T21 expected per Sub-wave C R-phase pre-resolution; amendable in follow-up if Sub-wave C lands with different number)
- [`docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md`](../../docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md) — R-phase design (merged PR #206/#207)
- [`docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md`](../../docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md) — benchmark patch (merged PR #210; B-drop verdict)
- [`doc-authority-hierarchy.md §3`](doc-authority-hierarchy.md) — header format spec this file follows
- [`rule-enforcement-channel-selection.md §3-§4`](rule-enforcement-channel-selection.md) — channel-selection rationale (A = always-on UserPromptSubmit; C = path-scoped rule injection)
