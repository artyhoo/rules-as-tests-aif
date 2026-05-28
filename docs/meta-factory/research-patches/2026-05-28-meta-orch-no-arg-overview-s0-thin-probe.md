# Stage 0-thin §1.5d probe — meta-orch-no-arg-overview

> **Authoritative for:** §1.5d probe shipping unit + §5b conditional verdict matrix (Stage 0-thin scope) for the `meta-orch-no-arg-overview` umbrella.
> **NOT authoritative for:** full Stage 0 R-phase (§1 items 1-6 except 5d, §2 falsifiers P2/P3, Stage 3 UX design verdict, §1.5c branch-naming audit) — those land in a separate Stage 0-remainder patch per Option B P4-front-loaded plan.
> **Origin:** 2026-05-28 P4-front-loaded thin probe per meta-launch kickoff §4 Option B step 1.

## §0 — P4 restatement

P4 problem statement (`.claude/orchestrator-prompts/meta-orch-no-arg-overview/kickoff.md:44`):

> **P4 — `!`-fence helper invocations fail CC permission check.** Surfaced 2026-05-28 same session as the kickoff itself was invoked: `/meta-orchestrator <kickoff-path>` → CC dispatched `[SKILL.md §2.5 Step 2]` body which is a ` ```! ` fenced block calling `${CLAUDE_SKILL_DIR}/helpers/dup-detect.sh "${umbrella:-}" 2>/dev/null || ${CLAUDE_SKILL_DIR}/helpers/dup-detect.sh --all 2>/dev/null` → `Shell command permission check failed for pattern …`. Hits **all 14 inline-shell blocks** in SKILL.md, not just dup-detect — dup-detect was just the first unknown pattern in this session.

The thin probe's role: discriminate harness-bug vs form-mismatch BEFORE Stage 4 ships any agent-side fix (per T-NoArg-D countermeasure in meta-launch kickoff §5, `.claude/orchestrator-prompts/meta-orch-no-arg-overview-meta-launch/kickoff.md:149`). Until the probe runs, Stage 4 cannot safely write any `!`-block rewrite — a harness-bug finding would redirect the fix to an upstream CC issue rather than a `settings.json` allow-rule patch.

## §1.5d — Evidence

### File 1 — `.claude/skills/probe-cc-perm/SKILL.md` (verbatim)

````markdown
---
name: probe-cc-perm
description: One-shot probe — records the literal pattern CC emits to its permission check for a !-fenced helper invocation. Used by 2026-05-28 meta-orch-no-arg-overview umbrella Stage 0 §1.5d. Delete after use.
---

## Probe 1 — direct shell builtin (control, never matches a Bash(*) allow-rule pattern related to helpers)

```!
echo probe-ok-direct
```

## Probe 2 — compound `||` (matches P4-b compound-matcher concern)

```!
true || true
```

## Probe 3 — direct-path helper invocation (matches the EXACT failing pattern in P4 §0)

```!
${CLAUDE_SKILL_DIR}/helpers/probe.sh probe-arg
```

## Without this skill

Diagnosis of P4 (`!`-fence helper invocation failure in `meta-orchestrator` SKILL.md) stalls on inference: we cannot tell whether CC's permission check sees the raw `` ```! `` fence as text or extracts the inner command, so Stage 4 cannot ship an evidence-grounded fix and risks targeting the wrong root cause (harness bug vs allow-list shape mismatch).

## With this skill

Maintainer invokes `/probe-cc-perm` once, captures the three literal patterns CC emits to its permission check (control + compound `||` + direct-path helper), and the conditional verdict matrix in research-patch `2026-05-28-meta-orch-no-arg-overview-s0-thin-probe.md` §5b resolves to either harness-clean or harness-bug; Stage 4 dispatch then writes a settings.json allow-rule of the exact shape the empirical evidence dictates.
````

### File 2 — `.claude/skills/probe-cc-perm/helpers/probe.sh` (verbatim)

```bash
#!/usr/bin/env bash
# Stage 0 §1.5d probe helper — minimal executable target so Probe 3 in SKILL.md
# reproduces the exact direct-path-to-helper form that fails in P4 (kickoff §0).
# Echoes back its arg verbatim; existence + executability is what matters.
echo "probe-helper-ok: $1"
```

`chmod +x` applied to `probe.sh` in this commit, per `stage-0-rphase-dispatch.md:85` directive: «Mark executable: `chmod +x .claude/skills/probe-cc-perm/helpers/probe.sh` in the same commit. This is intentional — the probe must succeed when the allow-rule eventually matches, otherwise the empirical loop never closes.»

All three files land in one atomic commit (`git diff HEAD~1 --stat` → 3 files, per `stage-0-rphase-dispatch.md:89`).

## §5b — §1.5d-only conditional verdict matrix

**§5b verdict: DEFERRED-PENDING-PROBE-INVOCATION**

Verbatim from `stage-0-rphase-dispatch.md:95-98`:

- **Harness-clean:** «If maintainer invocation of `/probe-cc-perm` (after Stage 0 lands) shows Probe 1 emits pattern = literal `echo probe-ok-direct` → CC fence-parsing clean → P4 root cause is P4-a (form-mismatch) ± P4-b (compound `||`) → Stage 4 agent-applied work PROCEEDS per §5b harness-clean branch.»
- **Harness-bug:** «If any Probe pattern includes literal ` ```! ` fence-leak → CC harness bug → escalate upstream; Stage 4 agent-applied work STOPS per §5b harness-bug branch, only the maintainer-recipe portion ships.»
- **Probe 2 reading:** «Probe 2 reveals whether single-helper allow-rule suffices for compound `||` (each clause matched independently → emitted pattern is `true` once or twice) or whether compound-aware rules are required (single pattern emitted = `true || true`). Records into §5b sub-decision: maintainer-recipe allow-rule shape for compound chains.»
- **Probe 3 reading:** «Probe 3 reveals the literal allow-list shape that would unblock direct-path helper invocations (e.g. the emitted pattern is `bash ${CLAUDE_SKILL_DIR}/helpers/probe.sh probe-arg` or `${CLAUDE_SKILL_DIR}/helpers/probe.sh probe-arg` or some other variant). The exact emitted form dictates the `.claude/settings.json` `Bash(...)` glob shape that Stage 4 (or maintainer-recipe) needs.»

Stage 4 dispatch consumes this matrix + the empirical probe result.

## §7 — §1.7 self-reflexive note

Per `phase-research-coverage.md §1.7` (`.claude/rules/phase-research-coverage.md:31-33`).

**Forward-check:** existing disciplines checked before this thin-probe scope-split shipped:
- `doc-authority-hierarchy.md §3` (`.claude/rules/doc-authority-hierarchy.md:§3`) — Authoritative-for blockquote header present; no `> **Class:**` field (research-patches are not `.claude/rules/*.md` — omitted correctly per dispatch §3 file-3 note).
- `phase-research-coverage.md §1.7` (`.claude/rules/phase-research-coverage.md:31`) — this §7 section is the self-reflexive forward+backward note mandated there.
- `build-first-reuse-default.md §1` (`.claude/rules/build-first-reuse-default.md:§1`) — no new capability introduced; this is a throwaway probe skill + research-patch only. Commit trailer rationale: «research patch only, no new capability.»
- `no-paid-llm-in-ci.md §1` (`.claude/rules/no-paid-llm-in-ci.md:§1`) — no CI LLM introduced; probe.sh is a pure bash echo script.
- `parallel-subwave-isolation.md §1` (`.claude/rules/parallel-subwave-isolation.md:§1`) — worktree isolation in use: branch `feat/meta-orch-no-arg-overview-s0-thin-probe` in dedicated worktree `/Users/art/code/rules-as-tests-aif-noarg-s0-thin`, not primary workdir.
- Principle 15 — Skill paired-negative (`packages/core/principles/15-skill-paired-negative.test.ts:127`) — `.claude/skills/probe-cc-perm/SKILL.md` carries both `## Without this skill` and `## With this skill` sections (each ≥40 non-trivial chars, non-tautological). Added in commit-2 of this branch after pre-push surfaced the gap; source dispatch §1.5d body was incomplete on this principle.

**Backward-check:** sweep of superseded/affected artefacts:
- This thin patch supersedes nothing. It carves only the §1.5d portion out of `stage-0-rphase-dispatch.md` for early ship.
- Stage 0-remainder will land: §1 items 1-6 except 5d, Stage 3 UX design verdict, §1.5c branch-naming audit (100-PR gh probe), §2 P2/P3 falsifiers, §3 / §4 / §5a / §6. None of those are silently superseded or affected by this patch.
- The throwaway skill `.claude/skills/probe-cc-perm/` is NEW — no existing skill overwritten.

## §8 — See also

- `.claude/orchestrator-prompts/meta-orch-no-arg-overview-meta-launch/kickoff.md` §4 Option B — P4-front-loaded plan selecting this thin-probe-first dispatch.
- `.claude/orchestrator-prompts/meta-orch-no-arg-overview/stage-0-rphase-dispatch.md` §1.5d — binding scope source; §5b matrix verbatim from lines 95-98.
- `.claude/orchestrator-prompts/meta-orch-no-arg-overview/kickoff.md` line 44 — P4 problem statement (§0 evidence source).
- `.claude/rules/ai-laziness-traps.md §2` — T20 (inline-verdict-without-evidence) + T-NoArg-D (`#skill-invocation-form-mismatch-allowlist`) countermeasures active in this patch.
- `.claude/skills/probe-cc-perm/SKILL.md` — the throwaway probe skill shipped in this commit (Delete after use).
