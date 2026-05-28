<!-- scope:meta-orchestrator-SKILL.md-§5-row-3-vs-worker-dispatch-via-subagent -->

# Research-patch: SKILL.md §5 row 3 vs anti-pattern `#worker-dispatch-via-subagent` drift

> Scope: standalone R-phase deliverable. Folder-level authority inherited from
> [research-patches/](./) per [doc-authority-hierarchy.md §5](../../.claude/rules/doc-authority-hierarchy.md).
> Verdict framework: project-internal SKILL.md drift resolution; not a build-vs-reuse decision.
> **Not implementation.** Identifies drift + per-candidate resolution + recommendation. Implementing edit is a follow-up PR per the chosen path.

**Date executed:** 2026-05-29.
**Branch:** `research/skill-row3-vs-worker-dispatch-antipattern`.
**Trigger:** maintainer 2026-05-29 hit the friction firsthand — meta-orchestrator generated dispatch text for parallel R-phase Sub-waves (aif-handoff bridge umbrella, Sub-wave A+B) that mandated manual `git worktree add ../<repo>-sw-X origin/staging` + fresh CC tab paste, per [SKILL.md:348](../../.claude/skills/meta-orchestrator/SKILL.md#L348) anti-pattern `#worker-dispatch-via-subagent`. Simultaneously [SKILL.md:322](../../.claude/skills/meta-orchestrator/SKILL.md#L322) row 3 of the §5 Dispatch tree states «R-phase, multiple parallel → Mode A × N inline Agents. No worktrees needed (R-phases produce docs, not code).» The two rules in the same §5 contradict on the same surface (parallel R-phase Worker dispatch).

---

## §1 Problem restatement

### §1.1 The two rules

[SKILL.md:312-326 §5 Dispatch tree, row 3](../../.claude/skills/meta-orchestrator/SKILL.md#L322):

> | R-phase, multiple parallel | Mode A × N inline Agents | Single-session multi-dispatch via Agent tool calls in one message. No worktrees needed (R-phases produce docs, not code). |

[SKILL.md:347-348 §5 Antipatterns block](../../.claude/skills/meta-orchestrator/SKILL.md#L348):

> **Antipatterns (§7.6 binding):**
> - `#worker-dispatch-via-subagent` — Worker dispatch via Agent tool from the meta-orchestrator session. Agent tool is ONLY for Phase -1 read-only reviewer (`reviewer-discipline.md §2`) + read-only research subagents (text return). Write-task Worker dispatch belongs in a fresh CC session opened by the maintainer pasting a §10 1-liner block. Channel matters — maintainer-paste = external loop-close; Agent-tool = subagent = wrong channel for writes. **Falsifier:** the channel boundary holds even when prompt shapes converge — the test is «who invokes», not «what the prompt looks like».

### §1.2 The contradiction

R-phase Sub-waves write a file (research-patch markdown under `docs/meta-factory/research-patches/`). That is a write task. Therefore:

- **Row 3 says:** Mode A × N inline Agents (= Agent-tool calls from the meta-orchestrator session), no worktrees needed.
- **Anti-pattern §348 says:** write-task Worker dispatch via Agent tool from meta-orchestrator session = forbidden; must go through fresh CC tab paste; channel matters.

R-phase Workers are write tasks. Row 3 dispatches them via Agent tool inline. Anti-pattern §348 forbids exactly that. The same §5 says two opposite things for the same case.

The meta-orchestrator AI session that generated the user-pasted dispatch text resolved the conflict in favour of the anti-pattern (emitted Mode B paste-into-fresh-tab + manual `git worktree add` even though the umbrella declared all four Sub-waves as «Mode A inline R-phase»). The user, downstream consumer, sees friction (4 fresh tabs + 4 `git worktree add` runs for one R-phase) and asks: «is this manual setup actually required?».

### §1.3 Why this matters operationally

The friction is not academic. Aif-handoff bridge R-phase has 4 Sub-waves (A/B parallel Stage 1; C Stage 2; D Stage 3). Each requires:

- `cd /Users/art/code/rules-as-tests-aif`
- `git fetch origin staging`
- `git worktree add ../rules-as-tests-aif-aif-handoff-sw-X origin/staging`
- `cd ../rules-as-tests-aif-aif-handoff-sw-X`
- `git checkout -b research/aif-handoff-bridge-variant-x`
- Open fresh CC session in the new dir
- Paste the `/orchestrator` 1-liner

That is 7 steps × 4 Sub-waves = 28 maintainer actions for one R-phase. If row 3 wins, this collapses to zero maintainer actions — meta-orchestrator (or any orchestrator session) dispatches the four Workers via `Agent({isolation:"worktree", model:"opus", prompt:"..."})` ×4 in one message, CC creates and cleans up worktrees automatically.

The recurring cost across the project's R-phase workflow (aif-handoff bridge, meta-orch-channel-discipline, companion-reuse-deep-dive, and any future parallel R-phase umbrella) makes this drift load-bearing for maintainer ergonomics.

---

## §2 Evidence: origin of each rule

### §2.1 Row 3 — origin commit `07ecfd6` (`feat(n8-c3): /meta-orchestrator skill — BUILD verdict I-phase (Sub-wave D)`)

Row 3 was added as part of the **original §5 Dispatch tree shipped in the BUILD-verdict commit for the meta-orchestrator skill itself.** Row 3's wording — «Single-session multi-dispatch via Agent tool calls in one message. No worktrees needed (R-phases produce docs, not code)» — explicitly contrasts R-phase doc writes against code writes (which DO need worktrees per row 5). The «docs not code» rationale suggests the row 3 author considered the file-write reality of R-phase and judged that Agent-tool dispatch (without worktrees) is fine for doc-write Workers.

### §2.2 Anti-pattern §348 — origin commit `09c245a` (`feat(meta-orchestrator): F.3 — UX implementation per G §1.5 12 items (#205)`)

Anti-pattern §348 was added **3 days later** (2026-05-25) as part of F.3 UX implementation. The design rationale lives in [docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-refactor-f3-scope.md §Item 7 (F3-S1)](2026-05-24-meta-orchestrator-refactor-f3-scope.md):

> «**WHY:** parent kickoff §1 Sub-wave F.3 строки 220-224 (explicit antipatterns для SKILL.md §5).»
>
> Falsifier (Item 7): «if the 1-liner block format is indistinguishable from an Agent dispatch prompt internally — both acceptable; the CHANNEL matters (maintainer paste = external loop-close; Agent = subagent = depth-2 violation for non-read-only).»

The Item 7 author explicitly framed the anti-pattern as channel-wise: even when prompt shapes are identical, **channel matters**. The intent: Agent-tool = subagent depth-2 = wrong channel for write tasks, REGARDLESS of what kind of write (code vs docs).

This intent directly conflicts with row 3's docs-vs-code distinction.

### §2.3 The F.3 UX kickoff did not flag the conflict

The F.3 UX design patch's Item 7 «WHY» cites the parent kickoff (not the existing row 3). The Item 7 «Falsifier» field defines when the anti-pattern is wrong, but does not address whether row 3 contradicts it. The F.3 UX commit modifies §5 in two places (row 3 unchanged + anti-pattern added) without acknowledging the tension. This is a `#discipline-application-scope-blindness` instance per [phase-research-coverage.md §4 anti-patterns](../../.claude/rules/phase-research-coverage.md): the F.3 discipline (channel-matters anti-pattern) was applied to the new sub-block but not back-checked against the existing row 3 in the same §5.

---

## §3 Search-coverage execution (phase-research-coverage.md §1)

### §3.1 SSOT consult — `prior-art-evaluations.md`

Grep for «worktree», «dispatch», «channel», «Agent», «orchestrat»:

- **SSOT #65** (`superpowers:using-git-worktrees`, ADOPT): worktree-isolation mechanism, REFERENCE precedent. Step 0 detects already-active worktree via `GIT_DIR != GIT_COMMON_DIR` and skips nested creation — **compatible with Claude Code `Agent({isolation:"worktree"})`** per [parallel-subwave-isolation.md §4](../../.claude/rules/parallel-subwave-isolation.md) (verified 2026-05-22 dual-channel: DeepWiki + raw WebFetch against shipped SKILL.md). This entry MATTERS: it documents that Agent-tool isolation IS the dogfooded upstream mechanism for parallel sub-wave isolation. Row 3 is consistent with SSOT #65; anti-pattern §348 cuts AGAINST SSOT #65 (forces manual paste-fresh-tab instead of dogfooded Agent-tool primitive).
- **SSOT #64** (`subagent-driven-development`, ADOPT VOCABULARY): upstream Superpowers pattern where Workers ARE subagents dispatched via Task/Agent tool. This is the upstream norm — Agent-tool dispatch for write-task Workers is standard practice. Anti-pattern §348 deviates from this upstream norm.
- **SSOT #67** (aif-handoff full Kanban runtime, REJECT for /meta-orchestrator scope): documented divergence — aif-handoff dispatches Workers via cron + paused-gate primitives, not Agent-tool. This is one precedent of «not Agent-tool» but for a different reason (autonomous runtime, not channel discipline).

**Conclusion:** SSOT consult favours row 3 (compatible with #64 + #65) over anti-pattern §348 (deviates from #64 + #65). Anti-pattern §348 has no SSOT citation in its own §348 text.

### §3.2 Superpowers upstream norm — decisive evidence

The project has adopted Superpowers as SSOT #64 (subagent-driven-development) and SSOT #65 (using-git-worktrees). What does Superpowers itself do for parallel write-task Worker dispatch?

**SP `dispatching-parallel-agents` SKILL** ([line 70-74](file:///Users/art/.claude/plugins/marketplaces/superpowers-dev/skills/dispatching-parallel-agents/SKILL.md)):

> ```typescript
> // In Claude Code / AI environment
> Task("Fix agent-tool-abort.test.ts failures")
> Task("Fix batch-completion-behavior.test.ts failures")
> Task("Fix tool-approval-race-conditions.test.ts failures")
> // All three run concurrently
> ```

These are explicit **write tasks** — «Fix … failures» = editing production code, running tests, committing. Dispatched via Task tool from a single session, in parallel. No paste-to-fresh-tab discipline. The skill's section title is literally «Dispatch in Parallel».

**SP `subagent-driven-development` SKILL** ([line 124, 213](file:///Users/art/.claude/plugins/marketplaces/superpowers-dev/skills/subagent-driven-development/SKILL.md)): the Implementer subagent (writes code, runs tests, commits) is dispatched via Task tool inline. Advantage stated explicitly: «vs. Executing Plans: Same session (no handoff). Continuous progress (no waiting).» Single-session in-process Task-tool dispatch is positioned as the SUPERIOR option vs. handoff-to-fresh-session.

**SP `using-git-worktrees` SKILL Red Flag #1** ([line 203](file:///Users/art/.claude/plugins/marketplaces/superpowers-dev/skills/using-git-worktrees/SKILL.md)):

> «Use `git worktree add` when you have a native worktree tool (e.g., `EnterWorktree`). This is the #1 mistake — if you have it, use it.»

And Step 1a ([line 53](file:///Users/art/.claude/plugins/marketplaces/superpowers-dev/skills/using-git-worktrees/SKILL.md)):

> «Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag. If you do, use it … Native tools handle directory placement, branch creation, and cleanup automatically. Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage.»

Common Mistakes section labels this anti-pattern «Fighting the harness» ([line 174-177](file:///Users/art/.claude/plugins/marketplaces/superpowers-dev/skills/using-git-worktrees/SKILL.md)):

> «**Problem:** Using `git worktree add` when the platform already provides isolation. **Fix:** Step 0 detects existing isolation. Step 1a defers to native tools.»

Claude Code's `Agent({isolation:"worktree"})` IS the native worktree primitive of the harness. Per SP norm, using it is required; falling back to manual `git worktree add` when the primitive is available IS the labelled «#1 mistake» and «fighting the harness».

**Conclusion — load-bearing for verdict:** the project's adopted upstream (Superpowers, SSOT #64 + #65) explicitly:
1. Dispatches write-task Workers via Task/Agent tool inline (no fresh-tab paste discipline).
2. Mandates native worktree primitive over manual `git worktree add`.
3. Labels deviation from these as «fighting the harness» and «#1 mistake».

Our anti-pattern §348 instructs the OPPOSITE on both axes. Per [build-first-reuse-default.md §4 `#parallel-evolution-creep`](../../.claude/rules/build-first-reuse-default.md), this is a textbook case: adopted upstream's pattern was supplanted by a local discipline that the adopting decision did not document a rationale against.

### §3.3 DeepWiki / WebSearch coverage

Skipped beyond Superpowers — Superpowers IS the SSOT precedent for this surface (#64 + #65) and provided decisive evidence in §3.2. External tools beyond the adopted upstream are not on-point for resolving an internal drift where the upstream's own pattern is authoritative.

### §3.4 Build-vs-reuse posture

Per [build-first-reuse-default.md §2](../../.claude/rules/build-first-reuse-default.md): if the project ALREADY adopted SSOT #65 (worktree isolation via CC primitive `Agent({isolation:"worktree"})`), then row 3 is the row that REUSES the upstream primitive. Anti-pattern §348 would deprecate that REUSE in favour of a BUILD-equivalent (manual `git worktree add` blocks emitted by the meta-orch + paste discipline). This is exactly the anti-pattern `#parallel-evolution-creep` in [build-first-reuse-default.md §4](../../.claude/rules/build-first-reuse-default.md) — composing local-discipline decisions that incrementally bypass an already-adopted upstream primitive.

### §3.5 CC primitive verification — Agent tool `isolation:"worktree"` semantics

From this session's Agent tool spec:
> «Isolation mode. "worktree" creates a temporary git worktree so the agent works on an isolated copy of the repo.»

And in the tool result postscript:
> «With `isolation: "worktree"`, the worktree is automatically cleaned up if the agent makes no changes; otherwise the path and branch are returned in the result.»

This is exactly the same operational behaviour as a maintainer-paste fresh-tab session with manual `git worktree add` + branch + work + cleanup. The audit-trail argument («Agent-tool = depth-2 subagent = no external loop close» per F.3 design Item 7 Falsifier) is technically true at the conversational level, but operationally the file outputs land in the same git history with the same Worker-committed audit trail (per anti-pattern `#commit-on-behalf-of-worker` at [SKILL.md:349](../../.claude/skills/meta-orchestrator/SKILL.md#L349), the Worker — whether subagent or fresh-tab — commits its own work).

### §3.6 Internal sweep — `grep` on row 3 and anti-pattern usage

`grep -rn 'worker-dispatch-via-subagent' .claude/`:
- [SKILL.md:348](../../.claude/skills/meta-orchestrator/SKILL.md#L348) — origin
- Referenced by 2 orchestrator-prompts kickoffs (`meta-orch-channel-discipline` Stage 5 incident, `meta-orchestrator-skill-memory`)

`grep -rn 'Mode A × N inline Agents'`:
- [SKILL.md:322](../../.claude/skills/meta-orchestrator/SKILL.md#L322) — origin
- [F.3 design patch §Item 7](2026-05-24-meta-orchestrator-refactor-f3-scope.md) does NOT cite row 3
- No other references in `.claude/skills/` or `.claude/orchestrator-prompts/`

Row 3 has zero downstream references documenting its intended scope; anti-pattern §348 has 2 references treating it as load-bearing. The lived discipline (incident reports, future kickoffs) tracks the anti-pattern, not row 3. But the meta-orchestrator's own §5 still emits row 3 as a valid pattern in its dispatch tree — so when the AI session reads §5 it sees row 3, row 5, AND the anti-pattern. Resolution is unspecified.

### §3.7 Adversarial counter-prompt (§1.4)

«If both rules are correct as stated, what is the case row 3 covers that does NOT violate anti-pattern §348?» Answer attempt: **read-only research subagents that return text** (per anti-pattern §348 own carve-out). But row 3 specifies «R-phase, multiple parallel» — and R-phase per [orchestrator skill SKILL.md upstream](/Users/art/.claude/skills/orchestrator/SKILL.md) produces a file (research-patch). Read-only research that returns text is a different surface than R-phase work. So row 3 cannot be interpreted as «read-only research» without contradicting its own R-phase label.

Counter-prompt does not produce a coherent reconciliation. The two rules genuinely conflict.

---

## §4 Resolution candidates

Four candidates, each with claim shape + falsifier:

### §4.1 Candidate A — Row 3 wins (anti-pattern narrows)

**Claim:** Row 3 is the correct rule. Anti-pattern §348 should narrow to: «non-doc write tasks (code, configs, settings.json edits) → fresh-tab paste; doc writes (R-phase research-patches, retros, kickoffs) → Agent-tool with `isolation:"worktree"` permitted».

**Edit shape:**
- [SKILL.md:322](../../.claude/skills/meta-orchestrator/SKILL.md#L322) row 3 keeps wording but adds explicit «using `Agent({isolation:"worktree"})` for write outputs to research-patches/»
- [SKILL.md:348](../../.claude/skills/meta-orchestrator/SKILL.md#L348) anti-pattern §348 narrows to: «Worker dispatch via Agent tool for **code-write tasks** from the meta-orchestrator session — forbidden. Doc-write tasks (R-phase research-patches) permitted via Agent + `isolation:"worktree"`. Channel matters for code; doc-write blast radius is low enough that audit-trail equivalence holds via worktree cleanup.»

**BFR posture:** REUSE — preserves SSOT #65 dogfood + SSOT #64 vocabulary. No new BUILD.

**Operational impact:** All 4 Sub-waves of aif-handoff bridge umbrella dispatchable via one Agent ×4 call from any session. Zero maintainer manual setup. Same applies to all future parallel R-phase umbrellas.

**Falsifier:** wrong if the audit-trail argument («channel matters» per F.3 Item 7 author) is load-bearing for project goals (e.g. maintainer wants visible external loop-close for *every* Worker action including doc writes, not just code writes). If true, narrowing the anti-pattern weakens a discipline the project intentionally added.

### §4.2 Candidate B — Anti-pattern wins (row 3 narrows or deletes)

**Claim:** Anti-pattern §348 is the correct rule (more recent + explicit Falsifier + explicit channel-matters principle). Row 3 should narrow to read-only sub-agent calls only, or be removed entirely.

**Edit shape:**
- [SKILL.md:322](../../.claude/skills/meta-orchestrator/SKILL.md#L322) row 3 changes to: «R-phase, multiple parallel → Mode B × N worktrees (fresh-tab paste per anti-pattern §348). R-phase doc writes go through the same channel discipline as code writes; no special doc-vs-code carve-out.»
- Alternative: delete row 3 entirely; merge into row 5 «Execution-build, parallel ≥2 in same stage → Mode B × N worktrees» with R-phase explicitly included.

**BFR posture:** Worsens BFR — manual `git worktree add` is a BUILD of an already-REUSED CC primitive. Justified only if channel discipline outweighs BFR.

**Operational impact:** Manual paste-into-fresh-tab + manual worktree remains the norm for every parallel R-phase. The maintainer's current friction is by design and won't change.

**Falsifier:** wrong if the manual-paste discipline does not deliver the intended audit-trail benefit (e.g. if the maintainer never actually reads the «external loop-close» events between sub-wave dispatches and the discipline is purely theatrical). Also wrong if `Agent({isolation:"worktree"})` provides equivalent audit-trail via worktree-resolved-path-in-result.

### §4.3 Candidate C — Hybrid: Agent-with-isolation === fresh-tab equivalent

**Claim:** `Agent({isolation:"worktree"})` is a third channel that satisfies the anti-pattern's audit-trail intent through worktree-resolved-path-in-result. Row 3 implicitly assumes this; anti-pattern §348 implicitly excludes it. Both are correct under different operational definitions of «channel».

**Edit shape:**
- [SKILL.md:348](../../.claude/skills/meta-orchestrator/SKILL.md#L348) anti-pattern §348 amended to explicitly carve out `Agent({isolation:"worktree"})` as a third valid channel: «Worker dispatch via Agent tool from the meta-orchestrator session WITHOUT `isolation:"worktree"` = forbidden for write tasks. WITH `isolation:"worktree"`, the worktree provides equivalent audit-trail (resolved-path-in-result + cleanup) — permitted, same as fresh-tab paste.»
- [SKILL.md:322](../../.claude/skills/meta-orchestrator/SKILL.md#L322) row 3 amended to make the isolation requirement explicit: «Mode A × N inline Agents **with `isolation:"worktree"`**. No manual worktree setup needed; CC creates and cleans up automatically.»

**BFR posture:** REUSE — fully leverages SSOT #65. Audit discipline preserved.

**Operational impact:** Same as Candidate A — Sub-waves dispatchable via Agent ×4 inline. Maintainer experience identical to row 3 wins.

**Falsifier:** wrong if F.3 design author intended «channel = literal session boundary» (i.e. a fresh CC process, not a worktree-isolated sub-agent). The F.3 Item 7 Falsifier text says «the CHANNEL matters (maintainer paste = external loop-close; Agent = subagent = depth-2 violation for non-read-only)» — «depth-2 violation» suggests literal session depth, not isolation. If literal session depth is load-bearing, worktree isolation does not satisfy the discipline.

### §4.4 Candidate D — Distinguish at dispatch-source-of-truth granularity

**Claim:** The conflict is real but the resolution is workflow-dependent — meta-orchestrator session (the planner) MUST paste; downstream orchestrator session (the executor) MAY use Agent-tool inline. The anti-pattern is specifically about the meta-orchestrator session not crossing into executor role.

**Edit shape:**
- [SKILL.md:322](../../.claude/skills/meta-orchestrator/SKILL.md#L322) row 3 stays as-is — describes what the orchestrator (downstream) session does internally for its parallel R-phase sub-tasks.
- [SKILL.md:348](../../.claude/skills/meta-orchestrator/SKILL.md#L348) anti-pattern §348 stays as-is — applies only to the meta-orchestrator (upstream planner) session not dispatching Workers itself.
- Add §5 prose clarifying the two-tier model: meta-orchestrator emits 1-liners → maintainer pastes → fresh orchestrator session opens → THAT orchestrator session uses row 3 Agent-tool dispatch for ITS internal sub-tasks.

**BFR posture:** REUSE — preserves both rules with explicit scope.

**Operational impact:** For aif-handoff bridge specifically, where ALL Sub-waves are R-phase (no further internal sub-decomposition), candidate D collapses to candidate B (paste-discipline rules at the meta-orch → orchestrator handoff). For umbrellas where the dispatched orchestrator session ITSELF decomposes further, candidate D allows the inner decomposition via Agent-tool inline. For the maintainer's actual current friction (aif-handoff bridge Sub-waves), this candidate does NOT relieve the friction.

**Falsifier:** wrong if the maintainer-friction case (single-level R-phase Sub-waves) is the dominant use case. If yes, candidate D resolves a different conflict (inter-tier) and leaves the user-experienced friction (intra-tier) unaddressed. Also wrong if the F.3 design author intended channel-matters as a universal rule, not a tier-bounded one (the §348 text says «Channel matters — Agent-tool = subagent = wrong channel for writes», unqualified).

---

## §5 Per-candidate verdict — Decision matrix

| Candidate | BFR posture | Maintainer friction relief | F.3 author intent preserved | SSOT #65 dogfood preserved | Audit-trail discipline strength |
|---|---|---|---|---|---|
| A — Row 3 wins | REUSE ✓ | Full relief | Partial (channel-matters narrowed) | ✓ | Doc-write carve-out (weaker) |
| B — Anti-pattern wins | BUILD ✗ (against Superpowers norm) | None | ✓ Full | ✗ Bypassed | Full |
| C — Hybrid (Agent+isolation === fresh-tab) | REUSE ✓ (aligned with Superpowers norm) | Full relief | Partial (depth-2 reinterpreted) | ✓ | Full (via worktree audit-trail) |
| D — Tier-distinguish | REUSE ✓ | None (for current case) | ✓ Full | Partial | Full |

The matrix surfaces a clear pattern: **A and C both deliver maintainer friction relief while preserving SSOT #65 REUSE**. They differ on whether to weaken (A) or reinterpret (C) the F.3 author's «channel matters» principle. Both are defensible. C preserves more of the F.3 intent by adding an explicit carve-out criterion (`isolation:"worktree"`) rather than a content-category carve-out (docs vs code).

B preserves F.3 intent fully but at high BFR cost — it actively bypasses an adopted upstream primitive (SSOT #65) for a project-local discipline that the F.3 author themselves did not explicitly justify against the build-first-reuse default.

D resolves a DIFFERENT conflict (inter-tier) that is not the conflict the maintainer is hitting.

---

## §6 Recommendation

**Candidate C** — Hybrid. Add `isolation:"worktree"` as the explicit gate for whether Agent-tool dispatch satisfies the channel-matters discipline. Strengthened to near-certain by §3.2 Superpowers upstream evidence.

**Rationale:**

1. **Aligns with the project's own adopted upstream (SSOT #64 + #65).** Per §3.2: Superpowers explicitly dispatches write-task Workers via Task/Agent tool inline (`dispatching-parallel-agents` line 70-74) AND mandates the harness-native worktree primitive over manual `git worktree add` (`using-git-worktrees` Red Flag #1, line 203 — labelled «the #1 mistake»). Candidate C is the option that does what the adopted upstream does. Candidate B is the option that does what the adopted upstream labels «#1 mistake» and «fighting the harness».
2. **Resolves the BFR posture without ambiguity.** Per [build-first-reuse-default.md §4 `#parallel-evolution-creep`](../../.claude/rules/build-first-reuse-default.md): composing local discipline decisions that incrementally bypass an adopted upstream primitive is the textbook anti-pattern. Anti-pattern §348's «paste-fresh-tab-only» discipline IS that anti-pattern in operation, and was introduced (F.3 UX, commit 09c245a) without a documented rationale against Superpowers' opposite norm.
3. **Preserves F.3 author intent operationally.** The «channel matters» principle can be honoured by a more precise gate (isolation flag) than F.3 Item 7's session-depth proxy. The audit-trail benefit — Worker output traceable to a separate filesystem subtree — holds equally for worktree-isolated sub-agents and fresh CC tabs. Worktree audit trail (resolved path returned in Agent result, separate filesystem state, separate `.git/index`) is operationally equivalent to a fresh-tab's audit surface.
4. **Operationally testable Falsifier exists.** Maintainer may still clarify F.3 intent as «literal session-depth, not worktree-isolation» — surface as DECISION-NEEDED per [reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md). But the bar is now high: the maintainer would be choosing project-local discipline over upstream Superpowers norm, against BFR §4. That's a legitimate maintainer prerogative but requires explicit rationale.
5. **No BUILD; no SSOT row needed.** Candidate C is a SKILL.md textual edit + dispatch-template revision. Not a capability commit by [CLAUDE.md «What is a capability commit?»](../../CLAUDE.md) (no new dep, no ≥50-LOC new dir, likely <80 LOC delta).

**Falsifier of the recommendation itself:** wrong if maintainer clarifies F.3 author intent was «literal session-depth, no `isolation` carve-out, accept BFR cost against Superpowers norm» — in that case Candidate B is the chosen resolution, and the maintainer documents the explicit deviation from §3.2 Superpowers norm + records the BFR override rationale alongside anti-pattern §348. Path forward then = no SKILL.md edit + anti-pattern §348 gets a «BFR override rationale» appendix. Parallel-R-phase friction stays by design.

The default — absent explicit BFR-override decision — is Candidate C, because the project's adopted SSOT #64 + #65 already chose the upstream norm; reaffirming that choice via SKILL.md edit is the consistent move.

---

## §7 §1.7 Forward-check applied

- **[doc-authority-hierarchy.md §5](../../.claude/rules/doc-authority-hierarchy.md):** verified — research-patch lives under `docs/meta-factory/research-patches/`, folder-level authority pattern (scope comment at line 1, no per-file Authoritative-for header required).
- **[phase-research-coverage.md §1](../../.claude/rules/phase-research-coverage.md):** verified — 6-item checklist run with documented coverage (own-stack sweep §3.5, category sweep N/A internal-drift, semantic-distance §3.6 adversarial counter-prompt, negative-existence not claimed, prompt-list-floor N/A, trigger sweep — this drift was surface-discovered by maintainer friction not by §1.6 sweep, file:line evidence per claim). DeepWiki + WebSearch omitted with rationale in §3.2 (internal SKILL.md drift, not external negative-existence claim).
- **[phase-research-coverage.md §1.11](../../.claude/rules/phase-research-coverage.md):** verified — claims verified against source-of-truth: §2.1/§2.2 origin commits verified via `git log -S` + `git show`; §1.1/§1.2 rule citations verified via Read on actual SKILL.md lines; §3.1 SSOT entries verified via existing memory + filing-system grep (not blind quote).
- **[phase-research-coverage.md §1.12](../../.claude/rules/phase-research-coverage.md):** verified — §6 leads with reasoned recommendation (Candidate C), backs with 4-point rationale, states Falsifier explicitly; does not option-dump. The DECISION-NEEDED reservation is surfaced ONLY where it is a true project-strategy fork (F.3 author intent — only maintainer can authoritatively clarify).
- **[build-first-reuse-default.md §1](../../.claude/rules/build-first-reuse-default.md):** verified — Candidate C is REUSE (preserves SSOT #65 adoption). Candidate B would be the BUILD path; explicitly identified as worse-BFR in §5 matrix. No new BUILD verdict introduced.
- **[no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md):** verified — no CI-side LLM proposed in any candidate. All resolutions are deterministic SKILL.md edits.
- **[reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md):** verified — §6 Recommendation Falsifier surfaces the F.3 intent question as DECISION-NEEDED to maintainer; this research-patch does NOT pick the resolution unilaterally.
- **[ai-laziness-traps.md §2](../../.claude/rules/ai-laziness-traps.md):** verified — T1 (sampling): §3 evidence breadth across SSOT #64/#65/#67 + adversarial counter-prompt; T3 (file:line per claim): every rule cited has file:line; T16 (pattern-matching-on-name): Candidate C explicitly tests `isolation:"worktree"` channel by operational equivalence not by name; T19 (own QA before handoff): this §7 IS my own QA.

## §8 §1.7 Backward-check applied

Sweep of existing SKILL.md content under the proposed Candidate C edit's scope:

- [SKILL.md:322 row 3](../../.claude/skills/meta-orchestrator/SKILL.md#L322): direct target of the proposed edit.
- [SKILL.md:347-348 anti-pattern §348](../../.claude/skills/meta-orchestrator/SKILL.md#L348): direct target of the proposed edit.
- [SKILL.md:454 «From the worktree `rules-as-tests-aif-meta-orchestrator-iphase/`»](../../.claude/skills/meta-orchestrator/SKILL.md#L454): references the manual-worktree pattern; should be updated to reference `Agent({isolation:"worktree"})` if Candidate C is adopted. Surface as I-phase edit item.
- [meta-kickoff.template.md §4 `{{DISPATCH_INSTRUCTIONS}}`](../../.claude/skills/meta-orchestrator/templates/meta-kickoff.template.md#L61): generator-side template that produces the maintainer-pasted dispatch text. If Candidate C is adopted, the generation logic in [SKILL.md §3 Step 2 / §4](../../.claude/skills/meta-orchestrator/SKILL.md) needs updated routing: for «R-phase, multiple parallel» rows, emit `Agent({isolation:"worktree"})` example code instead of `git worktree add` blocks. Surface as I-phase edit item.
- [placeholders.md:24 `{{DISPATCH_INSTRUCTIONS}}` description](../../.claude/skills/meta-orchestrator/references/placeholders.md#L24): currently «name the worktree command (Mode B) or inline Agent dispatch (Mode A) per §5 Dispatch tree». Already implies Mode A inline = inline Agent dispatch (row 3 reading). Consistent with Candidate C; no edit needed.
- [parallel-subwave-isolation.md §1](../../.claude/rules/parallel-subwave-isolation.md): worktree-isolation mandate for parallel sub-waves. Candidate C preserves the mandate; only changes whether worktree creation is CC-primitive-driven or manual. Backward-compatible.
- [parallel-subwave-isolation.md §4 N7](../../.claude/rules/parallel-subwave-isolation.md): explicit REFERENCE to SSOT #65 + Claude Code `isolation:"worktree"` as the preventive mechanism. Candidate C is fully consistent; Candidate B contradicts this rule directly. (Additional reinforcement for the §5 matrix's BFR scoring against B.)

No artefact under proposed Candidate C scope is silently superseded. Two SKILL.md follow-up edits identified for the I-phase (line 454 prose + dispatch-generation routing). No new principle test required (the SKILL.md edits are not principle-test-shaped — they are prose discipline statements, the Class C standard for SKILL.md per [SKILL.md:20 Class field](../../.claude/skills/meta-orchestrator/SKILL.md#L20)).

## §9 Self-application (T15)

Does this research-patch itself violate the discipline it analyses?

This patch was written by an Agent-tool-equivalent (the current Claude Code session, depth-1, directly writing files via Write tool). Per anti-pattern §348 strict reading: «Worker dispatch via Agent tool from the meta-orchestrator session» = forbidden for writes. Am I a Worker dispatched from the meta-orchestrator session?

I am not — the meta-orchestrator session that generated the user's dispatch text is upstream (closed); I am a downstream Claude Code session opened by the user pasting nothing in particular (just continuing the chat). So §348 does not apply to me. But the analogous question — «is this session writing a file as part of a delegated R-phase task?» — is YES (single Sub-wave Mode A inline R-phase per [SKILL.md:320 row 1](../../.claude/skills/meta-orchestrator/SKILL.md#L320)).

Per row 1 «R-phase, single → Mode A inline → Single-focus R-phase = one Opus session», this session IS the valid dispatch shape for a single R-phase. No anti-pattern violation: this is the unambiguous case both rules agree on.

The proposed Candidate C, applied to this patch's authorship, would treat depth-1 Agent-tool-equivalent inline (this session) as channel-compliant. Candidate B applied here would forbid this very session from writing the patch — which is absurd, since the user explicitly authorised the work. The absurd-conclusion test favours Candidate C; Candidate B may need additional carving even for the single-R-phase case to remain coherent.

## §10 ATTN / open questions

1. **Maintainer DECISION-NEEDED:** clarify F.3 Item 7 «channel matters» author intent — literal session-depth (favours B) or operational audit-trail equivalence (favours C). Recommend: 1-sentence clarification, then the I-phase edit follows from the matrix.
2. **If Candidate C is approved:** I-phase edits identified in §8 backward-check (SKILL.md:322 row 3 + SKILL.md:347-348 + SKILL.md:454 + dispatch-generation routing in §3/§4). ~80-150 LOC delta. Single SKILL.md edit PR + mirror sync to consumer-relative `packages/core/templates/shared/skill-context/meta-orchestrator/SKILL.md` if present (per existing dual-implementation discipline).
3. **If Candidate B is approved:** I-phase edit = delete row 3 + clarify row 5 covers R-phase. No friction relief; document the deliberate design cost in a note next to the anti-pattern explaining why BFR was deprioritised.
4. **Orthogonal note:** the meta-orchestrator session that generated the user's actual dispatch text appears to have resolved the §5 conflict by IMPLICITLY following Candidate B (paste-and-manual-worktree). That choice was unflagged. Whichever candidate is chosen, the meta-orchestrator's resolution-logic should be made explicit so future AI sessions don't re-invent the resolution per invocation.

---

## See also

- [.claude/skills/meta-orchestrator/SKILL.md §5 lines 312-349](../../.claude/skills/meta-orchestrator/SKILL.md) — both conflicting rules.
- [docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-refactor-f3-scope.md §Item 7](2026-05-24-meta-orchestrator-refactor-f3-scope.md) — F.3 design intent for anti-pattern §348.
- [docs/meta-factory/prior-art-evaluations.md #65](../prior-art-evaluations.md) — SSOT REFERENCE for `superpowers:using-git-worktrees` (dogfooded upstream).
- [.claude/rules/parallel-subwave-isolation.md §4 N7](../../.claude/rules/parallel-subwave-isolation.md) — explicit REFERENCE to CC `isolation:"worktree"` as the project's adopted worktree-isolation mechanism.
- [.claude/rules/build-first-reuse-default.md §1](../../.claude/rules/build-first-reuse-default.md) — BFR discipline that favours Candidate A or C over B.
- [.claude/rules/reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md) — basis for §6 Falsifier reserving final author-intent clarification to maintainer.

Prior-art: prior-art-evaluations.md#65 (`using-git-worktrees` REFERENCE — Candidate C preserves this adoption; Candidate B contradicts it).
