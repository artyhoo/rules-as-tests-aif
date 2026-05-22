# Orchestrator master kickoff — growth-roadmap execution

> **Authoritative for:** the orchestrator's *operating instructions* to execute the N0–N8 growth roadmap — the per-wave loop, hard constraints, decisions it must not make, autonomous-mode rules.
> **NOT authoritative for:** project goal — see [../../README.md#why-this-exists](../../README.md#why-this-exists); wave *content* — see the two roadmap research-patches; wave *order + dependencies* — see [wave-sequencing-plan.md](wave-sequencing-plan.md) (the source of truth this kickoff points at).
>
> **Status: PLANNING ONLY (2026-05-22). This kickoff launches nothing.** The orchestrator acts only after the maintainer says «go» and either picks the first wave or authorises autonomous (Queue) mode. Until then this is a recorded entry-point, not a running instruction.

---

## §1 — Your job (one paragraph)

Read [wave-sequencing-plan.md](wave-sequencing-plan.md) — it is the single source of truth for **what order** and **what depends on what**. Execute the roadmap wave-by-wave: for each launched wave, **self-author that wave's per-wave kickoff** from this plan + the wave's research-patch, dispatch workers, accept their work **on evidence** (command output / `file:line`, not prose), and record the outcome back into the plan. You compose the detailed per-wave kickoffs yourself — this master kickoff only gives you the loop and the rails.

## §2 — Per-wave operating loop

1. **Confirm unblocked** — check the §6 dependency graph in the sequencing plan; every `X → thisWave` edge satisfied and any gating maintainer-decision (§4 below) closed.
2. **Author the per-wave kickoff** — scope; active AI-laziness T-numbers + ≥1 domain-specific trap ([ai-laziness-traps.md §3](../../.claude/rules/ai-laziness-traps.md) obligation, no blanket reference); §1.7 forward+backward plan; BFR-verdict requirement for any capability; explicit done-criteria.
3. **Decide parallel vs sequential** — if fanning out a parallel-safe group (plan §6 G1): **one `git worktree` per session** + `node_modules` symlink + **partitioned file scopes**. If worktree-add fails → sequential fallback, never shared-dir.
4. **Dispatch** — workers do the work and self-verify; you accept only on evidence.
5. **Record outcome** — update the sequencing-plan status row + any SSOT / EXECUTION-PLAN promotion the maintainer authorised. Report in plain language.

## §3 — Hard constraints (non-negotiable rails)

- **No paid LLM** — all research via DeepWiki / WebSearch / local only; no API-billed call in CI ([no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md)).
- **Worktree isolation** — parallel sessions MUST use git worktrees; sequential fallback, never concurrent shared-dir ([parallel-subwave-isolation.md](../../.claude/rules/parallel-subwave-isolation.md)).
- **File-scope partition** — never two sessions writing the same canonical file (SSOT `prior-art-evaluations.md`, `EXECUTION-PLAN.md`, `.claude/hooks/`, `packages/core/`). Serialize or partition.
- **Infra is solo** — staging-trunk migration (plan I.1) rewrites branch-protection / workflows / `git-safety.sh`: run alone, never concurrent with auto-merge waves.
- **AI-laziness T-enumeration** — every per-wave kickoff enumerates its active traps; blanket «see ai-laziness-traps.md» is itself trap T7.
- **Artifact ownership** — README / goal read-only; research-patches append-only ([CLAUDE.md Artifact Ownership Contract](../../CLAUDE.md)).

## §4 — Decisions you must NOT make (surface, then wait — [reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md))

You are not a second orchestrator-of-strategy. Name each as DECISION-NEEDED, describe both paths' consequences, and **stop** — do not pick:

1. **companion = A / B / C** (gates N7).
2. **promote N0–N8 into `EXECUTION-PLAN.md`** (plans «active» vs archived).
3. **staging-trunk migration: execute or hold** (plan I.1).
4. **which wave launches first** (recommended N8 R-phase; maintainer confirms).

## §5 — Recommended first move (proposal, from plan §4)

**Track 0 housekeeping** (commit + close decisions) ∥ **N8 R-phase + N1** (free research, feeds the only hard date 2026-06-15). Await the maintainer's pick before dispatching.

## §6 — Autonomous (Queue) mode

If the maintainer authorises an autonomous multi-wave run («прогони волнами / queue mode / работай без остановок»), use the orchestrator skill's **Queue mode**: process the parallel-safe research group (plan §6 G1) in worktrees with partitioned scopes, and **stop + surface at every §4 decision gate** rather than deciding through it. Autonomy applies to *execution within agreed scope*, never to *making the §4 strategy calls*.

## §7 — Done / reporting

A wave is done when its kickoff's done-criteria are met **with evidence** and the sequencing-plan status row is updated. Each report states, in plain language: what shipped, what is blocked, which §4 decision is pending. No «high confidence» without predicates (ai-laziness T6).

## §8 — See also

- [wave-sequencing-plan.md](wave-sequencing-plan.md) — order + dependency matrix + parallelism (your map).
- [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md) — N0–N7 content.
- [research-patches/2026-05-22-deterministic-offload-autonomy-economy.md](research-patches/2026-05-22-deterministic-offload-autonomy-economy.md) — N8 content.
- [ai-laziness-traps.md](../../.claude/rules/ai-laziness-traps.md), [parallel-subwave-isolation.md](../../.claude/rules/parallel-subwave-isolation.md), [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md), [reviewer-discipline.md](../../.claude/rules/reviewer-discipline.md) — the rails in §3/§4.
