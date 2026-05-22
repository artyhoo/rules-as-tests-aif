# Memory-codification gap tracker — 15 stage-0 conventions (DN-4)

> **Authoritative for:** tracking the closure of the 15 **stage-0** (memory-only) conventions found by the 2026-05-22 memory coverage audit; per-row status + nearest reachable enforcement channel.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The discipline that governs codification — see [.claude/rules/memory-codification.md](../../.claude/rules/memory-codification.md) (SSOT). The full coverage matrix — see [research-patches/2026-05-22-memory-coverage-audit.md §4](research-patches/2026-05-22-memory-coverage-audit.md).

> **Origin:** DN-4 of the 2026-05-22 memory coverage audit ([research-patches/2026-05-22-memory-coverage-audit.md:168](research-patches/2026-05-22-memory-coverage-audit.md)). Resolution: **dedicated tracker doc + close incrementally as touched** (NOT a big-bang batch — `open-questions.md` was at the 500-line cap, and incremental codification keeps each change reviewable). Companion to [automerge-staging-plan.md](automerge-staging-plan.md) (precedent for a standalone tracker doc).

## How this works

Each row below is a durable convention living **only** in user-scope agent memory (`~/.claude/projects/<slug>/memory/*.md`) — invisible to fresh sessions, CI, and teammates (the stage-0 worst case the project exists to prevent). Per [memory-codification.md §3](../../.claude/rules/memory-codification.md): when a session next **touches** the area of a row, codify it into the repo (`CLAUDE.md` / `.claude/rules/*` / a `docs/` doc) and reduce the memory entry to a one-line pointer. Update the row's Status here in the same change.

**Not a big-bang.** Close opportunistically. Most rows are Class-C (judgment-gated, no mechanical test) or xt (enforceable only at write-time/session) — codification = prose-in-repo + a pointer, not necessarily a test. Re-audit cadence per [phase-research-coverage.md §1.6](../../.claude/rules/phase-research-coverage.md) push-sweep.

Status legend: **PENDING** (still memory-only) · **CODIFIED** (in repo + memory reduced to pointer) · **DEFERRED** (codification blocked, reason noted).

## The 15 stage-0 gaps

| # | Convention (memory entry) | Nearest reachable channel | Status |
|---|---|---|---|
| 16 | `check_decided_status_before_recommending` | `.claude/rules/*` (session-discipline: grep memory + decision docs before recommending) | CODIFIED → phase-research-coverage.md §1.11 |
| 17 | `check_inflight_prs_before_building` | `.claude/rules/*` / orchestrator skill (scan `gh pr list --state open` before building a tracked item) | CODIFIED → phase-research-coverage.md §1.11 |
| 18 | `ci_runner_allocation_diagnostic` | troubleshooting doc/skill (heuristic, not a rule-to-enforce) | PENDING |
| 19 | `claude_code_guide_worker_inaccessible` | CC-harness fact → kickoff-authoring habit (plan D4 fallback); queue-mode.md §10 already partly covers | PENDING |
| 20 | `dont_ask_when_best_path_clear` | `.claude/rules/*` (pairs with reviewer-discipline §2 + reasoned-recommendation) | CODIFIED → phase-research-coverage.md §1.12 |
| 21 | `no_human_verification_ai_self_verifies` | **major** — project-thesis-one-layer-up; codify via research-patch; widens §13.34 (hard to mechanize — it IS the recursive thesis) | PENDING |
| 22 | `orchestrator_verify_state_before_claim` | `.claude/rules/*` (re-verify HEAD/closure before ship / negative-existence claim); §13.34-adjacent | CODIFIED → phase-research-coverage.md §1.11 |
| 23 | `own_qa_before_handoff` | AI-agnostic `agents/*.md` cold-review run per load-bearing PR (session-time, no CI) | CODIFIED → ai-laziness-traps.md T19 |
| 24 | `phase_minus_1_no_memory_inheritance` | orchestrator skill (keyword-grep step is deterministic; "absorb constraints" is judgment) | PENDING |
| 25 | `preserve_before_destructive_delegation` | `.claude/rules/*` or ai-laziness-traps T17 (incident counter 1/3 → promote at 3) | CODIFIED → ai-laziness-traps.md T17 |
| 26 | `preserve_unique_residue_via_skill_context` | discipline note (judgment-heavy directive) | CODIFIED → ai-laziness-traps.md T18 |
| 27 | `reasoned_recommendation_default` | `.claude/rules/*` (mechanization blocked until detector recall fixed, per #97) | CODIFIED (prose) → phase-research-coverage.md §1.12; mechanization deferred per #97/#98 |
| 28 | `verify_diff_direction_before_live_claim` | `.claude/rules/*` (per-file content-probe is mechanical; invocation is judgment) | CODIFIED → phase-research-coverage.md §1.11 |
| 29 | `worktree_node_modules_symlink` | orchestrator setup step / script (dev-env convenience; mechanizable) | PENDING |
| 30 | `ai_doc_research_priority_pool` | fold into `phase-research-coverage.md` / an AI-doc research doc | PENDING |

> Two non-stage-0 residues from the audit also belong on the radar (not counted in the 15): row 4 `pr_s17_authoring_checklist` author pre-flight grep (stage-0 xt — PR body is GitHub-side, pre-push can't see it; recurred 4×); row 8 `no_paid_llm_in_ci` (stage 1→2 — the ready grep is not yet wired to a workflow-diff check). Track these alongside.

## See also

- [.claude/rules/memory-codification.md](../../.claude/rules/memory-codification.md) — the discipline (SSOT); shipped PR #138.
- [research-patches/2026-05-22-memory-coverage-audit.md](research-patches/2026-05-22-memory-coverage-audit.md) — origin audit + full coverage matrix.
- [agents/memory-codification-auditor.md](../../agents/memory-codification-auditor.md) — AI-agnostic auditor that re-runs the sweep.
- [automerge-staging-plan.md](automerge-staging-plan.md) — standalone-tracker-doc precedent.
