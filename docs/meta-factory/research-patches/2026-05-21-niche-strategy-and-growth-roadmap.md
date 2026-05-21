<!-- scope:niche-strategy-and-growth-roadmap -->
# Research-patch — Niche strategy + growth roadmap (post-book strategic synthesis)

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: (a) the verified Superpowers symbiosis-vs-duplication finding, (b) the wave decomposition proposed from it. **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)) nor for the operational plan (see [EXECUTION-PLAN.md](../EXECUTION-PLAN.md)) — this is a *proposal-of-record*; wave admission to the operational plan is a maintainer/planning-session call.
> **Date:** 2026-05-21 · **Author session:** Opus 4.7, strategic dialogue. No mechanism implemented; no rule codified; no PR opened. Proposes waves; does not execute them.

---

## §1 — Question

After the project history book landed on main (PR #93), the maintainer asked the load-bearing strategic question: **does this project genuinely symbiose with Superpowers (`obra/superpowers`), or are the two doing the same thing?** And, downstream: what niche does the project occupy, where should it grow, and how should it strengthen its companions while being strengthened by them — especially given its AI-agnostic design.

## §2 — Evidence (DeepWiki, 3 phrasings — per `build-first-reuse-default.md` §3 + `phase-research-coverage.md` §1.4 adversarial check)

Three independent probes of `obra/superpowers`, 2026-05-21:

1. **Does it install enforcement artifacts into the consumer codebase?** → **No.** No ESLint rules, no hooks, no mutation gates, no dependency-boundary checks, no CI gates. Explicitly zero-dependency by design; PRs adding third-party deps for enforcement are *rejected*. Only artifacts landing in the consumer project: the agent's code changes + plan/spec markdown under `docs/superpowers/`. ([search](https://deepwiki.com/search/does-superpowers-install-or-ge_d5710ed1-2ba4-40a1-b28f-21848374ab64))
2. **Does it apply its test-first discipline recursively to its own docs?** → **No — unidirectional.** Scoped to *authoring new skills* (agent process). No doc-authority headers, no meta-tests on doc drift, no mutation of its own rules, no Living Documentation probes. (One historical *manual* TDD-on-TDD-skill campaign, not a continuous mechanism.) ([search](https://deepwiki.com/search/does-superpowers-apply-its-rul_7f30ae74-2148-49bf-948f-8782967a01f5))
3. **What problem class?** → **HOW (process methodology), not constraint enforcement.** Verbatim: *«Mechanical constraints should be automated, not documented — save documentation for judgment calls.»* Its multi-channel enforcement governs *process compliance* (hard-gates, 1% rule, two-stage review), NOT codebase rules. Verbatim: *«Superpowers is orthogonal to constraint enforcement systems… they solve different problems… complementary, not overlapping.»* ([search](https://deepwiki.com/search/what-problem-class-does-superp_0f71735f-ab32-439e-a167-657eef4cc107))

## §3 — Verdict: symbiosis CONFIRMED, near-zero overlap

| Axis | Superpowers | This project |
|---|---|---|
| Target | Agent **behaviour** (HOW the agent works) | The **codebase + itself** (WHAT must not be violated) |
| Mechanism | Process skills, hard-gates, review loops | Executable artifacts: lint/mutation/drift/doc-authority, multi-channel cascade |
| Self-application | Unidirectional (skills only) | Recursive («documents lie» applied to own docs) |
| Deliverable into consumer | Skills/methodology (plugin) | Enforcement substrate (installed artifacts) |
| Dependencies | Zero by design | Owns the dep-bearing enforcement engine |

**Superpowers explicitly hands outward the exact work this project does** («mechanical constraints should be automated, not documented»). It automates *process* + documents *judgment*; this project automates the *mechanical constraints* it delegates away. The only overlap is agent-methodology the project reinvented (orchestrator Mode A/B, parallel-subwave-isolation) — already verdicted ADOPT-VOCABULARY / REFERENCE in [2026-05-16-companion-target-comparison.md §3.1](2026-05-16-companion-target-comparison.md).

**Growth principle (maintainer-confirmed 2026-05-21):** grow by adopting where a companion already solved it, build only the unique moat, give the residue back. This is [`build-first-reuse-default.md`](../../../.claude/rules/build-first-reuse-default.md) grown from per-decision rule to project-level growth strategy.

## §4 — Wave decomposition (proposal; admission = maintainer call)

> Each wave is its own kickoff + R-phase/I-phase. The verification-heavy items are **separate large tasks to be planned, not executed in this session** (maintainer directive 2026-05-21).

### Wave N0 — Headless-dispatch storm (HARD external deadline ~2026-06-15) — MOST URGENT
- **Threat:** the autonomous-dispatch architecture (orchestrator → Sonnet workers via `claude -p` headless, "Option C") rests on a platform capability the maintainer flags as closing ~mid-June. External, deadline-bound, not fixable-by-test. See [[project_claude_p_headless_window]] memory.
- **Strategic framing:** the storm hits the **orchestration/methodology layer** — explicitly NOT the moat (per §3). The enforcement substrate (lint/hooks/mutation/drift + AI-agnostic `agents/*.md`) runs on husky/CI/npm and is harness-independent → weatherproof. The storm is a live stress-test of the AI-agnostic thesis.
- **Task 0 (gate everything on this):** **VERIFY** the actual policy + exact date via claude-code-guide / official Anthropic docs — do NOT build a migration on an unverified premise (project discipline; also keeps the book honest — no fabricated vendor policy).
- **Resolution fork (maintainer call):** (a) migrate dispatch to Agent SDK — credit window also ~2026-06-15 (see [[project_swarm_execution_approach]]); (b) degrade to human-in-loop interactive; (c) hand orchestration to a companion runtime (aif-handoff).
- **Checks:** no-paid-LLM preserved; whichever path must keep the enforcement substrate harness-independent.
- **BFR verdict:** likely ADOPT (Agent SDK) or REFERENCE (aif-handoff) — orchestration is not the moat; do not BUILD a custom dispatcher.

### Wave N1 — Niche-validation research
- **Goal:** lock the positioning empirically. Is there ANY tool combining enforcement-substrate **+** recursive-self-application? (negative-existence → `phase-research-coverage.md` §1 6-item checklist).
- **Inputs:** §2 evidence (done); extend probes to AIF / aif-handoff / others at the enforcement-substrate granularity.
- **Checks:** §1.4 adversarial counter-prompt; ≥3 phrasings per candidate; no-paid-LLM (DeepWiki/WebSearch only).
- **Output:** positioning SSOT entry + Commit 7 README subline finalised (Superpowers as named companion — Decision A in companion-target-comparison §7).
- **BFR verdict:** n/a (research).

### Wave N2 — Adopt-from-companion (усиливаясь ими)
- **Goal:** stop reinventing agent-methodology; adopt/reference where Superpowers is mature.
- **Tasks:** `parallel-subwave-isolation` → REFERENCE Superpowers `using-git-worktrees`, drop the Class-C → principle-test ambition; Mode A/B → ADOPT-VOCABULARY «subagent-driven-development»; evaluate ADAPT candidates (1% Rule → trigger-keyword discipline; pressure-scenarios → adversarial principle-test probes; TDD-for-skills → SKILL.md paired-negative).
- **Checks:** T16 problem-class match per item; SSOT entry per adoption; §1.7 forward+backward.
- **Output:** SSOT updates + rule edits + 5-item vocabulary codification (Decision B).
- **BFR verdict:** ADOPT-VOCABULARY / REFERENCE / ADAPT (per item).

### Wave N3 — Enforcement substrate as a portable package (the moat) = Wave 10
- **Goal:** migrate bash hooks → TS core so the engine is portable + installable as a product (not ~1320 LOC of bash). Prereq for both one-button install and give-back.
- **Status:** kickoff exists ([wave-10-hook-architecture/kickoff.md](../../../.claude/orchestrator-prompts/wave-10-hook-architecture/kickoff.md)); blocked on Wave 9 M1–M5 fixes.
- **Checks:** §1.8 hook-surface smoke-test; recursive self-audit green; AST-level analysis unblocks `parallel-subwave-isolation` mechanical detection.
- **BFR verdict:** BUILD (own moat; no upstream substrate candidate per SSOT #47/#48).

### Wave N4 — Recommendation-moment as enforceable channel (the new frontier)
- **Goal:** close the gap §1.7 doesn't cover — the moment an agent *asserts a recommendation*, before any commit. No companion has it.
- **Tasks (ordered by #97 finding):** (1) **fix the claim-detector first** — current recall ≈ 0.43, precision ≈ 0.20–0.25 is the binding constraint, NOT compliance; (2) only then design the recommendation-moment gate.
- **Checks:** re-run the #97 scorer ([2026-05-21-instruction-compliance-empirical.scorer.py](2026-05-21-instruction-compliance-empirical.scorer.py)) as before/after; pre-registered effect size; no-paid-LLM.
- **Output:** improved detector; possible new channel = candidate give-back to companions.
- **BFR verdict:** BUILD (frontier; nobody upstream).

### Wave N5 — Give the conscience back (усиливая их)
- **Goal:** package the unique residue (paired-negative tests, mutation gates, doc-authority) as Superpowers **skills** + AIF **skill-context patches**.
- **Depends on:** N2 (know what's genuinely unique) + ideally N3 (packaged engine).
- **Checks:** dual-implementation-discipline §3 triage + `@dual-pair` markers; verify upstream contribution conventions before authoring.
- **BFR verdict:** the inverse of adopt — contribute.

### Wave N6 — Coexistence, then one-button install
- **Goal:** (a) ship the C-1 implementation PR (resolves `.claude/agents/` collision with AIF — already RESOLVED in design 2026-05-20, impl pending; **blocks the honest «installs alongside AIF» claim + Commit 7**); (b) one-button install — gated on N3 (portable core) **and** (a).
- **Checks:** real hybrid install probe in /tmp (per C-1 mandatory-probe discipline T-CIA-A); install must not silently corrupt a coexisting AIF install.
- **Output:** clean coexistence; eventual `npx`-style scaffold replacing the current 8 manual steps.
- **BFR verdict:** the «button» is the only new build; coexistence reuses C-1 resolution.

## §5 — Sequencing + dependencies

```text
HARD DEADLINE ~2026-06-15 (beats all):   N0 (headless-dispatch storm — verify FIRST, then migrate)
NOW (cheap, parallel, lock the story):   N1 (validation) ∥ N2 (adopt)
URGENT (unblocks Commit 7 + AIF claim):  N6a (C-1 impl PR)
LONG POLE (after Wave 9 M1–M5):          N3 (TS core / Wave 10)
RESEARCH (no deadline):                  N4a (detector fix) → N4b (gate)
AFTER N2+N3:                             N5 (give-back)
AFTER N3+N6a:                            N6b (one-button install)
```

- **N0 is the only wave with a hard external clock** — it outranks everything. But it threatens the non-moat layer, so worst case the project degrades orchestration to interactive and the substrate is untouched. Verify before migrating.

- **N1/N2** are cheap and lock positioning → do first, parallelizable (use worktrees per [`parallel-subwave-isolation.md`](../../../.claude/rules/parallel-subwave-isolation.md)).
- **N6a (C-1 impl)** is the urgent unblock — gates the honest companion claim and Commit 7.
- **N3** is the long pole; everything product-shaped (N5, N6b) waits on it.
- **One-button install is LAST** — «coexistence first, button later», never the reverse.

## §6 — §1.7 self-reflexive note (per `phase-research-coverage.md` §1.7)

- **Forward-check:** this roadmap complies with `build-first-reuse-default` (every wave carries a BFR verdict), `no-paid-llm-in-ci` (N1/N4 checks are DeepWiki/WebSearch/deterministic-scorer only), `doc-authority-hierarchy` (this patch declares scope + subordinates to README/EXECUTION-PLAN), `reviewer-discipline` (waves are *proposed*; admission is the maintainer's strategy call, not decided here).
- **Backward-check:** no new rule introduced → no existing-artefact sweep owed. The roadmap *proposes* rule changes (N2 demotes `parallel-subwave-isolation`'s promotion ambition); those edits carry their own §1.7 when authored.
- **Self-application:** the symbiosis verdict (§3) was itself produced by the project's own «verify, don't assert» discipline (§2 probes) — the recommendation walked its own talk before being written down.

## §7 — Tags

`#niche-positioning` `#companion-symbiosis` `#build-first-reuse-as-strategy` `#enforcement-substrate-moat` `#give-back-residue`

## §8 — See also

- [2026-05-16-companion-target-comparison.md](2026-05-16-companion-target-comparison.md) — 7-candidate matrix; Superpowers companion verdict; 5 DECISION-NEEDED (Commit 7 subline, ADAPT candidates).
- [2026-05-21-instruction-compliance-empirical.md](2026-05-21-instruction-compliance-empirical.md) — #97; detector recall/precision = N4 binding constraint.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — the rule this roadmap operationalises at strategy scale.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT; entries #43/#47/#48/#49 bound the enforcement-substrate negative-existence claim.
- [docs/meta-factory/project-history-book.md](../project-history-book.md) «Часть XI» / [-v2.md](../project-history-book-v2.md) — narrative companion to this roadmap.
