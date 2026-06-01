<!-- scope:j5-orchestrator-prompts-hydration -->
# Research patch — `j5-orchestrator-prompts-hydration` BFR survey

> **Class:** R-phase deliverable (research-patch). No code changes; verdict + design only.
> **Authoritative for:** BFR §3 prior-art survey + falsifier outcome + BUILD verdict for the orchestrator-prompts hydration step in `.claude/hooks/worktree-setup.sh` + `scripts/create-worktree.sh`. Documents the J5 gap (fresh worktree is blind to gitignored kickoff content), deferred alternative (git-tracking), and re-evaluation trigger.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).

---

## §1 Problem statement (re-verified — T3: file:line evidence)

`.gitignore:7-14` (re-verified 2026-05-31):

```gitignore
.claude/orchestrator-prompts/*
!.claude/orchestrator-prompts/README.md
!.claude/orchestrator-prompts/*/
.claude/orchestrator-prompts/*/*
!.claude/orchestrator-prompts/*/done.md
```

Effect: umbrella skeleton dirs + `README.md` + `*/done.md` are tracked (for `priority-score.sh` Layer C3 completion-detection); all other content — including `*/kickoff.md` and any in-flight state files — is gitignored.

**Consequence (J5 gap):** A fresh worktree created by `git worktree add` checks out HEAD, which contains only the tracked skeleton. `find .claude/orchestrator-prompts -name kickoff.md` in the fresh worktree returns 0 results (live-verified: worktree `j5-hydration` = 0 kickoff files; primary checkout = 30+ kickoff/state files).

Command evidence (run in worktree j5-hydration):

```text
find /Users/art/code/rules-as-tests-aif/.claude/worktrees/j5-hydration/.claude/orchestrator-prompts -name "kickoff.md" | wc -l
→ 0
```

Command evidence (run against primary checkout):

```text
find /Users/art/code/rules-as-tests-aif/.claude/orchestrator-prompts -name "kickoff.md" | wc -l
→ 30+ files
```

Named-umbrella dispatch (`/meta-orchestrator <umbrella>`) in a fresh worktree is therefore **blind** — it cannot read the kickoff for the current umbrella, producing silent incorrect behaviour (no error, just empty context).

**Scope of this fix:** the CC-native path (`claude -w <name>` → WorktreeCreate hook) and its portable twin (`scripts/create-worktree.sh`). The Superset layer-1 config fix is personal/out-of-scope per kickoff §0 (already applied separately). The Superset substrate is REJECTED (SSOT #86, `research-patches/2026-05-30-superset-adopt-survey.md`).

---

## §2 BFR verdict — seven-verdict taxonomy + §3 6-layer search

### 2.1 Upstream candidates surveyed (≥3 phrasings, T11/T12 compliance)

**Search 1:** "git worktree create hook hydrate gitignored files into new worktree automatically"
→ Surfaced: `.worktreeinclude` (Claude Code built-in + `satococoa/git-worktreeinclude` CLI), `copy-env` (therohitdas), `coderabbitai/git-worktree-runner`, Worktrunk `wt hook`.

**Search 2:** "rsync gitignored files into git worktree on creation portable bash tool 2026"
→ Surfaced: `git-worktree-runner` (coderabbitai) with `gtr.copy.include` config, `rsync-gitignore` wrapper. No exact match for "hydrate named orchestrator-prompt dirs on worktree-create" as a standalone tool.

**Search 3:** "git worktree populate gitignored orchestrator prompts kickoff files fresh worktree automation"
→ Surfaced: `git-worktreeinclude` CLI (satococoa, ~50 stars), Claude Code's `.worktreeinclude` file feature, Superpowers issue #521 requesting `.worktreeinclude` copy support. No tool targeting specifically named project-scratch dirs.

**DeepWiki probe 1 — `obra/superpowers`:** "Does the using-git-worktrees skill copy or hydrate gitignored files from the primary checkout into newly created worktrees?"
→ Result: "The skill does not explicitly copy or hydrate gitignored files or untracked content from the primary checkout into newly created worktrees. The skill primarily focuses on creating an isolated Git worktree and then performing project setup and baseline testing." SSOT #65 (REFERENCE) confirmed as non-overlapping.

**DeepWiki probe 2 — `coderabbitai/git-worktree-runner`:** "Does this tool copy gitignored files (like kickoff.md or orchestrator prompt files) into new worktrees?"
→ Result: can copy gitignored files IF explicitly configured via `gtr.copy.include` globs. This is a general-purpose file-copy mechanism, not semantics-aware of "orchestrator-prompt kickoffs". Problem class mismatch: the upstream targets any files configured by the user; our need is a single project-internal hardcoded path (`$PROJECT_DIR/.claude/orchestrator-prompts/` → `$WORKTREE_DIR/.claude/orchestrator-prompts/`). Upstream runtime coupling: requires `git gtr new` command replacing our existing hook + script pair.

### 2.2 Adjacent precedents (SSOT / REFERENCE)

| Precedent | SSOT | Verdict | Relevance |
|---|---|---|---|
| CC `WorktreeCreate` hook API | #20 | ADOPT | Channel; already in use |
| Superpowers `using-git-worktrees` | #65 | REFERENCE | Creates worktrees; does NOT hydrate gitignored content (DeepWiki confirmed) |
| Superset layer-1 config (personal) | #86 REJECT | REFERENCE only | Different problem class — Superset's own worktree mechanism; does not fire CC WorktreeCreate hook; not shipped substrate |
| `git-worktreeinclude` / CC `.worktreeinclude` | (new) | REJECT | Targets generic gitignored files configured by user; our problem is one hardcoded project-internal path; adding `.worktreeinclude` would ship a per-consumer config file and require the consumer to configure it — more complex than ~5 LOC inline |
| `coderabbitai/git-worktree-runner` | (new) | REJECT | General-purpose tool requiring config and command replacement; would replace our existing hook+script pair rather than extend it; over-engineered for ~5 LOC inline rsync |

### 2.3 Problem-class analysis (T16 compliance)

**Upstream problem class (`.worktreeinclude` / `copy-env` / `git-worktree-runner`):** copy user-configured gitignored files (typically secrets/env files) across worktrees; consumer specifies what to copy.

**Our problem class:** project-internal, single source + destination path, no consumer config needed; the worktree hook already knows `$PROJECT_DIR` and `$WORKTREE_DIR`; the content is `.claude/orchestrator-prompts/` (project-specific scratch, not secrets). The fix is ~5 LOC `rsync --ignore-existing` inside an already-owned hook — no new dependency, no new config file, no new command.

**Match?** NO. T16: "Upstream problem class ≠ our problem class". Adoption of any upstream would add complexity (config file, new command, new dependency) without benefit — the fix is simpler than any integration.

### 2.4 Verdict: BUILD

**Justification:** No production-grade upstream candidate addresses this specific problem class (hydrate a single hardcoded project-internal gitignored directory path on worktree-create, inside an already-owned hook). The two closest candidates (`.worktreeinclude` + `git-worktree-runner`) are REJECT on problem-class mismatch. The implementation is ~5 LOC inside an existing artefact — well below the 50/80-LOC capability-commit thresholds in CLAUDE.md.

**Falsifier:** if a future tool ships that (a) is invoked automatically on `git worktree add` / `claude -w`, (b) requires zero configuration for a single hardcoded source→destination path, and (c) is already used by this project — then the hydration step should migrate to ADOPT. Condition: all three must hold simultaneously.

**Prior-art trailer:** `Prior-art: skipped — substrate-hygiene hook step, no new capability (rsync step inside existing hook/script pair; ~5 LOC; BUILD verdict per this patch §2.4 confirms no production-grade upstream for this specific problem class)`

---

## §3 Design — read-only hydration (non-destructive)

On successful worktree creation, after node_modules symlinks and before printing the path:

```bash
# Hydrate gitignored orchestrator-prompts from the primary checkout so a fresh
# worktree is not blind to umbrella kickoffs (J5 fix). Non-destructive:
# --ignore-existing preserves tracked README.md/done.md; only untracked
# (gitignored) kickoff content is added. Source = PROJECT_DIR (primary checkout).
SRC_OP="$PROJECT_DIR/.claude/orchestrator-prompts"
DST_OP="$WORKTREE_DIR/.claude/orchestrator-prompts"
if [[ -d "$SRC_OP" ]] && [[ "$SRC_OP" != "$DST_OP" ]] && command -v rsync >/dev/null 2>&1; then
  mkdir -p "$DST_OP"
  rsync -a --ignore-existing "$SRC_OP/" "$DST_OP/" >/dev/null 2>&1 || true
fi
```

**Properties:**
- `--ignore-existing`: never clobbers files already present in the worktree (tracked `README.md`, `done.md` are safe).
- `|| true`: rsync failure is silent — hydration is a convenience, worktree still creates. Never `exit 1`.
- `[[ "$SRC_OP" != "$DST_OP" ]]`: guard against the edge case where PROJECT_DIR == WORKTREE_DIR (e.g., re-running against the primary checkout itself).
- Same block in both `worktree-setup.sh` AND `scripts/create-worktree.sh` per `dual-implementation-discipline.md §5-§7` (both carry `@dual-pair: worktree-create-setup`).

### 3.1 Deferred alternative: git-tracking of kickoffs (maintainer-owned)

The D2/D3 pattern from the meta-orch-mode-triage decision register (committed stubs + override escape hatch) would track kickoffs in git as a variant. **NOT built now.** This is the maintainer-owned decision per kickoff §0 and CLAUDE.md «PR strategy».

**Re-evaluation trigger:** fires if the maintainer starts authoring umbrellas *inside* worktrees (not the primary checkout) and needs kickoff content shared bidirectionally (edit in worktree → visible in primary). Current flow: orchestrator dispatches into primary checkout → kickoffs live there → worktrees are fresh Workers. YAGNI until that flow changes.

---

## §4 §1.7 self-reflexive check (forward + backward)

### Forward (does this patch comply with project rules?)

| Rule | Compliance |
|---|---|
| `no-paid-llm-in-ci.md` | ✅ — mechanism is deterministic bash (`rsync --ignore-existing`), zero paid API calls |
| `dual-implementation-discipline.md §5-§7` | ✅ — both `worktree-setup.sh` and `scripts/create-worktree.sh` get the step; same semantics; both carry `@dual-pair: worktree-create-setup` |
| `doc-authority-hierarchy.md §2-§3` | ✅ — this patch carries a Class header and Authoritative-for block |
| `build-first-reuse-default.md §3` | ✅ — 6-layer search completed; 3 web searches + 2 DeepWiki probes + SSOT consult; BUILD verdict is documented with falsifier |
| `ai-laziness-traps.md` T11/T12 | ✅ — BFR search run before verdict, not from training-data assumption |
| `phase-research-coverage.md §1.7` | ✅ — this self-check is the forward/backward verification |

### Backward (does any existing artefact already do this?)

- `inject-matching-rule.sh`: PostToolUse hook that injects rule text on Edit/Write; does NOT copy files into worktrees.
- `.claude/hooks/worktree-setup.sh` itself: creates worktree + symlinks node_modules; does NOT hydrate orchestrator-prompts (the gap this patch fixes).
- `scripts/create-worktree.sh`: portable twin; same gap.
- No other artefact performs the `SRC_OP → DST_OP` rsync.

**No existing artefact already does this. No silent supersession.**
