# Phase 9 — Step 0 entry research (capability scoping for Phase 9 implementation)

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) — Phase 9 entry gate. [§13.10 entry #2](open-questions.md) trigger fired at Phase 8 close (Path A LLM gen ROI scoping); SSOT entry [prior-art-evaluations.md#1](prior-art-evaluations.md) (Autogrep, DEFER) carries an explicit re-evaluation pointer to that trigger.
> **Date:** 2026-05-08.
> **Branch:** `docs/phase-9-entry-research` (forked from `main` HEAD `a971728`, the merge commit of PR #12 closing Phase 8.8).
> **Method:** §5.5 Step 1.5 mandatory SSOT consult against [prior-art-evaluations.md](prior-art-evaluations.md) + context7 MCP queries (≥3 phrasings per unmatched capability) + local reads of Phase 8 / 8.8 retros + open-questions §13.10 / §13.11. Phase 8.8 mechanism is the live forward gate; this session is its first downstream consumer.
> **Status:** transient artifact per §5.5 — ≤200 lines; archived after Phase 9 closes.
> **Question answered:** which Phase 9 implementation capability areas are P0/P1 BUILD vs REUSE/DEFER given current SSOT state, fired triggers, and §6.0 stop-rules?

---

## §1. Header — research scope

Phase 9 entry research scopes WHAT Phase 9 implementation might cover. The matrix decides priority + go/no-go; the next-session implementation prompt commits to a subset. Research only — no code, no impl. Output drives `PHASE-9-PROMPT.md` drafting in a follow-up session.

The first downstream consumer of Phase 8.8 mechanism (T2-T11): §5.5 Step 1.5 + principle 08 + `Prior-art:` trailer convention all enforced during this session. Observed false-positive rate from this session feeds back into Phase 8.8 retro decision on widening principle 08 scope.

---

## §2. Capability areas to scope (9 initial)

Initial candidate areas for Phase 9 implementation, derived from (a) §13.10 trigger conditions, (b) Phase 8 retro «Open questions» §1-§6, (c) Phase 8.8 retro «Open questions for Phase 9 entry», (d) Phase 11.1 closure tail.

| # | Capability area | Source trigger | Initial verdict (placeholder, finalised in §5) |
|---|---|---|---|
| A1 | Path A LLM gen «picks from menu» — LLM selects ESLint plugin / configures options from curated menu | [open-questions.md §13.10 entry #2](open-questions.md) trigger FIRED at Phase 8 close; re-evaluation of [prior-art-evaluations.md#1](prior-art-evaluations.md) (Autogrep, DEFER) | TBD — primary trigger |
| A2 | Autogrep re-evaluation (Semgrep + LLM rule-synthesis) | [prior-art-evaluations.md#1](prior-art-evaluations.md) `Trigger to revisit` fires with §13.10 #2 | TBD — SSOT consult mandatory |
| A3 | LLM-driven research extension (context7 MCP + Anthropic web_search) | [open-questions.md §13.10 entry #1](open-questions.md) trigger ARMED, NOT fired | TBD — armed |
| A4 | Gate 5 two-AI review BUILD (per-plan + Opus + advisory + cached) | [open-questions.md §13.11](open-questions.md) scoping DONE Phase 8; build deferred to verification gate fire per [§13.10 entry #4](open-questions.md) | TBD — wait for FP-rate data? |
| A5 | Path B AST gen (LLM writes ESLint rule TypeScript source) | [open-questions.md §13.10 entry #3](open-questions.md) trigger ARMED for «new pattern with no existing ESLint plugin» | TBD — has trigger fired? |
| A6 | Recipe duplication housekeeping (`react-server-components` + `next-r12-no-server-imports-in-client`) | Phase 8 retro Self-reflection #6 + Open Q #3 | TBD — single-source policy |
| A7 | `next/any/` resolution tier in load.ts (collapse 15.x ↔ 16.x version-agnostic dup) | Phase 8 retro Self-reflection #5 + Open Q #4 | TBD — authoring convention question |
| A8 | Glob-overlap weight calibration (0.40/0.40/0.20 initial guess) | Phase 8 retro Self-reflection #6/#9 + Open Q #6, post-PR-#11-fix `9fe5a5b` | TBD — needs test corpus design |
| A9 | AIF GATE-RESULT-CONTRACT.md schema validation (Phase 11.1 closure tail) | Phase 8 Task 8.4 PARTIAL CLOSE; Phase 8 retro Open Q #5 | TBD — context7 fresh fetch needed |

**Phase 8.8 SSOT entries that may match areas above** (consulted in §3): [prior-art-evaluations.md#1](prior-art-evaluations.md) Autogrep (DEFER), [#2](prior-art-evaluations.md) Netlify framework-info (WATCHLIST), [#3](prior-art-evaluations.md) fitness functions (ADOPT VOCABULARY).

---

## §3. SSOT consult (Step 1.5) — see T2 commit

Populated in T2: each of [prior-art-evaluations.md#1-#3](prior-art-evaluations.md) checked against §2 areas; `Last reviewed` bumps in same commit; re-evaluation notes for DEFER/WATCHLIST entries whose trigger condition has fired.

## §4. context7 lookups per unmatched area — see T3 commits

Populated in T3: per area not covered by existing SSOT entries, `mcp__context7__resolve-library-id` + `mcp__context7__query-docs` (≥3 phrasings each per Hard Constraint #5). New SSOT entries added in same commit if production-grade analog surfaces.

## §5. Build vs reuse matrix + Phase 9 priority — see T4 commit

Populated in T4: final matrix table with verdict (BUILD / REUSE / DEFER / STOP) and Phase 9 priority (P0 / P1 / P2 / OUT) per area.

## §6. Stop-rule audit + cost projection — see T5 commit

Populated in T5: §6.0 stop-rule compliance projection per P0/P1 BUILD capability + cost model per [open-questions.md §13.11](open-questions.md) for any LLM-bearing area.

---
