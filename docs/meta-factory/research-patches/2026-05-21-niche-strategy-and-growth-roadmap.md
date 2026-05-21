<!-- scope:niche-strategy-and-growth-roadmap -->
# Research-patch — Niche strategy + growth roadmap (post-book strategic synthesis)

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: (a) the verified Superpowers symbiosis-vs-duplication finding, (b) the wave decomposition proposed from it. **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)) nor for the operational plan (see [EXECUTION-PLAN.md](../EXECUTION-PLAN.md)) — this is a *proposal-of-record*; wave admission to the operational plan is a maintainer/planning-session call.
> **Date:** 2026-05-21 · **Author session:** Opus 4.7, strategic dialogue. No mechanism implemented; no rule codified; no PR opened. Proposes waves; does not execute them.

---

> **STATUS RECONCILIATION (added 2026-05-21, post-merge):** several waves listed below as "pending/urgent/next" were in fact **already merged earlier the same day this patch landed** (#101 at 18:09; the merges below predate it). This banner corrects the stale framing without rewriting the original analysis. **N6a (C-1 impl) — DONE:** PRs #79 (KEEP-AIF best-practices + RENAME docs-auditor→living-docs-auditor) + #82 (skill-context delivery) + #83/#84/#85 (research-patches, prose sync, audit refresh); live-probe DECISION-NEEDED #2 RAN+PASSED (background sidecar reads skill-context, see [2026-05-20-skill-context-runtime-probe.md](2026-05-20-skill-context-runtime-probe.md)); Commit 7 README companion subline also landed (Superpowers named at README.md:8/72/78). **N4a (detector fix) — DONE:** PR #98 shipped detector v2 (≤2 intervening tokens + strip citations/quotes/links), recall +~37% / precision −~105 FP, validated against committed [tests/eval/baseline-2026-05-21.md](../../../tests/eval/baseline-2026-05-21.md). Remaining N4 work = **N4b (recommendation-moment gate)** only. Lesson: reconcile against same-day merges before recording wave status (a `#stale-claim` instance of the verify-before-claim family).

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

### Wave N0 — Headless-dispatch billing change (firm date 2026-06-15) — plan by date, NOT a cliff
- **Task 0 — DONE (VERIFIED 2026-05-21, claude-code-guide + WebSearch, 2 channels):** the earlier "policy makes `claude -p` unavailable / closing door" framing was **WRONG**. Reality: a **billing change, not a ban.** Effective **June 15, 2026** (announced May 14), `claude -p` + Agent SDK + Claude Code GitHub Actions + third-party agents move **off the subscription's interactive pool onto a separate monthly Agent-SDK credit** ($20 Pro / $100 Max5x / $200 Max20x, at full API rates, no rollover). On exhaustion: requests rejected (or continue at API rates if "extra usage" enabled). Interactive terminal + Claude.ai unchanged. `claude -p` stays supported (docs even add `--bare` as the recommended scripted mode). Sources: [headless docs](https://code.claude.com/docs/en/headless), [Anthropic support](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [The Register 2026-05-14](https://www.theregister.com/ai-ml/2026/05/14/anthropic-tosses-agents-into-the-api-billing-pool/5240748).
- **Strategic framing (holds, sharpened):** the change hits the **orchestration/methodology layer** — NOT the moat (§3). The enforcement substrate (lint/hooks/mutation/drift + AI-agnostic `agents/*.md`) runs on husky/CI/npm, never used `claude -p`, and is already protected by the **`no-paid-llm-in-ci` rule** → fully weatherproof. A fan-out Bash dispatcher spawning many `claude -p` workers, however, burns the monthly credit fast at API rates.
- **Real decision (by June 15, maintainer call):** not "migrate before the door shuts" but "how to pay the meter" — (a) cost-aware dispatch within the credit; (b) pay overage at API rates; (c) upgrade plan for more credit; (d) human-in-loop interactive (free pool); (e) hand orchestration to a companion runtime (aif-handoff). Overlaps Wave N7 (dogfood-companions): process-layer migration is the same action.
- **Checks:** `no-paid-llm-in-ci` preserved; substrate stays harness-independent; estimate per-dispatch credit burn before committing to a fan-out shape.
- **BFR verdict:** ADOPT (Agent-SDK / companion path) — orchestration is not the moat; do not BUILD a custom dispatcher. Urgency: **moderate** (cost-planning by a firm date), downgraded from the earlier "beats all" once verification showed it is a meter, not a removal.

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
- **Tasks (ordered by #97 finding):** (1) ✅ **DONE (#98)** — fix the claim-detector first (was recall ≈ 0.43, precision ≈ 0.20–0.25); detector v2 shipped (recall +~37%, precision −~105 FP per [baseline-2026-05-21.md](../../../tests/eval/baseline-2026-05-21.md)); (2) **N4b — remaining:** design the recommendation-moment gate.
- **Checks:** re-run the #97 scorer ([2026-05-21-instruction-compliance-empirical.scorer.py](2026-05-21-instruction-compliance-empirical.scorer.py)) as before/after; pre-registered effect size; no-paid-LLM.
- **Output:** improved detector; possible new channel = candidate give-back to companions.
- **BFR verdict:** BUILD (frontier; nobody upstream).

### Wave N5 — Give the conscience back (усиливая их)
- **Goal:** package the unique residue (paired-negative tests, mutation gates, doc-authority) as Superpowers **skills** + AIF **skill-context patches**.
- **Depends on:** N2 (know what's genuinely unique) + ideally N3 (packaged engine).
- **Checks:** dual-implementation-discipline §3 triage + `@dual-pair` markers; verify upstream contribution conventions before authoring.
- **BFR verdict:** the inverse of adopt — contribute.

### Wave N6 — Coexistence, then one-button install
- **Goal:** (a) ✅ **DONE (#79+#82+#83/#84/#85)** — C-1 implementation shipped (resolved `.claude/agents/` collision with AIF; honest «installs alongside AIF» claim + Commit 7 now unblocked and landed); (b) one-button install — gated on N3 (portable core) **and** (a).
- **Checks:** real hybrid install probe in /tmp (per C-1 mandatory-probe discipline T-CIA-A); install must not silently corrupt a coexisting AIF install.
- **Output:** clean coexistence; eventual `npx`-style scaffold replacing the current 8 manual steps.
- **BFR verdict:** the «button» is the only new build; coexistence reuses C-1 resolution.

### Wave N7 — Dogfood companions in our own dev (arm up: усиливаясь ими)
- **Goal:** close the conflation the maintainer surfaced 2026-05-21 — «companion» has meant *product-positioning* (we ship alongside; §3), never *dev-tool* (we **use** companions to build this project). Today: **zero companion deps** in `package.json`, own homegrown skills (orchestrator/reviewer), own MCP-research tools — we REFERENCE/ADOPT-VOCABULARY but do not dogfood. This wave makes dogfooding an explicit, bounded choice.
- **Scope split (load-bearing):** dogfood companions at the **dev-workflow/process layer ONLY** (e.g. use Superpowers' SDD skill + `using-git-worktrees` in our own development instead of maintaining homegrown equivalents). Keep the **enforcement substrate dependency-free** — coupling it to a vendor would forfeit the AI-agnostic weatherproofing the N0 storm just proved load-bearing (book Часть XIII: «оружие для процесса бери у союзников, броню субстрата куй свою»).
- **N0 coupling:** this is the same action as de-risking the storm — if dispatch already runs on Superpowers/Agent-SDK patterns, the `claude -p` closure bites far less. N7 process-layer dogfooding ⊇ N0 migration target.
- **Pairs with N5 (give back):** dogfooding first tells us empirically *which* of our unique artifacts (paired-negative, mutation gates, doc-authority) are worth contributing back — N5 follows N7, not the reverse.
- **Checks:** every dogfood adoption carries a T16 problem-class-match note + SSOT entry; substrate-layer purity verified (`grep` of companion deps in `package.json` stays empty); §1.7 forward+backward whenever a homegrown skill is retired in favour of a companion's.
- **BFR verdict:** ADOPT (process-layer skills) + KEEP-NARROW (substrate stays own). NOT a BUILD.

> **DECISION-NEEDED (maintainer):** what does «companion» mean for this project — **(A)** product-positioning only (ship alongside, never couple); **(B)** dev-tool (dogfood them to build ourselves); or **(C)** both, on separate layers (substrate = A, process = B)? · *Reviewer's described consequences, not a pick:* A → keeps everything as today; symbiosis stays a claim, not practice; lowest risk, but «arm up with allies» (book Часть XIII) never materialises. B → maximal strengthening but risks coupling the substrate and eroding AI-agnosticism (the very property N0 proved load-bearing). C → the layered split this wave assumes; preserves the weatherproof moat while actually using allies where safe. **N7's whole shape presumes C; if the maintainer picks A or B, N7 is rescoped or dropped.** Per [`reviewer-discipline.md` §2](../../../.claude/rules/reviewer-discipline.md) this is a strategy call — surfaced, not decided here.

## §5 — Sequencing + dependencies

```text
FIRM DATE 2026-06-15 (plan by it, not a cliff): N0 (headless billing change — VERIFIED: meter, not ban; pick how to pay)
NOW (cheap, parallel, lock the story):   N1 (validation) ∥ N2 (adopt)
✅ DONE (#79+#82+#83/#84/#85):           N6a (C-1 impl PR) — was URGENT, now landed
LONG POLE (Wave 10 I-phase IN PROGRESS): N3 (TS core / Wave 10) — 10.1 = PR #107 merge-ready
RESEARCH (no deadline):                  N4a (detector fix) ✅ DONE (#98) → N4b (gate) — remaining
ARM UP (process-layer, ⊇ N0 target):     N7 (dogfood companions in dev) — gated on DECISION = C
AFTER N7 → then N2+N3:                    N5 (give-back)
AFTER N3+N6a:                             N6b (one-button install)
```

- **N0 has the only fixed external date (June 15)** — but VERIFICATION downgraded it from "hard cliff that beats all" to "cost-model change to plan around." It hits the non-moat layer; the substrate is untouched (already `no-paid-llm-in-ci`-protected). Worst case: degrade orchestration to the free interactive pool. Plan dispatch cost by the date.

- **N1/N2** are cheap and lock positioning → do first, parallelizable (use worktrees per [`parallel-subwave-isolation.md`](../../../.claude/rules/parallel-subwave-isolation.md)).
- ~~**N6a (C-1 impl)** is the urgent unblock — gates the honest companion claim and Commit 7.~~ ✅ DONE (#79+#82+#83/#84/#85) — companion claim + Commit 7 landed.
- **N3** is the long pole; everything product-shaped (N5, N6b) waits on it.
- **One-button install is LAST** — «coexistence first, button later», never the reverse.
- **N7 gates on the DECISION-NEEDED** (companion = A/B/C). It is the operational twin of book Часть XIII («arm up with allies») and folds into N0: process-layer dogfooding *is* the storm-migration. N5 (give-back) sequences **after** N7 — you only know what's worth giving once you've used theirs.

## §6 — §1.7 self-reflexive note (per `phase-research-coverage.md` §1.7)

- **Forward-check:** this roadmap complies with `build-first-reuse-default` (every wave carries a BFR verdict), `no-paid-llm-in-ci` (N1/N4 checks are DeepWiki/WebSearch/deterministic-scorer only), `doc-authority-hierarchy` (this patch declares scope + subordinates to README/EXECUTION-PLAN), `reviewer-discipline` (waves are *proposed*; admission is the maintainer's strategy call, not decided here).
- **Backward-check:** no new rule introduced → no existing-artefact sweep owed. The roadmap *proposes* rule changes (N2 demotes `parallel-subwave-isolation`'s promotion ambition); those edits carry their own §1.7 when authored. N7 raises a DECISION-NEEDED rather than deciding it — `reviewer-discipline.md` §2 compliant (consequences described, maintainer picks).
- **Self-application:** the symbiosis verdict (§3) was itself produced by the project's own «verify, don't assert» discipline (§2 probes) — the recommendation walked its own talk before being written down.

## §7 — Tags

`#niche-positioning` `#companion-symbiosis` `#build-first-reuse-as-strategy` `#enforcement-substrate-moat` `#give-back-residue` `#dogfood-companions` `#arm-up-with-allies`

## §8 — See also

- [2026-05-16-companion-target-comparison.md](2026-05-16-companion-target-comparison.md) — 7-candidate matrix; Superpowers companion verdict; 5 DECISION-NEEDED (Commit 7 subline, ADAPT candidates).
- [2026-05-21-instruction-compliance-empirical.md](2026-05-21-instruction-compliance-empirical.md) — #97; detector recall/precision = N4 binding constraint.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — the rule this roadmap operationalises at strategy scale.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT; entries #43/#47/#48/#49 bound the enforcement-substrate negative-existence claim.
- [docs/meta-factory/project-history-book.md](../project-history-book.md) «Часть XI» / [-v2.md](../project-history-book-v2.md) — narrative companion to this roadmap.
