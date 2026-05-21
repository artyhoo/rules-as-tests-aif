# tests/eval — session-bound behavioural eval

> **Authoritative for:** the session-bound, no-paid-LLM **behavioural eval** that measures whether the end-of-turn claim-scan hook changes the AI's self-verification behaviour (Q1 of the autonomous-self-audit line). Run cadence, metric definition, and the ≥+15pp promotion gate live here.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The hook itself — see [.claude/hooks/end-of-turn-reminder.sh](../../.claude/hooks/end-of-turn-reminder.sh). The empirical methodology + confound register — see [docs/meta-factory/research-patches/2026-05-21-instruction-compliance-empirical.md](../../docs/meta-factory/research-patches/2026-05-21-instruction-compliance-empirical.md).

## What this is

`claim-groundedness-scorer.py` is a **deterministic, no-LLM** scorer (Q-E2, maintainer decision 2026-05-21) that reads the operator's own Claude Code transcripts and measures the **ungrounded-claim rate**: how often a factual claim (numeric count / `file:line` citation / negative-existence) was *not* backed by a verification tool action in the same turn-cycle.

It is the **funded longitudinal arm** of the instruction-compliance R-phase: re-run it periodically to compare future (claim-scan-active) sessions against the committed baseline, and decide whether the hook earns its keep (§13.34 gate below).

## Why this is NOT a CI gate

Two hard constraints (both deliberate):

1. **No-paid-LLM** ([.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md)) — scoring is pure grep, but the *data* is the operator's private session transcripts under `~/.claude/projects/…`, which do not (and must not) live in the repo or in CI.
2. **Observational, eval-unaware** — the value of the measurement is precisely that the operator was *not* running a labelled experiment ([eval-awareness scales with model size](https://arxiv.org/html/2509.13333v1)). A CI harness would force a synthetic, eval-aware setup.

So this is **operator-run, session-bound** (consistent with `template-audit` / `audit-self` session-bound tooling). No workflow globs `tests/eval/`; the `.py` is inert in CI by design.

## How to run

```bash
# default: cleaned claim-detection, lenient grounding, over all local transcripts
python3 tests/eval/claim-groundedness-scorer.py

python3 tests/eval/claim-groundedness-scorer.py --strict   # modality-matched grounding (tighter)
python3 tests/eval/claim-groundedness-scorer.py --raw      # disable precision cleaning (v1-style)
python3 tests/eval/claim-groundedness-scorer.py /path/to/one.jsonl   # single transcript
```

The scorer's three claim regexes + the precision-cleaning step are kept **identical** to the live hook's `scan_text` block ([.claude/hooks/end-of-turn-reminder.sh](../../.claude/hooks/end-of-turn-reminder.sh)) so the eval measures the same surface the mechanism targets. If the hook's regexes change, update both together (the hook header notes this).

## Metric

- **claim-bearing turn (C):** assistant text matching a hook claim regex.
- **grounded(C):** a verification-class tool_use (`Bash` read/count/search, `Read`, `Grep`, `Glob`, `WebSearch`, `WebFetch`, deepwiki, context7) in the same human→assistant cycle, at-or-before the claim.
- **ungrounded-claim rate = (C − grounded) / C.**

No LLM-judge. `LENIENT` over-counts grounding (upper bound); `STRICT` is tighter — the two differ by ~1pp here, so the estimate is robust.

## §13.34 promotion gate (Q-E3, maintainer decision 2026-05-21)

The claim-scan hook is shipped as an **interim** (salience-only; #96 §11.1). It graduates from interim to kept-mechanism only on empirical evidence from this eval:

> **Promote** the interim iff a future claim-scan-active window shows an **absolute ≥ +15 percentage-point** lift in grounded-rate on the targeted claim class over the [committed baseline](baseline-2026-05-21.md), across **≥ 50 fired instances** — OR (baseline already ≥ 0.85) a **≥ 50% relative reduction in residual ungrounded rate**. Below that, the hook stays interim / a candidate for removal or the H10-pair structural target.

Tracked in [open-questions.md §13.34](../../docs/meta-factory/open-questions.md).
