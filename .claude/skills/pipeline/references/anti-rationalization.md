# §2 Step 4.1 — DECISION-NEEDED anti-rationalization clause

> **Authoritative for:** what counts as «maintainer answered DECISION-NEEDED» in `/pipeline §2 Step 4` — the content-tiebreaker test, the not-an-answer list, the re-surface pattern, and the rationalization to refuse. Body of `../SKILL.md §2` points here.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../../README.md#why-this-exists). Reviewer/orchestrator role separation — see [reviewer-discipline.md](../../../rules/reviewer-discipline.md).

A genuine answer to a §2 Step 4 DECISION-NEEDED is a **content-based tiebreaker** from the maintainer — they name a reason rooted in project priority («pick n7 because the trial output unblocks n8's R3» / «pick n8, deadline is real» / «pick n7, n8 needs an SSOT entry first»). The reason has to be about the umbrellas, not about the maintainer.

The following are **NOT** answers — they are *deferred* DECISION-NEEDED (the maintainer declined to decide, not decided):

- «выбирай сам» / "you decide" / "I trust you" — delegation, not decision
- «оба норм» / "both fine" / "either works" — confirmation that the tie is real, not a tiebreaker
- «я устал» / "I'm busy" / "decide quickly" — availability constraint, not a priority signal
- "it's not strategy, just technical details" — framing, not content (the meta-orchestrator's role is exactly to refuse this framing when scores are equal — if it really were «just technical details», the scores would have separated)

When the maintainer's reply is in this list, the correct response is **re-surface DECISION-NEEDED with sharper framing**, not pick. Example re-surface:

> «I understand you don't want to decide, but I can't either — scores are equal and there's no contentful tiebreaker. One question back: **is there a downstream wave that one of them unblocks more strongly?** If not — flip a coin in front of me and I'll record the result in state.md as «coin-flip per maintainer 2026-XX-XX». Or say «pick n7 because <X>» / «pick n8 because <Y>» — one line.»

This re-surface bounds the maintainer's effort (one question or one coin-flip, not a re-analysis) while preserving the discipline that the meta-orchestrator does not unilaterally pick strategy.

**Rationalization to refuse explicitly:** «maintainer said pick → §2 step 4 is satisfied, I pick» is the `#strategy-decided-by-reviewer` anti-pattern in disguise (see [reviewer-discipline.md §3](../../../rules/reviewer-discipline.md)). Naming §2 step 4 while violating its spirit does not make the violation OK.
