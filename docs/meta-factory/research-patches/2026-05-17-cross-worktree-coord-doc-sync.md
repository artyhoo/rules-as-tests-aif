<!-- scope:cross-worktree-coordination-doc-sync -->

# Research-patch: Cross-worktree gitignored coordination-doc sync

> Scope: standalone R-phase deliverable. Folder-level authority inherited from
> [research-patches/](./) per [doc-authority-hierarchy.md §5](../../../.claude/rules/doc-authority-hierarchy.md).
> Verdict framework: [build-first-reuse-default.md §2](../../../.claude/rules/build-first-reuse-default.md) seven-verdict typology.
> **Not implementation.** Research + per-candidate verdict + recommendation + ≤30 LOC sketch only.

**Date executed:** 2026-05-20 (kickoff commissioned 2026-05-17; filename retains kickoff-specified date — see REPORT DECISIONS).
**Branch:** `research/cross-worktree-coord-sync-2026-05-17`
**Kickoff:** `.claude/orchestrator-prompts/cross-worktree-sync-research/kickoff.md` (gitignored).

---

## §1 Problem restatement

`.claude/orchestrator-prompts/**` is gitignored by design (`.gitignore:2` — `.claude/orchestrator-prompts/*` with a single tracked exception `!README.md` at `.gitignore:3`). The directory holds per-phase orchestrator scratch and the live scheduling SSOT (e.g. `post-1a-coordination/kickoff.md §3.6`, the authoritative session-ordering tracker). Gitignoring is correct for the single-worktree case: one disk copy = one source of truth.

The project's actual workflow is **multi-worktree** — parallel Opus/Sonnet sessions each run in their own `git worktree` (mandated by [parallel-subwave-isolation.md §1](../../../.claude/rules/parallel-subwave-isolation.md) to prevent the `.git/index` race that contaminated Wave 8.1/8.1b). Four worktrees were live at investigation time:

```text
/Users/art/code/rules-as-tests-aif               feat/principle-tests-12-13
/Users/art/code/rules-as-tests-aif-closure-audit main
/Users/art/code/rules-as-tests-aif-d2-design     docs/dual-implementation-discipline-2026-05-17
/Users/art/code/rules-as-tests-aif-orch-skill    feat/orch-skill-refactor-2026-05-17
```

Because the coordination docs are gitignored, **git never propagates them** — each worktree carries its own physical copy. An SSOT-significant edit (e.g. removing a completed Item from `post-1a-coordination/kickoff.md §3.6` after a PR merges) lands in **one** worktree only; the other three retain stale state. A parallel session reading its local copy sees a project state that contradicts reality.

**Concrete instance (2026-05-17).** After PR #71 (end-of-turn reminder hook) merged, Item 0 was struck from the coordination kickoff in one worktree; the other three still listed it as pending. This is not a one-off — it is the structural consequence of `gitignored × multi-worktree`, and recurs on every coordination edit.

**Live self-demonstration (observed this session).** The freshly-created worktree for *this very R-phase* contained only the tracked `README.md` under `.claude/orchestrator-prompts/`; every gitignored phase subdirectory — **including this R-phase's own kickoff** — was absent (`git check-ignore` confirms the kickoff is ignored; `ls` in the fresh worktree returned only `README.md`). The problem reproduced itself the moment the research into it began.

**Problem class (precise).** *Live, ongoing synchronisation of a mutable, human/AI-edited gitignored SSOT directory across N local worktrees of one repository* — where an edit made at any time in any worktree must become visible in all others. This is **distinct** from the adjacent and more commonly-tooled problem of *creation-time bootstrap* (copy `.env`/config into a newly-created worktree once). The distinction is load-bearing for every verdict below.

---

## §2 Search-coverage execution (phase-research-coverage.md §1)

### §2.1 SSOT consult — `prior-art-evaluations.md` (47 entries)

`grep -niE "worktree|sync|coordination|orchestrat"` → **no entry matches the problem class.** Closest neighbours, all rejected on problem-class grounds:

- **#27 / #28 / #44** (AIF-Handoff `HANDOFF_MODE`, `paused:true`, `@aif/mcp` bidirectional status sync) — vocabulary overlap ("sync", "coordination") but problem class = *DB-backed task-state sync for an autonomous kanban pipeline*, not *file-doc sync across local worktrees*. #44 explicitly requires standing up Docker + DB; T16 problem-class mismatch already recorded in the SSOT for #44.
- **#29** (`<!-- scope:§N -->` annotation for trigger sweeps) — machine-linking of patches, not sync. (This patch uses that very annotation in its first line — adoption, not overlap.)
- **#46** (Subagents/Skills execution dichotomy) — execution-mode vocabulary, unrelated.

**Verdict:** capability area is **new to the SSOT.** A new entry (#48) is warranted; drafted in §9 ATTN for maintainer landing (not auto-added — append-only register is maintainer/capability-author territory and this is research, not a capability commit).

### §2.2 DeepWiki `ask_question` — 3 phrasings, 3 angles

1. **git/git** — "which `.git` files are shared vs per-worktree; does git share *untracked* files across worktrees?" → **`$GIT_COMMON_DIR`** (objects, refs, `config`) is shared; **`$GIT_DIR`** (`HEAD`, `index`, `config.worktree`) is per-worktree. `extensions.worktreeConfig` shares only *tracked* config, not scratch. **Verbatim:** *"There is no built-in Git mechanism for sharing untracked (gitignored) files across worktrees… you would need to: (1) symlink from each worktree to a shared location, (2) reference a shared dir via env/scripts, (3) store outside the repository."* Verified locally: in the coord-sync worktree, `GIT_DIR=…/.git/worktrees/rules-as-tests-aif-coord-sync`, `GIT_COMMON_DIR=…/.git`. ([deepwiki](https://deepwiki.com/search/how-does-git-share-state-acros_2a630326-65b9-47aa-b831-dbd8b051ca8a))
2. **obra/superpowers** — "any skill for synchronising shared state / scratch files across parallel worktrees or sessions?" → **No.** `using-git-worktrees` is for *isolation* (detects existing worktree via `GIT_DIR != GIT_COMMON`); `dispatching-parallel-agents` *explicitly advises against* use when agents share state. *"Shared state, coordination documents, or git-ignored scratch files are not explicitly synchronized across parallel sessions by Superpowers itself."* Clean negative-existence on the companion-tool angle. ([deepwiki](https://deepwiki.com/search/does-superpowers-provide-any-s_872d6878-4e46-425f-b004-05c63df10b6f))
3. **ThePrimeagen/git-worktree.nvim** — "mechanism to copy/sync gitignored files between worktrees?" → DeepWiki returned **no grounded context** (could not load codebase). WebSearch (§2.3) surfaced the repo's own issue [#92 "Copy over git ignored files between worktrees"](https://github.com/ThePrimeagen/git-worktree.nvim/issues/92) — an *open feature request*, i.e. not shipped. Recorded honestly as inconclusive-via-DeepWiki, resolved-via-issue-tracker.

### §2.3 WebSearch — 3 phrasings

1. `"share gitignored files across multiple git worktrees common directory symlink"` → symlink-script pattern, **hardlink** pattern (`cp -lfR`), and dedicated tool **`git-worktreeinclude`**.
2. `"git worktree manager tool sync shared env config files .worktreeinclude hardlink"` → **`coderabbitai/git-worktree-runner`** (bash manager + AI-tool integration; copies config on create; [issue #29](https://github.com/coderabbitai/git-worktree-runner/issues/29) proposes `gtr copy` for syncing between worktrees), **`thesunny/worktree-env-sync`** (CLI; env-file sync with template interpolation **+ symlink support**), **`worktrunk`** (`.worktreeinclude` concept; copies `.env` on create), **`satococoa/wtp`**.
3. `"multi-worktree AI agent orchestration shared coordination state single source of truth outside repo"` → multi-agent pattern literature converges on a **"living spec" / `TASKS.md` SSOT** read by all agents, with **Conductor** running multiple Claude Code/Codex agents each in its own worktree. Confirms the *pattern* (one canonical coordination artefact) but the surveyed write-ups keep that artefact *tracked at repo root*, sidestepping our gitignored constraint rather than solving it.

### §2.4 context7 — OMITTED

Per [build-first-reuse-default.md §3 footnote](../../../.claude/rules/build-first-reuse-default.md): context7 = library-API docs, not tool/pattern discovery. Substituting it here would be low-signal. Omission is correct, not a coverage gap.

### §2.5 Internal sweep — `grep -rniE "worktree"`

42 hits across the project; **zero** implement sync. All are either the discipline rule ([parallel-subwave-isolation.md](../../../.claude/rules/parallel-subwave-isolation.md)), SSOT prose, or research-patch references. The 5 existing hooks (`check-doc-authority`, `deps-hash-check`, `end-of-turn-reminder`, `inject-session-bootstrap`, `validate-prompt`) contain **no** symlink / canonical-copy / sync logic. We are at greenfield for this capability.

### §2.6 Adversarial counter-prompt (§1.4)

*"If a tool that live-syncs a gitignored coordination directory across worktrees existed, where would it live and what would it be called?"* → It would be a git-worktree manager with a "watch & mirror" or "shared-dir symlink" mode. The closest realisations are `worktree-env-sync` (symlink mode) and the [`worktree.linkFiles` proposal (Archon #1281)](https://github.com/coleam00/Archon/issues/1281) (*symlink* git-ignored dirs rather than copy). Both validate the **symlink-to-canonical** mechanism but neither targets an AI-orchestration coordination dir specifically, and both are env-file-centric. The counter-prompt surfaced reinforcement, not a drop-in. Negative-existence on *exact* match holds; positive-existence on *mechanism* (symlink-to-canonical) is strong.

---

## §3 Candidate solutions

| # | Candidate | Sync semantics | Source |
|---|---|---|---|
| (a) | Sync companion — file-watcher / git post-checkout hook that mirrors edits to all worktrees | eventual / on-event | own-build |
| (b) | **Canonical copy outside worktrees + symlink from each** | **live (same inode/path)** | `worktree-env-sync` symlink mode; `worktree.linkFiles` proposal |
| (c) | Aggregated live-view companion (reads all worktrees + git state → synthesises a state view) | read-only synthesis | own-build |
| (d) | Un-gitignore `.claude/orchestrator-prompts/**` | git-native | tradeoff analysis |
| (e) | Relocate coordination docs to global dir (`~/.claude-coordination/<project>/` or the memory dir) | global by construction | memory dir precedent |
| (f) | Copy-at-creation tool (`git-worktreeinclude` / `git-worktree-runner` / `worktrunk`) | snapshot at create | production tools |
| (g) | Hardlink shared dir (`cp -lfR`) into each worktree | live for existing files; **not** for new files | Arriana Blais article |
| (h) | Symlink the coordination dir into `$GIT_COMMON_DIR` (`.git/`) | live; auto-discovered by all worktrees | git internals (DeepWiki #1) |

Sources: [git-worktree docs](https://git-scm.com/docs/git-worktree) · [git-worktreeinclude](https://dev.to/satococoa/git-worktreeinclude-a-tiny-cli-for-safely-carrying-over-ignored-files-across-git-worktrees-5cdm) · [worktree-env-sync](https://github.com/thesunny/worktree-env-sync) · [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) · [worktrunk](https://xata.io/blog/my-git-worktree-setup-using-worktrunk-and-caddy) · [hardlinks (Arriana Blais)](https://arri.gay/articles/sharing-is-caring/) · [worktree.linkFiles proposal](https://github.com/coleam00/Archon/issues/1281) · [Superpowers #521](https://github.com/obra/superpowers/issues/521) · [Augment Code](https://www.augmentcode.com/guides/git-worktrees-parallel-ai-agent-execution) · [MindStudio](https://www.mindstudio.ai/blog/parallel-agentic-development-git-worktrees).

---

## §4 Per-candidate verdict (build-first-reuse-default.md §2)

Each verdict states **Upstream problem class → Our problem class → Match? evidence → Integration cost → Decision**. The T-coord-A counter (name-match ≠ problem-class match) is applied to every (b)/(f)/(g)/(h) candidate.

### (a) Sync companion (file-watcher / post-checkout hook) — **REJECT**
- Upstream class: continuous file mirroring (Syncthing/`fswatch`-class) — *N-way replication of independent copies*.
- Our class: *one* SSOT viewed from N mount points.
- Match? **No.** A watcher keeps N copies eventually-consistent; it introduces last-write-wins races (two worktrees edit `§3.6` within the debounce window → silent clobber — the exact `#two-prompts-drift` failure mode from [dual-implementation-discipline.md §8](../../../.claude/rules/dual-implementation-discipline.md), generalised to docs). It also needs a long-running daemon — fragile, and a background-service surface that [no-paid-llm-in-ci.md §6 `#policy-bypass-via-cron`](../../../.claude/rules/no-paid-llm-in-ci.md) treats with suspicion (here cost-free, but the standing-daemon shape is still the wrong default for a single maintainer).
- Integration cost: high (daemon lifecycle, conflict resolution, per-OS watcher quirks).
- Decision: **REJECT** — solves a harder problem (N-way merge) than we have (we want N→1, not N↔N).

### (b) Canonical copy outside worktrees + symlink — **ADAPT** ✅ (recommended core)
- Upstream class: *symlink gitignored env/config from a shared location into each worktree* (`worktree-env-sync` symlink mode; `worktree.linkFiles` proposal).
- Our class: *symlink a gitignored coordination-SSOT directory into each worktree.*
- Match? **Yes, on mechanism.** Both make one physical artefact appear in every worktree so an edit is instantly global — no copy, no daemon, no race. Evidence: DeepWiki git/git names symlink as the canonical answer; two independent production efforts implement exactly this for env files. Difference is only the *payload* (coordination docs vs `.env`) — same mechanism, no new problem.
- Why **ADAPT** not **ADOPT**: no surveyed tool symlinks a *coordination dir for an AI-orchestration project*; they are env-file-centric CLIs and adopting one wholesale drags in monorepo/template-interpolation surface we don't need. The adaptation is a ≤30 LOC worktree-init helper (§5) — small enough that vendoring a CLI is `#integration-overhead-overestimate` in reverse.
- Integration cost: low (one symlink per worktree at creation; one helper script).
- Decision: **ADAPT.**

### (c) Aggregated live-view companion — **KEEP NARROW / DEFER**
- Upstream class: "living spec" dashboards (Conductor) — *synthesise project state from many sources for human review*.
- Our class: keep N worktrees from disagreeing on the SSOT.
- Match? Partial — a read-only synthesiser shows drift but does not *prevent* it; writers still edit divergent copies.
- Decision: **KEEP NARROW** — useful as a future *observability* layer on top of (b), not a sync mechanism. Defer; out of scope for the drift fix.

### (d) Un-gitignore `.claude/orchestrator-prompts/**` — **REJECT**
- Match? It does make git propagate the docs — but trades cross-worktree drift for **branch-noise drift**: every branch carries every other branch's in-flight orchestrator scratch; coordination edits generate merge conflicts; `§3.6` state ping-pongs between branches. The original gitignore deliberately bought branch-isolation; reversing it just inverts the cost (per memory analysis, [gitignored-coordination-doc-drift] §"Why companions"). Also pollutes consumer installs if the dir is ever shipped.
- Decision: **REJECT** — symmetric-cost swap, not a fix.

### (e) Relocate to a global dir (`~/.claude-coordination/<project>/`) — **ADAPT (equivalent to (b))**
- Upstream class: the memory dir (`~/.claude/projects/.../memory/`) is *already global across worktrees by design* — that is precisely why the session-ordering memory stayed consistent during the PR #71 cleanup while the kickoff did not.
- Our class: same global-by-construction property for structured coordination docs.
- Match? **Yes** — but the memory dir itself is "too coarse to replace structured coordination docs" (per memory entry). A *sibling* global dir (`~/.claude-coordination/<project>/`) holding the real docs, with worktrees pointing at it, is **functionally identical to (b)** — (b) is just "(e) + the pointer is a symlink." Merge (e) into the (b) recommendation: the canonical location *is* a global outside-repo dir.
- Decision: **ADAPT**, folded into (b).

### (f) Copy-at-creation tools (`git-worktreeinclude`, `git-worktree-runner`, `worktrunk`) — **REFERENCE / partial ADOPT**
- Upstream class: **bootstrap a new worktree** — copy gitignored `.env`/config *once* at creation so the new tree builds.
- Our class: **live ongoing sync** of a mutable SSOT edited *after* creation.
- Match? **No — T-coord-A fires.** These are the highest name-match candidates ("worktree" + "gitignored files") and the clearest trap: they *copy*, producing an immediate snapshot that **diverges on the next edit** — i.e. they reproduce our exact drift one step later. Evidence: `git-worktreeinclude` "copies… files listed in `.worktreeinclude`"; `git-worktree-runner` "copy files from main repo to existing worktree(s)" — both copy semantics; the runner's own [issue #29](https://github.com/coderabbitai/git-worktree-runner/issues/29) requests a *separate* sync command because copy ≠ sync.
- Decision: **REFERENCE** for their `.worktreeinclude` *manifest* idea (a tidy way to declare which gitignored paths participate), and **partial ADOPT** for the orthogonal *creation-time* concern only. They do **not** solve the live-sync class.

### (g) Hardlink shared dir (`cp -lfR`) — **REJECT (for our class)**
- Upstream class: share *a fixed set of files* (env, secrets) live via shared inodes.
- Our class: a *growing* directory — new phase subdirs created continuously.
- Match? **Partial then broken.** Hardlinks make existing files live-shared, but a **newly created** file in one worktree is a fresh inode invisible to others (hardlinks bind files, not directory membership). Coordination dirs grow new subdirs constantly → the new-file blind spot is structural, not edge-case. Also breaks across filesystems.
- Decision: **REJECT** — symlinking the *directory* (b/h) shares membership too; hardlinking files does not.

### (h) Symlink coordination dir into `$GIT_COMMON_DIR` (`.git/`) — **ADAPT (variant of (b))**
- Upstream class: git's own shared-vs-per-worktree split — `$GIT_COMMON_DIR` is already shared across all worktrees (verified: resolves to the main `.git` from every worktree).
- Our class: a location every worktree already shares, with zero external dir to manage.
- Match? **Yes, mechanically** — store the canonical docs under `.git/orchestrator-coordination/` and symlink from each worktree; the shared `.git` guarantees one copy. **But** `.git/` is conventionally git-internal plumbing; putting human/AI-edited markdown there is surprising, harder to back up, and lost on `git gc`-adjacent tooling assumptions. Lower discoverability than an explicit `~/.claude-coordination/`.
- Decision: **ADAPT** — a legitimate variant of (b); list as the alternative canonical location in §9 for maintainer choice, not the default.

---

## §5 Recommendation

**Adopt (b), with the canonical store realised as a global outside-repo directory (folding in (e)).** One sentence: *make `.claude/orchestrator-prompts/`'s gitignored contents a symlink to a single canonical directory outside every worktree, so an edit in any worktree is the same file in all.*

Why this over BUILD-from-scratch (a)/(c): the mechanism is proven by two independent production tools (`worktree-env-sync`, `worktree.linkFiles` proposal) and named as the canonical answer by git itself; it needs **no daemon, no conflict resolution, no LLM** — the "sync" is a filesystem identity, not a process. It is the minimum mechanism that fully eliminates the drift class. (a) and (c) build more machinery to solve a harder problem we don't have.

**Integration wrinkle (must be honoured).** `.claude/orchestrator-prompts/README.md` is the *one tracked file* in the dir (`.gitignore:3` `!README.md`). Therefore **do not symlink the whole directory** — that would shadow the tracked README and confuse git. Symlink only the gitignored payload. Two clean options:
1. Symlink each gitignored *subdirectory* (`post-1a-coordination/`, etc.) individually to the canonical store; leave tracked `README.md` in place per worktree. (Robust; slightly more symlinks.)
2. Move coordination SSOT into one dedicated gitignored subdir (e.g. `.claude/orchestrator-prompts/_shared/`) and symlink just that. (One symlink; needs a small relocation.)

**Sketch — worktree-init helper (≤30 LOC, harness-agnostic bash, zero LLM):**

```bash
#!/usr/bin/env bash
# link-coordination.sh — run once per worktree after `git worktree add`.
# Symlinks gitignored orchestrator-coordination dirs to a single canonical store
# so coordination SSOT is shared (not copied) across all worktrees.
# @dual-pair: cross-worktree-coordination-doc-sync   # spec: this research-patch §5
set -euo pipefail

CANON="${CLAUDE_COORDINATION_DIR:-$HOME/.claude-coordination/rules-as-tests-aif}"
WT_PROMPTS="$(git rev-parse --show-toplevel)/.claude/orchestrator-prompts"

mkdir -p "$CANON"
mkdir -p "$WT_PROMPTS"

# For each gitignored subdir present in the canonical store, ensure a symlink in this worktree.
# (README.md stays a real tracked file; we never touch it.)
for dir in "$CANON"/*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"
  target="$WT_PROMPTS/$name"
  if [ -L "$target" ]; then continue; fi          # already linked
  if [ -e "$target" ]; then
    echo "CONFLICT: $target exists as real dir — migrate to $CANON/$name then re-run" >&2
    exit 1                                          # fail loud, never clobber (see [[no-git-reset-hard]] spirit)
  fi
  ln -s "$dir" "$target"
  echo "linked $name -> $dir"
done
```

This is **internal tooling** per [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) ("used exclusively inside the maintainer's own development environment, not shipped to consumer projects") → CC-native-only default applies, and in fact the helper is *plain bash* (harness-agnostic), so no `@cc-only-rationale` is even owed. The `@dual-pair` marker is shown for the case where a CC `post-worktree` hook is later added as a second channel; today the script alone suffices.

**Migration of the canonical store:** one-time `cp -R` of the most-current worktree's coordination dirs into `$CANON`, then run the helper in each existing worktree. "Most-current" is a maintainer judgement (which worktree holds the freshest `§3.6`) — surfaced as ATTN, not auto-decided (this is exactly the "which worktree is canonical?" ambiguity the memory entry flagged).

---

## §6 §1.7 Forward-check (recommendation complies with existing disciplines)

Per [phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md). Each line: discipline → compliance → file:line.

- **build-first-reuse-default** — the recommendation resolves via the 7-verdict typology and lands ADAPT (not reflexive BUILD); §3 mechanism (DeepWiki ≥3, WebSearch ≥3, SSOT consult, internal sweep) executed before any "I propose". Complies. ([build-first-reuse-default.md §2 table](../../../.claude/rules/build-first-reuse-default.md) lines 21-30; §3 mechanism lines 48-58.)
- **parallel-subwave-isolation** — the recommendation shares *only gitignored scratch*; it never touches `.git/index`, `HEAD`, or tracked files, so branch-isolation (the property the rule protects) is untouched. It is additive to the worktree workflow, not in tension. ([parallel-subwave-isolation.md §1](../../../.claude/rules/parallel-subwave-isolation.md) lines 21-37, the worktree-add-first mandate the helper runs *after*.)
- **no-paid-llm-in-ci** — mechanism is a symlink + ≤30 LOC deterministic bash; zero API calls, no CI surface, no daemon. Complies. ([no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md) lines 19-19; §5 step 1 "does this require an API key?" → no, lines ~73.)
- **dual-implementation-discipline** — helper classified internal-only → CC-native-only default honoured; harness-agnostic bash needs no `@cc-only-rationale`; `@dual-pair` anchor pre-declared for a future second channel. Complies. ([dual-implementation-discipline.md §3 "Internal tooling — default: CC-native only"](../../../.claude/rules/dual-implementation-discipline.md); §6 marker convention.)
- **doc-authority-hierarchy** — this patch inherits folder-level authority from `research-patches/` (no per-file header required) and carries the scope blockquote anyway. Complies. ([doc-authority-hierarchy.md §5](../../../.claude/rules/doc-authority-hierarchy.md).)
- **CLAUDE.md capability-commit gate** — implementing the helper later would be a capability commit (new file under `packages/`? no — under `.claude/`, <50 LOC) → likely *not* a capability commit by the LOC/dir thresholds, but a `Prior-art:` trailer citing this patch + SSOT #48 should accompany it regardless. (CLAUDE.md "What is a capability commit".)

---

## §7 §1.7 Backward-check (new approach swept against all existing in-scope artefacts)

Scope of the recommendation = gitignored content under `.claude/orchestrator-prompts/**` (`.gitignore:2`). Complete sweep, not the 3-5 floor:

- **4 live worktrees** (enumerated §1) each hold an independent copy → all 4 require migration to symlink at adoption. This is the complete population (verified via `git worktree list`); none is exempt.
- **Tracked exception:** `.claude/orchestrator-prompts/README.md` (`git ls-files` returns exactly this one path). The recommendation explicitly carves it out (§5 wrinkle) — it stays a real per-worktree tracked file. Exemption is intentional and documented (satisfies §1.7 "exemption mechanism explicit").
- **Existing hooks** (5 under `.claude/hooks/`): swept — none perform sync, none conflict with the helper; the helper is a new standalone script, not a modification. No regression surface.
- **Adjacent gitignored scratch:** `drafts/` subdirs inside orchestrator-prompts (e.g. companion-integration-analysis `drafts/`) fall under the same gitignore and would ride along on the symlink — *desirable* (they are coordination scratch too), no special handling.
- **research-patches/ (this file's home):** tracked, not in scope — propagates via git normally (see §8).

No in-scope artefact is missed; the one exemption (README.md) is explicit and intent-preserving.

---

## §8 Self-application (T15)

**Is this research-patch subject to the very problem it studies?** **No** — `docs/meta-factory/research-patches/` is *tracked* (`git check-ignore` returns non-ignored). This deliverable propagates across worktrees through normal git merge, immune to the gitignored-drift class. The fix's home is correctly outside the problem's blast radius.

**Does the problem apply to the research-patches workflow?** No — tracked docs sync via git by construction. The drift is exclusive to *gitignored* coordination scratch.

**Recursive observation (the sharp one):** the **kickoff that commissioned this R-phase is itself gitignored** (`git check-ignore` confirms) and was therefore *absent from the fresh worktree created to do the work* — I read it from the originating working directory. The investigation could not even bootstrap inside its own isolated worktree without crossing the very boundary under study. This is the strongest possible self-application evidence: the problem is not hypothetical, it obstructs work on itself. It also implies a **process note** — R-phase kickoffs, being coordination scratch, are first-class members of the population the recommendation must cover; once (b) is adopted, kickoffs sync automatically and a fresh worktree *would* see its own kickoff.

---

## §9 ATTN / open questions (maintainer decision)

1. **Canonical location choice** — default recommendation: `~/.claude-coordination/rules-as-tests-aif/` (explicit, backup-friendly). Alternative: `$GIT_COMMON_DIR/orchestrator-coordination/` (candidate (h) — zero external dir, but markdown-in-`.git` is unconventional). Maintainer picks; both are mechanically sound.
2. **Symlink granularity** — per-subdir symlinks (no relocation, more links) vs. one `_shared/` subdir (one link, needs moving existing dirs). §5 options 1 vs 2.
3. **Which worktree is canonical at migration?** The one-time seed of `$CANON` must pick the freshest copy of `§3.6` et al. — the "which worktree is canonical?" ambiguity the memory entry named. Needs a human glance, not an automated guess.
4. **SSOT entry #48** — capability area is new to `prior-art-evaluations.md`. Proposed entry: *"Cross-worktree gitignored-SSOT live sync via symlink-to-canonical (ADAPT — `worktree-env-sync` symlink mode + `worktree.linkFiles` proposal; copy-at-creation tools REFERENCE'd, T-coord-A documented)."* Append-only register is maintainer/capability-author territory → not auto-added here; land it with the implementation commit.
5. **Coordination with companion-integration-analysis R-phase** — that R-phase compares companion *tools* (AIF/Superpowers/etc.) and may independently surface a worktree-sync capability in its matrix. Confirmed **non-overlapping scope** (it does capability comparison, not sync-mechanism design), so this work is standalone — but its §4.4 verdicts should *reference* this patch rather than re-design, to avoid `#parallel-evolution-creep`. Flag for the orchestrator.
6. **`.worktreeinclude` manifest (REFERENCE from (f))** — optional polish: a declarative manifest listing which gitignored paths participate in the symlink, instead of "all subdirs." Defer unless the dir grows non-coordination scratch that should *not* be shared.

---

## §10 AI-laziness traps applied (ai-laziness-traps.md §3)

See [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md). Active for this R-phase: **T1, T3, T7, T11, T12, T13, T15, T16** + domain-specific **T-coord-A**.

- **T1** (3-clean = done) — did not stop at git/git's "no built-in mechanism"; pushed to enumerate 8 candidates across copy/symlink/hardlink/relocate semantics.
- **T3** (plausible-without-verification) — every structural claim carries a command + output: `git worktree list`, `git ls-files`, `git check-ignore`, `git rev-parse --git-common-dir`, `grep` counts. No prose-only findings.
- **T7** (follow prompt literally) — ran the §1.4 adversarial counter-prompt (§2.6) and a real standalone-vs-merge scope check (§9.5), rather than ticking the "checked overlap" box.
- **T11/T12** (design / sweep skip) — DeepWiki ≥3 + WebSearch ≥3 executed *at proposal time*, not from training memory; surfaced `worktree-env-sync`, `git-worktree-runner`, `worktrunk`, `worktree.linkFiles` which I did not know a priori.
- **T13** (ADOPTED = zero work) — for the symlink-mechanism "adoption" I verified the upstream evidence (git's own answer + 2 production tools) rather than trusting the pattern's reputation.
- **T15** (self-application) — §8; found the kickoff-is-gitignored recursion.
- **T16 / T-coord-A** (pattern-match-on-name) — the load-bearing trap here. The highest name-match tools (`git-worktreeinclude`, `git-worktree-runner` — literally "worktree" + "ignored files") solve **copy-at-creation**, the *wrong problem class*; each (b)/(f)/(g)/(h) verdict carries an explicit "Upstream class → Our class → Match? evidence" line. Our problem is "live SSOT sync," not "many worktrees" or "bootstrap a new tree."

---

## §11 See also

- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — verdict typology + §3 mechanism.
- [.claude/rules/parallel-subwave-isolation.md](../../../.claude/rules/parallel-subwave-isolation.md) — origin of the multi-worktree workflow.
- [.claude/rules/dual-implementation-discipline.md](../../../.claude/rules/dual-implementation-discipline.md) — channel/marker conventions the helper follows.
- [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — deterministic-only constraint.
- `prior-art-evaluations.md` #27/#28/#44 — AIF-Handoff sync entries (different problem class; near-neighbours rejected §2.1).
- External: [git-worktree docs](https://git-scm.com/docs/git-worktree) · [worktree-env-sync](https://github.com/thesunny/worktree-env-sync) · [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) · [worktree.linkFiles proposal](https://github.com/coleam00/Archon/issues/1281) · [hardlinks article](https://arri.gay/articles/sharing-is-caring/) · [Superpowers #521](https://github.com/obra/superpowers/issues/521).
