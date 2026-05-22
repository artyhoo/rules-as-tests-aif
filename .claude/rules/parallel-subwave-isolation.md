# Parallel sub-wave isolation — discipline rule

> **Class:** C — prose-only; the preventive enforcement primitive is **dogfooded from upstream** (Superpowers `using-git-worktrees`, SSOT #65) rather than built — the own AST-detection ambition is **dropped** per §4 (N7, 2026-05-22).
> **Authoritative for:** parallel-subwave-isolation rule — §1 git worktree requirement for parallel Sonnet sessions, §2 sequential-fallback escape hatch, §3 anti-patterns (`#shared-workdir-parallel`, `#branch-race-on-checkout`), §4 promotion / retirement triggers, §5 §1.7 self-reflexive note.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Companion to orchestrator skill — global skill at `~/.claude/skills/orchestrator/SKILL.md` may reference this rule.

> **Origin:** Incident 2026-05-12, Wave 8.1/8.1b/8.2 parallel rollout. Shared working directory across parallel Sonnet sessions caused branch contamination — Wave 8.1's commit ended up on `wave-8.1b/compliance-verifier-agent` branch because junior sessions raced on `git checkout -b`. Required orchestrator-side cherry-pick surgery + caused junior REPORTs to surface false-alarm audit failures from stale working-tree files. Codified in repo following the post-Wave-9 memory-to-docs codification audit ([docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md](../../docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md)).

## §1 The discipline

For parallel sub-wave / batch execution under the orchestrator pattern, **always use git worktrees**. Never run parallel Sonnet (or any parallel AI) sessions in the shared working directory.

**Mandatory worktree setup as first step in every Mode-B parallel batch prompt:**

```bash
git worktree add ../<repo>-wave-<N> main
cd ../<repo>-wave-<N>
git checkout -b <wave>/<task>
```

The orchestrator prompt instructs each parallel Sonnet session to invoke worktree-add **before any other operation**. Branch checkout happens inside the worktree, eliminating the shared `.git/index` race.

## §2 Sequential fallback

If worktree-add fails (filesystem constraints, conflicting locks), the orchestrator falls back to **sequential execution** — not concurrent shared-dir execution. Sequential single-worktree completion of all parallel branches is the safe default.

Sequential fallback signature: each Sonnet session completes its commit + push before the next begins. Adds wall-clock time, removes contamination risk.

## §3 Anti-patterns

- **`#shared-workdir-parallel`** — multiple parallel AI sessions opening `~/code/<repo>/` directly. Even if each starts on a different branch, `git checkout -b` mid-session races on the shared `.git/index`. The first to write wins; the second may silently commit to the wrong branch.
- **`#branch-race-on-checkout`** — variant; orchestrator dispatches «Session A: checkout branch X / Session B: checkout branch Y» without worktree isolation. Sessions read each other's working-tree state, producing false-positive audit findings or stale-file regressions.
- **`#worktree-add-failure-ignored`** — Sonnet session encounters `git worktree add` failure, silently proceeds in shared dir. Counter: prompt MUST instruct «if worktree-add fails, STOP and report to orchestrator — do not proceed in shared dir».

## §4 Promotion / retirement

- **No own mechanical-detection build target — dropped (N7, 2026-05-22).** The earlier ambition — defer a principle test until post-Wave-10 AST-level orchestrator-prompt analysis could mechanically detect «two commits on different branches sharing a working-tree state» — is **dropped** under [build-first-reuse-default.md](build-first-reuse-default.md) (BFR verdict REFERENCE, not BUILD). Superpowers' [`using-git-worktrees`](https://github.com/obra/superpowers) skill already implements the preventive mechanism this rule describes; crucially its Step 0 detects an already-active worktree (`GIT_DIR != GIT_COMMON_DIR`, with a submodule guard) and **skips nested creation**, making it compatible with Claude Code `isolation:"worktree"` — verified against the shipped `using-git-worktrees/SKILL.md`, 2026-05-22 (dual-channel DeepWiki + raw WebFetch). REFERENCE it as mature upstream (SSOT #65), stacking alongside aif-handoff's Git-Isolation pattern (an unregistered REFERENCE precedent noted in the N7 roadmap vocabulary table — *not* SSOT #27, which is `HANDOFF_MODE`). The rule stays Class C prose: its job is to *mandate* worktree isolation in our orchestration; the *enforcement primitive* is dogfooded from upstream, not rebuilt.
- **Retirement:** if no shared-dir-parallel incident occurs for 12 consecutive months, archive to prose in CLAUDE.md `## Parallel work` section.

## §5 §1.7 self-reflexive note (N7 demotion, 2026-05-22)

- **Forward-check:** this demotion complies with [build-first-reuse-default.md §1](build-first-reuse-default.md) (REFERENCE over BUILD — drops a homegrown build target in favour of mature upstream), [no-paid-llm-in-ci.md](no-paid-llm-in-ci.md) (`using-git-worktrees` is pure-git — no headless `claude`, no API-billed call — verified against the shipped SKILL.md, evidence registered at [prior-art-evaluations.md row #65](../../docs/meta-factory/prior-art-evaluations.md)), [doc-authority-hierarchy.md](doc-authority-hierarchy.md) (Class + Authoritative-for header retained — see line 3 above). T16 problem-class match verified, not assumed: upstream's `.git/index`-race-avoidance == our incident-2026-05-12 problem class (this rule's §Origin).
- **Backward-check:** scope-reducing change — the only edited bullet is §4 above (the AST build-target *removed*, none added); the SSOT cross-reference lands at [prior-art-evaluations.md row #65](../../docs/meta-factory/prior-art-evaluations.md). No other artefact silently superseded. The global orchestrator skill's worktree section is *offered* a complementary REFERENCE note (N7 step 3) — but that edit is maintainer-applied (the agent's classifier blocks self-modification of `~/.claude/skills/`), so it is **not** a landed dependency of this rule.

## See also

- [.claude/rules/build-first-reuse-default.md](build-first-reuse-default.md) — REFERENCE-over-BUILD verdict driving the §4 demotion.
- [.claude/rules/reviewer-discipline.md](reviewer-discipline.md) — companion rule, parallel codification batch.
- [.claude/rules/phase-research-coverage.md §4 anti-patterns](phase-research-coverage.md) — focus-tunnel family context.
- [docs/meta-factory/prior-art-evaluations.md](../../docs/meta-factory/prior-art-evaluations.md) — SSOT #65 (`using-git-worktrees`), the referenced upstream worktree-isolation precedent.
- [docs/meta-factory/research-patches/2026-05-22-n7-dogfood-companions.md](../../docs/meta-factory/research-patches/2026-05-22-n7-dogfood-companions.md) — N7 adoption plan that drove this demotion.
- [docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md](../../docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md) — codification audit origin.
