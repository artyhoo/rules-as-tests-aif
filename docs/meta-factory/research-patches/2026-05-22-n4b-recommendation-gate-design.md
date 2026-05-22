<!-- scope:n4b-recommendation-gate-design -->
# Research-patch — N4b recommendation-moment gate: design consolidation

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: Wave **N4b** of [2026-05-21-niche-strategy-and-growth-roadmap.md §4](2026-05-21-niche-strategy-and-growth-roadmap.md) — the *design* of the recommendation-moment enforcement gate, consolidating the iterative rounds 1–5 + a fresh prior-art re-verification. **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)); **NOT re-opening D6** — the maintainer decision (H1 SHIPPED, H2 REJECTED, H10 DEFERRED/trigger-gated) at [open-questions.md §13.39](../../open-questions.md) stands. This patch advances N4b *within* D6 by surfacing two not-yet-shipped low-cost mechanisms; it does not decide to build H10.
> **Date:** 2026-05-22 · **Author session:** Opus 4.7, N4b research (read-only). No code edited, no SSOT row written. Research deliverable only.

---

## §1 — What is already decided (do not re-open)

The five iterative rounds ([2026-05-21-recommendation-gate-iterative*.md](2026-05-21-recommendation-gate-iterative.md), on `main`) resolved D6 ([open-questions.md §13.39](../../open-questions.md)):

- **H1 (UserPromptSubmit reminder)** — SHIPPED (#117). ADOPT, SSOT #20. A *reminder injected pre-turn* ([session-bootstrap digest](../../../.claude/session-bootstrap.md)), not an enforcing gate.
- **H2 (Stop-hook keyword scanner)** — REJECTED. 67% false-positive rate (round-5 table) — keyword detection on prose cannot separate a verdict *act* from a topical *noun*.
- **H10 (`issue_verdict` tool-call schema)** — DEFERRED / trigger-gated. BUILD verdict; the only mechanism that *prevents* (vs catches) an ungrounded verdict, but HIGH build cost for a single maintainer with ~0.75 baseline groundedness (small headroom).

N4b = «design the gate». This patch consolidates that design and re-runs the prior-art check the roadmap's BUILD verdict rests on.

## §2 — Fresh prior-art re-verification (the BUILD claim)

Per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) + the 6-item negative-existence check, the «nobody upstream enforces at the recommendation moment» claim was re-verified 2026-05-22:

- **DeepWiki ×4 repos:** `modelcontextprotocol/servers` (no recommendation-citation gate), `anthropics/claude-code` (code-review plugin = confidence-scored *PR inline comments*, T16 mismatch — not build-vs-reuse verdict discipline), `obra/superpowers` (hard-gates block *tool-use transitions*, not prose-verdict formation — T16 mismatch), `lee-to/ai-factory` (skill security scanner — different problem class).
- **WebSearch ×3:** runtime AI-governance tools (Galileo / FutureAGI / AccuKnox) = production content-policy gateways, not dialogue-time citation discipline. **AgentSpec** (arxiv 2503.18666, ICSE 2026) — trigger→check→enforce DSL for LangChain — is the closest. T16 problem-class check: upstream = «prevent unsafe *tool executions* in autonomous agents»; ours = «enforce citation discipline in dialogue-time *prose* verdicts». Architecture-vocabulary match, domain mismatch (LangChain dep, tool-execution not prose).

**Verdict: BUILD for H10 sustained; ADOPT-VOCABULARY for AgentSpec's «trigger–check–enforce» vocabulary (no runtime coupling).** Falsified if AgentSpec (or an MCP-registry server) ships a no-paid-API recommendation-discipline module for dialogue prose — not found 2026-05-22.

## §3 — The crux: where is a recommendation mechanically observable?

A recommendation is prose in a chat turn. Claude Code has **no mid-stream text-generation hook**. The only observable moments:

1. **Pre-turn** — `UserPromptSubmit` (H1 reminder fires here; cannot see the recommendation itself).
2. **Post-turn** — `Stop` hook `last_assistant_message` (H2 fires here; catch-and-reject *after* generation; 67% FP).
3. **At tool-call** — if the verdict act is converted into a required `issue_verdict(...)` tool call, it is observable via `PreToolUse` *at formation* (H10; the only «prevent» point).
4. **At commit** — committed research-patches / SSOT edits are observable by pre-push + CI (the existing §1.7 channel).

This is why H10 is the only HOT-class *gate* (vs reminder/scanner): it converts the unobservable prose act into an observable tool call. But its cost is the deferral reason.

## §4 — Three mechanism options (build-cost ordered)

| Option | Channel | Detection | Catch / FP | Cost | Status |
|---|---|---|---|---|---|
| **A** — W1 (§1.7 allowlist tightening) + H2-revised regex | pre-push (commit) + Stop (per-turn) | deterministic grep | ≤40% catch; keyword-bypass structural (5/11 cases) | low | H2-revised still REJECTED-class FP risk |
| **B** — W1 + `compliance-verifier.md` «recommendation-discipline audit» section | session-end AI-agnostic sub-agent (operator subscription, **no paid API in CI**) | semantic (agent judgment) | catches authority-framing cases keyword misses; instruction-compliance-dependent | ~zero (one section) | **not yet shipped — recommended** |
| **C** — H10 `issue_verdict` MCP tool | PreToolUse (at formation) | Zod schema (structure) + grep citation-existence (anti-fabrication) | 56% firm catch, 0% FP on controls; *prevents* not catches | HIGH (custom MCP server) | **DEFERRED — trigger-gated per D6** |

## §5 — Recommended path (within D6, not re-deciding it)

1. **W1 — tighten the §1.7 allowlist (≤5 LOC, recommended, surfaced not applied).** `packages/core/hooks/checks/s17.ts` ALLOWLIST currently exempts `docs(research-patches):` commits — so a verdict committed inside a research-patch (e.g. these N7/N4b patches themselves) bypasses the §1.7 substance trailer. W1 = make research-patch commits whose body carries a `## Verdict:`/`## Recommendation:` header require the §1.7 trailer. This closes the «double zero-gate» ([2026-05-16-§17-think-time-gate.md:80]). Code change to a maintainer-owned enforcement file → **surfaced as recommended follow-up, not applied here**.
2. **Option B — extend `agents/compliance-verifier.md`** with a recommendation-discipline audit section (AI-agnostic, no paid API). Cheapest HOT-channel semantic coverage; reuses the existing two-AI-review pattern. `agents/*` is consumer-facing/maintainer-owned per the [Artifact Ownership Contract](../../../CLAUDE.md) → **surfaced, separate PR**.
3. **H10 — build only when the D6 trigger fires** («maintainer commits to a HOT structural gate beyond H1; OR H1 + #98 longitudinal data shows the reminder is insufficient», [open-questions.md §13.39](../../open-questions.md)). Do **not** pre-build (per [build-first-reuse-default.md §5](../../../.claude/rules/build-first-reuse-default.md) — promote on evidence, not anticipation).

**Why not A as primary:** H2-revised's keyword-bypass is structural (≈5/11 cases uncatchable by regex); Option B gets better semantic coverage at similar cost. Falsification of this recommendation: if the #98 longitudinal scorer accrues ≥50 fired instances showing recommendation-class groundedness already ≥+15pp from H1 alone, Option B/H10 become unnecessary; OR if Option B reproduces H2's FP problem in research sessions, restrict it to explicit invocation.

## §6 — Measurement plan (no paid LLM)

Re-use the #97 scorer ([2026-05-21-instruction-compliance-empirical.scorer.py](2026-05-21-instruction-compliance-empirical.scorer.py)) before/after, with the pre-registered effect size ([2026-05-21-instruction-compliance-empirical.md:30](2026-05-21-instruction-compliance-empirical.md)): **≥+15pp absolute groundedness lift on the recommendation claim-class, eval-unaware arm, ≥50 fired instances** (or ≥50% relative residual-reduction if baseline ≥0.85). The `issue_verdict` tool call (if H10 ships) is itself a verification tool-use in the scorer's grounding metric — the scorer detects H10's effect with no modification. Longitudinal accrual at zero API cost (Q-E1).

## §7 — Proposed SSOT row (surfaced, NOT written)

- **#62 (proposed; collision-safe — N7 sibling proposes #60/#61) — AgentSpec** (arxiv 2503.18666, ICSE 2026) — trigger→check→enforce runtime-enforcement DSL · matched: architecture vocabulary for pre-action enforcement · **ADOPT-VOCABULARY** (no runtime coupling; LangChain/tool-execution domain ≠ our prose-verdict domain — T16 mismatch documented). Add **only if/when H10 is built** (per build-vs-reuse: SSOT row ships with the capability artefact). Trigger to revisit: AgentSpec ships a no-paid-API dialogue-recommendation module.

## §8 — §1.7 self-reflexive note

- **Forward-check:** complies with [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (DeepWiki ×4 + WebSearch ×3 re-run before sustaining BUILD), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (all three options deterministic or operator-subscription sub-agent — zero CI API calls), [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (W1/Option B/H10 surfaced as recommendations; D6 not re-decided), [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) (inherits folder header; subordinates to README + open-questions §13.39).
- **Backward-check:** consolidates (does not duplicate) rounds 1–5 + [2026-05-09-recommendation-skips-own-discipline.md](2026-05-09-recommendation-skips-own-discipline.md). No existing patch superseded; D6's recorded decision is the authority this patch defers to.
- **T-traps applied:** T11 (prior-art re-run, not invented), T16 (problem-class mismatch made explicit for code-review plugin / Superpowers hard-gates / AgentSpec — none ADOPT-as-is), T3 (file:line + arxiv/DeepWiki/WebSearch citations), T15 (this patch's own recommendation carries SSOT refs + falsification per H1 discipline — self-applied). **INCONCLUSIVE:** a post-March-2025 production LangChain recommendation-discipline module, if shipped since, was not surfaced by WebSearch — honest residual gap.

## §9 — See also

- [2026-05-21-niche-strategy-and-growth-roadmap.md §4 Wave N4](2026-05-21-niche-strategy-and-growth-roadmap.md) — parent roadmap (N4a detector v2 DONE #98; N4b = this design).
- [2026-05-21-recommendation-gate-iterative.md](2026-05-21-recommendation-gate-iterative.md) + rounds 3/4/5 — the iterative research this consolidates.
- [open-questions.md §13.39](../../open-questions.md) — D6 maintainer decision (the authority not re-opened here).
- [2026-05-21-instruction-compliance-empirical.md](2026-05-21-instruction-compliance-empirical.md) — #97/#98 detector + scorer + pre-registered effect size.
- [.claude/rules/phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md) — the recommendation-discipline (H1) home.
