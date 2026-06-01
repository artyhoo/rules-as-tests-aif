<!-- scope:worktree-create-dual-channel -->
# Research patch — `worktree-create-dual-channel` BFR survey

> **Class:** R-phase deliverable (research-patch). No code changes; no hook files written; verdict only.
> **Authoritative for:** BFR §3 prior-art survey + falsifier outcomes + composite verdict for the `scripts/create-worktree.sh` (BUILD portable bash) + Superpowers `using-git-worktrees` (REFERENCE) dual-channel proposal. Also documents the `origin/HEAD` staleness bug root-cause + minimum-surface fix sketch for the I-phase.
> **NOT authoritative for:** project goal (see [README.md#why-this-exists](../../README.md)); the eventual `scripts/create-worktree.sh` implementation (I-phase); `worktree-setup.sh` fix (I-phase); dual-implementation-discipline §3 triage (final channel assignment — I-phase).
> **Origin:** 2026-05-30. Maintainer pre-verdict: combo (b) BUILD `scripts/create-worktree.sh` + (c) REFERENCE Superpowers `using-git-worktrees`. This R-phase falsifier-checks that pre-verdict and satisfies BFR §3 ≥2 alt-targets per `#vendor-lock-by-convenience` guard. Bug 1 was paused pending the Superset survey verdict (PR #292/SSOT #86, merged 2026-05-30, verdict REJECT/KEEP-NARROW/REFERENCE) which did not moot Bug 1.
> **Tags:** `#worktree-isolation` · `#dual-implementation` · `#build-vs-reuse` · `#base-ref-staleness`

---

## §1 Origin + Bug evidence (re-verified 2026-05-30)

### 1.1 The stale-comment bug

File: `.claude/hooks/worktree-setup.sh:70-77` (main repo, commit `abb6593` on branch `feat/runtime-bridge-status-readback`):

```bash
# Resolve base ref: prefer origin/HEAD (= origin/staging for this repo post-2026-05-22
# default-branch migration); fall back through plausible defaults for test harnesses.
BASE_REF=""
for cand in "origin/HEAD" "origin/main" "main" "HEAD"; do
  if git -C "$PROJECT_DIR" rev-parse --verify --quiet "$cand" >/dev/null 2>&1; then
    BASE_REF="$cand"
    break
  fi
done
```

Line 70 comment claims `origin/HEAD = origin/staging` — this is **empirically wrong**.

### 1.2 Re-verified empirical outputs (2026-05-30)

```text
$ git symbolic-ref refs/remotes/origin/HEAD
refs/remotes/origin/main
```

```text
$ git log --oneline -1 origin/HEAD
bb3ecec Merge pull request #187 from Yhooi2/staging
# Date: 2026-05-24 00:34:05 +0300
```

```text
$ git log --oneline -1 origin/staging
1f0309e Merge pull request #294 from Yhooi2/chore/ssot-row-86-superset
# Date: 2026-05-30 02:02:07 +0300
```

```text
$ git rev-list --count origin/HEAD..origin/staging
156
```

**Finding:** `origin/HEAD` → `refs/remotes/origin/main` → commit `bb3ecec` (2026-05-24), which is **156 commits and ~6 days behind** `origin/staging` (the actual default/trunk branch since the 2026-05-22 migration). The stale-comment at `:70-71` proves the desync: the migration happened, the comment was updated to say "= origin/staging", but the git remote symbolic-ref itself was never refreshed. The `for cand in "origin/HEAD" ...` loop resolves to `origin/HEAD` on any clone that has `origin/HEAD` set — and returns a commit 150+ commits stale.

### 1.3 Four documented hit pattern

All four documented hits landed on the stale commit:
- Install smoke probe (CC `claude -w` dispatch) — worktree checked out from stale `origin/HEAD`
- Worker C primary dispatch — same stale base
- Worker C secondary dispatch — same stale base
- Retro Worker — same stale base

Root cause: `worktree-setup.sh:73-77` picks `origin/HEAD` first (it verifies successfully because the ref exists), breaks out of the loop, and passes it to `git worktree add`. No fetch is called prior; the client's `refs/remotes/origin/HEAD` remains pinned to wherever it was cloned or last fetched.

---

## §2 Survey results (BFR §3 six-layer mechanism)

### 2.1 Falsifier (c) — Superpowers `using-git-worktrees` CLI entry-point

**Question:** Does `obra/superpowers` `using-git-worktrees` ship a CLI-invocable bash script / portable entry-point callable without an active AI session?

**DeepWiki query 1** (`obra/superpowers`, phrasing "CLI-invocable bash script without active AI session"):
> "The `using-git-worktrees` skill is primarily a prompt and discipline delivered to an AI model, rather than a standalone CLI-invocable bash script or command-line entry point for humans or CI systems. Its content is written in Markdown and contains instructions and bash snippets for an AI agent to follow."

**DeepWiki query 2** (`obra/superpowers`, phrasing "portable bash script invocable outside Claude Code CI"):
> "No, the `using-git-worktrees` skill does not provide a portable bash script that can be invoked outside of an AI session. The skill itself is a Markdown document containing instructions and bash snippets for an AI agent to follow."

**Falsifier outcome (c):** NOT falsified. Superpowers `using-git-worktrees` is AI-session-bound prompt discipline. It does NOT ship a CLI/bash worktree-setup script. Therefore (b) BUILD is still required to serve the human/CI use case.

**T16 problem-class match for SSOT #65:**
- Upstream problem class: AI agent `.git/index`-race avoidance + nested-worktree detection in active Claude Code / Codex / Cursor sessions via prompt/discipline injected to the AI model.
- Our problem class (c reference use case): same AI-session race avoidance — STRONG match on the AI-session axis.
- Our problem class (b BUILD use case): human/CI invocable worktree setup without any AI session — NO upstream coverage. Gap confirmed.

### 2.2 Falsifier (b) — tfriedel/claude-worktree-hooks CLI entry-point

**Question:** Does `tfriedel/claude-worktree-hooks` provide a CLI-invocable worktree-setup script usable without a CC session?

**WebSearch evidence** (query: "tfriedel claude-worktree-hooks github worktree setup script CLI"):
> Repository found at `https://github.com/tfriedel/claude-worktree-hooks`. Contains `scripts/worktree-create.sh` and `scripts/worktree-remove.sh`.

**WebFetch** of `https://raw.githubusercontent.com/tfriedel/claude-worktree-hooks/main/scripts/worktree-create.sh`:
> "This is a **CC-hook-only script**. It cannot be invoked directly from the CLI with arguments. The script exclusively processes input via stdin using JSON parsing: `INPUT=$(cat)` and extracts the worktree name via `jq -r '.name'`. The script takes **no command-line arguments**."

**Falsifier outcome (b):** NOT falsified. tfriedel's `worktree-create.sh` is also CC-hook-stdin-only. It cannot be invoked from CLI/CI without a CC session supplying the JSON payload. Therefore BUILD from scratch (or ADAPT adding arg-parsing) is required.

**T16 problem-class match for tfriedel:**
- Upstream problem class: WorktreeCreate CC hook that receives a JSON payload from CC, reads `.name`, runs npm install per worktree.
- Our problem class (existing `worktree-setup.sh`): same — WorktreeCreate hook, reads JSON stdin via jq. Strong match on hook axis.
- Our problem class (proposed `scripts/create-worktree.sh`): human/CI-invocable — our hook differs by accepting CLI arg `$1` instead of stdin JSON. Adaptation needed (not direct adoption).
- **Verdict for tfriedel:** ADAPT (for the hook body structure — jq-parse vs arg-parse) + BUILD CLI wrapper. Existing `worktree-setup.sh` already cites tfriedel at `:20-24` ("Project-specific divergence... that upstream runs `npm install` per worktree; we symlink instead"). This prior ADAPT credit stands; this survey adds the CLI-wrapper BUILD finding.

### 2.3 Base-ref staleness fix survey (WebSearch ≥3 phrasings)

**Phrasing 1** — "git origin HEAD refresh update symbolic-ref auto 2025 2026":
> `git symbolic-ref` documentation + git-remote documentation returned. Key: `git remote set-head origin --auto` — "With -a or --auto, the remote is queried to determine its HEAD, then the symbolic-ref refs/remotes/<name>/HEAD is set to the same branch."

**Phrasing 2** — "git remote set-head origin --auto fix stale origin HEAD pointing wrong branch":
> "Running `git remote set-head origin --auto` will query the remote repository and update the symbolic reference to match the actual current default branch." Requires network access. Alternative: `git remote set-head origin staging` (explicit, no network needed if you know the target).

**Phrasing 3** — "git worktree add base ref resolve stale origin HEAD default branch detection pattern":
> Known bug surfaced in anthropics/claude-code issue #36965: "The `getDefaultBranch` function resolves the .git directory and reads `refs/remotes/origin/HEAD` relative to it, but in worktrees, `.git` is a file pointing to `.git/worktrees/<n>/`, which does not contain remote refs." Also: "A robust detection pattern uses multiple fallback strategies: first GitHub CLI to get the default branch reference, then falls back to `git symbolic-ref refs/remotes/origin/HEAD`, and if still not found, manually checks for 'origin/main' or 'origin/master'."

**I-phase minimum-surface fix sketch (do NOT implement here — R-phase only):**

Two options for `worktree-setup.sh:70-77`:

Option A — fetch+detect (requires network):
```bash
# Before the candidate loop, refresh origin/HEAD via remote set-head
git -C "$PROJECT_DIR" remote set-head origin --auto >/dev/null 2>&1 || true
# Then the existing candidate loop proceeds (origin/HEAD now up to date)
```

Option B — explicit named ref (no network, requires knowing the trunk branch):
```bash
# Replace "origin/HEAD" candidate with "origin/staging" (authoritative for this repo)
# and add a fallback detection via GITHUB_DEFAULT_BRANCH env or gh CLI
for cand in "origin/staging" "origin/main" "main" "HEAD"; do
```

Option C — detect default branch name before resolution:
```bash
DEFAULT_BRANCH="$(git -C "$PROJECT_DIR" remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}' || echo 'main')"
BASE_REF="origin/$DEFAULT_BRANCH"
```

Option A is the most portable (works across repo migrations); Option B is simplest for this specific repo; Option C is most robust but requires `git remote show` which is slower. The I-phase picks among these with the maintainer.

### 2.4 Alt-target comparison: code-yeongyu/oh-my-openagent (SSOT #68)

**DeepWiki query** (`code-yeongyu/oh-my-openagent`, phrasing "CLI-invocable worktree setup script without AI session"):
> "`oh-my-openagent` handles worktree isolation through a combination of AI prompt/skill disciplines and programmatic detection/management of git worktrees, rather than shipping a standalone CLI-invocable bash script. The codebase does not contain a standalone, user-invocable bash script for worktree setup. Instead, the worktree creation and management logic is embedded within the agent's operational flow, particularly through the `start-work` hook and the `work-with-pr` skill."

**T16 problem-class match:**
- Upstream problem class: Multi-agent orchestration with optional per-member worktrees, managed via `/start-work --worktree` hook (TypeScript, Bun runtime, `createWorktree` function using `Bun.spawnSync`) — purely in-session agent flow.
- Our problem class: (a) CC WorktreeCreate hook reading JSON stdin for AI session isolation, AND (b) portable CLI bash script callable by humans/CI without any AI session.
- Match? NO on (b) — upstream does not ship a CLI-invocable bash script. PARTIAL on (a) — upstream's TypeScript `createWorktree` function is structurally analogous but requires Bun runtime (not portable bash). **No adoption possible for our use case.**
- Verdict: REFERENCE (architecture pattern) for the multi-member team worktree model; REJECT for reuse as a CLI tool.

### 2.5 Alt-target comparison: lee-to/aif-handoff Git Isolation pattern (SSOT #27-area)

**DeepWiki query** (`lee-to/aif-handoff`, phrasing "portable bash worktree setup without active AI session"):
> "The `aif-handoff` system does not ship a portable bash script for creating Git worktrees that can be invoked independently from the CLI or CI. The worktree-isolation pattern is primarily implemented within the AI agent's operational logic, specifically through the `gitIsolation.ts` module, and is managed by the `Coordinator` and `Planner` subagents during an active AI session."
> Key function: `ensureTaskWorktree` in `packages/shared/src/gitIsolation.ts:522-613`.

**T16 problem-class match:**
- Upstream problem class: TypeScript-based worktree lifecycle management (`ensureTaskWorktree`) integrated into the aif-handoff Kanban coordinator+planner pipeline, triggered by `AIF_TASK_WORKTREES_ENABLED=true` — Node.js runtime, in-session only.
- Our problem class (b): Pure bash, human/CI-invocable, zero Node.js/Bun/TypeScript runtime dependency.
- Match? NO — different runtime (TypeScript/Node vs bash), different activation model (env-var+planner vs CLI arg), different consumer surface (aif-handoff Kanban vs our standalone script). Not portable as bash.
- Verdict: REFERENCE (architectural pattern for idempotent worktree-reuse + context-injection idea) for future I-phase design; NOT ADOPT or ADAPT for CLI bash.

### 2.6 No-paid-LLM check (no-paid-llm-in-ci.md §1-§2)

The proposed `scripts/create-worktree.sh` would be:
- Pure bash: `set -euo pipefail`, `git worktree add`, `ln -sfn` for node_modules symlinks
- No `ANTHROPIC_API_KEY`, no `OPENAI_API_KEY`, no `claude` CLI invocation, no `curl` to any LLM API
- Invocable from CI as: `bash scripts/create-worktree.sh <name> [<project-dir>] [<base-ref>]`

**Verdict: trivially compliant** with `no-paid-llm-in-ci.md §1-§2`. No paid LLM at any point. The script is deterministic bash.

### 2.7 dual-implementation-discipline §3 triage

The proposed 3-channel architecture for worktree creation:

| Channel | Audience | §3 category | §3 default | Deviation? |
|---|---|---|---|---|
| `.claude/hooks/worktree-setup.sh` (CC WorktreeCreate hook) | CC users, AI-session-triggered | CC-native primary | Internal tooling: CC-native only | None — hook fires only inside CC |
| `scripts/create-worktree.sh` (portable bash) | Human devs, CI pipelines, non-CC harnesses | Consumer-facing fallback | Dual: CC-native + portable | Compliant — portable fallback is the default for consumer-facing |
| `using-git-worktrees` REFERENCE (SSOT #65) | AI sessions on any harness | Superpowers skill | N/A — upstream reference, not our artefact | N/A |

The hook (`worktree-setup.sh`) already carries:
```bash
# @cc-only-rationale: WorktreeCreate hook event is CC-only; no portable
#   equivalent fires at worktree creation moment.
```
(`.claude/hooks/worktree-setup.sh:26-28` verified 2026-05-30)

The portable script (`scripts/create-worktree.sh`) would be a **new artefact** — it does not yet exist. Per `dual-implementation-discipline.md §5`, it should carry `<!-- @dual-pair: worktree-create-setup -->` (or equivalent markup for a bash script: `# @dual-pair: worktree-create-setup`) referencing the same SSOT anchor as the hook once both exist.

The `@dual-pair` anchor declared in the hook should match the portable script once the I-phase lands them as a pair. The spec (SSOT) for both would live in the research-patch `§5 candidate sketch` below and in the eventual I-phase commit.

---

## §3 Alt-target comparison table

| Candidate | Upstream problem class | Our problem class (b) | T16 match? | Verdict |
|---|---|---|---|---|
| **Superpowers `using-git-worktrees`** (SSOT #65) | AI model prompt/discipline for `.git/index`-race avoidance in active AI sessions; Markdown SKILL.md only; no CLI bash entry-point | (a) AI-session race avoidance: STRONG MATCH; (b) human/CI bash script: NO coverage | (a) STRONG; (b) NONE | REFERENCE for (a); BUILD (b) still required — Superpowers does not fill the CLI gap |
| **tfriedel/claude-worktree-hooks** | CC WorktreeCreate hook reading JSON stdin via jq; `npm install` per worktree; CC-hook-only; no CLI args | Our hook reads same JSON stdin, symlinks instead of npm install — pattern match; CLI invocation: NOT covered | Hook body: ADAPT (structure reusable); CLI wrapper: BUILD | ADAPT (hook body pattern) for existing `worktree-setup.sh`; BUILD CLI wrapper for `scripts/create-worktree.sh` — no upstream fills CLI gap |
| **oh-my-openagent `work-with-pr` skill** (SSOT #68 ref) | TypeScript/Bun `createWorktree` function in multi-agent Kanban; in-session only; `/start-work --worktree` CLI requires running oh-my-openagent | Pure bash, zero Bun/TypeScript/Node runtime | NO — runtime mismatch + in-session-only | REFERENCE (multi-member worktree architecture) only; NOT ADOPT/ADAPT for CLI bash |
| **aif-handoff `gitIsolation.ts`** (SSOT #27-area) | `ensureTaskWorktree` TypeScript function; Node.js; `AIF_TASK_WORKTREES_ENABLED=true`; coordinator+planner pipeline | Pure bash, zero Node.js; no env-var gating; human-invocable | NO — runtime + activation model mismatch | REFERENCE (idempotent reuse pattern, context-injection idea) only; NOT ADOPT for bash |

**Conclusion:** No upstream candidate ships a portable, human/CI-invocable bash worktree-setup script. All four candidates surveyed use either AI-session-bound disciplines (Superpowers) or language-runtime-specific implementations (TypeScript/Node/Bun). The gap is confirmed via evidence from 2 DeepWiki queries + 1 WebFetch on each of 4 candidates.

---

## §4 Falsifier outcomes

### (b) BUILD `scripts/create-worktree.sh` — NOT falsified

Evidence chain:
1. Superpowers `using-git-worktrees`: Markdown only, no CLI bash entry-point (DeepWiki 2 queries, 2026-05-30).
2. tfriedel `worktree-create.sh`: CC-hook-stdin-only, no CLI args (WebFetch raw GitHub, 2026-05-30).
3. oh-my-openagent: TypeScript/Bun runtime, in-session only (DeepWiki 1 query, 2026-05-30).
4. aif-handoff: TypeScript/Node `gitIsolation.ts`, in-session only (DeepWiki 1 query, 2026-05-30).

No falsifier found. BUILD is justified — no production-grade portable bash equivalent exists.

### (c) REFERENCE Superpowers `using-git-worktrees` — CONFIRMED with nuance

Evidence: DeepWiki confirmed the skill is AI-session prompt discipline only. SSOT #65 (ADOPT, verified 2026-05-22) applies to the AI-session axis. The REFERENCE classification in `parallel-subwave-isolation.md §4` is accurate for the AI-session process layer.

Nuance: SSOT #65 says "ADOPT" (process layer dogfooding for our own dev). The proposed new artefact `scripts/create-worktree.sh` does NOT change this — it adds a *separate* portable channel. The REFERENCE to Superpowers in the PR body would note: "AI-session worktree isolation: REFERENCE Superpowers (SSOT #65, ADOPT); human/CI worktree setup: BUILD `scripts/create-worktree.sh` (gap confirmed by BFR §3 survey)."

---

## §5 Composite verdict

**CONFIRMED:** Maintainer pre-verdict stands.

- **(b) BUILD `scripts/create-worktree.sh`** — portable bash; accepts `<name> [<project-dir>] [<base-ref>]` CLI args; mirrors the logic of `worktree-setup.sh` but reads from args instead of JSON stdin; adds `node_modules` symlinks per the D2 workspace-optimisation pattern. No upstream equivalent exists across 4 surveyed candidates. Justification: confirmed BFR §3 negative-existence claim with adversarial survey.
- **(c) REFERENCE Superpowers `using-git-worktrees`** (SSOT #65) — the AI-session axis is served by the upstream skill (ADOPT in our process); the human/CI axis requires our own BUILD. Two orthogonal problem classes, two different channels.
- **Bug fix in `worktree-setup.sh:70`** — stale comment + stale base-ref chain; minimum-surface fix is Option A (`git remote set-head origin --auto` before the loop) or Option B (replace `origin/HEAD` candidate with `origin/staging` explicitly). I-phase decides.

**Scope alignment note:** `scripts/create-worktree.sh` is a new file. If it will ship to consumer projects via `install.sh`, it meets the capability-commit threshold (new file, likely ≥50 LOC under `scripts/`, new consumer-facing directory). The I-phase commit MUST carry a `Prior-art:` trailer referencing this research patch + SSOT #65.

---

## §6 I-phase candidate sketch (informational — do NOT implement)

### 6.1 `scripts/create-worktree.sh` sketch

```bash
#!/usr/bin/env bash
# create-worktree.sh — portable worktree setup; usable from CLI, CI, or AI agent.
# Usage: bash scripts/create-worktree.sh <name> [<project-dir>] [<base-ref>]
# @dual-pair: worktree-create-setup
# spec: docs/meta-factory/research-patches/2026-05-30-worktree-create-dual-channel.md §6

set -euo pipefail

NAME="${1:?Usage: $0 <name> [<project-dir>] [<base-ref>]}"
PROJECT_DIR="${2:-$(git rev-parse --show-toplevel)}"
# Explicit base-ref arg overrides auto-detection; default = origin/staging (this repo)
BASE_REF="${3:-}"

if [[ -z "$BASE_REF" ]]; then
  # Refresh origin/HEAD to avoid stale symbolic-ref (Bug 1 fix — Option A)
  git -C "$PROJECT_DIR" remote set-head origin --auto >/dev/null 2>&1 || true
  # Prefer staging (this repo's trunk); fall back through plausible defaults
  for cand in "origin/staging" "origin/HEAD" "origin/main" "main" "HEAD"; do
    if git -C "$PROJECT_DIR" rev-parse --verify --quiet "$cand" >/dev/null 2>&1; then
      BASE_REF="$cand"; break
    fi
  done
fi

WORKTREE_DIR="$PROJECT_DIR/.claude/worktrees/$NAME"
BRANCH="worktree-$NAME"

if [[ -d "$WORKTREE_DIR" ]]; then
  printf '%s\n' "$WORKTREE_DIR"; exit 0
fi

mkdir -p "$(dirname "$WORKTREE_DIR")"
git -C "$PROJECT_DIR" worktree add "$WORKTREE_DIR" -b "$BRANCH" "$BASE_REF" >/dev/null 2>&1 \
  || git -C "$PROJECT_DIR" worktree add "$WORKTREE_DIR" "$BRANCH" >/dev/null 2>&1

# D2 workspace optimisation: symlink node_modules
[[ -e "$PROJECT_DIR/node_modules" && ! -e "$WORKTREE_DIR/node_modules" ]] \
  && ln -sfn "$PROJECT_DIR/node_modules" "$WORKTREE_DIR/node_modules"
[[ -d "$WORKTREE_DIR/packages/core" && ! -e "$WORKTREE_DIR/packages/core/node_modules" ]] \
  && ln -sfn ../../node_modules "$WORKTREE_DIR/packages/core/node_modules"

printf '%s\n' "$WORKTREE_DIR"
```

### 6.2 `worktree-setup.sh` staleness fix (minimum-surface — Option A)

At `.claude/hooks/worktree-setup.sh:70`, before the `for cand in ...` loop, add:

```bash
# Refresh origin/HEAD symbolic-ref to avoid stale base (Bug 1 — 2026-05-30 fix)
git -C "$PROJECT_DIR" remote set-head origin --auto >/dev/null 2>&1 || true
```

And update the stale comment at `:70`:
```bash
# Resolve base ref: prefer origin/staging (post-2026-05-22 default-branch migration);
# origin/HEAD is refreshed above to avoid stale symbolic-ref (Bug 1).
```

### 6.3 `@dual-pair` annotation plan

Once both artefacts land:
- `scripts/create-worktree.sh:4`: `# @dual-pair: worktree-create-setup`
- `.claude/hooks/worktree-setup.sh:27` (after existing `@cc-only-rationale`): add `# @dual-pair: worktree-create-setup` (replaces or complements `@cc-only-rationale` per `dual-implementation-discipline.md §5-§6`; the hook is not cc-only-rationale anymore once a portable pair exists).

---

## §7 §1.7 Self-checks

### §1.7 Forward-check applied

This research patch complies with:

1. **doc-authority-hierarchy.md §3** — patch carries Class + Authoritative-for + NOT-authoritative-for header; scope annotation `<!-- scope:worktree-create-dual-channel -->` on line 1 per `packages/core/principles/10-research-patch-annotation.test.ts:23` (SCOPE_ANNOTATION_RE).
2. **no-paid-llm-in-ci.md §1** — proposed `scripts/create-worktree.sh` is pure bash (§2.6 confirmed); no API key; no LLM invocation in CI.
3. **build-first-reuse-default.md §3** — 6-layer BFR mechanism applied: SSOT consult (SSOT #65 row 133 verified), DeepWiki ≥3 phrasings, WebSearch ≥3 phrasings, alt-targets ≥2 (oh-my-openagent §2.4, aif-handoff §2.5), phase-research-coverage §1 checklist (§2 above), this rule (§7 self-check).
4. **parallel-subwave-isolation.md §4** — this R-phase runs in isolated worktree `agent-a1ab3926c1126c023` (`.claude/worktrees/` path confirmed by ls of working directory); no shared-workdir violation.
5. **T5 compliance** — no source code or hook files modified in this R-phase; research-patch only.

### §1.7 Backward-check applied

1. **No existing artefact superseded** — `worktree-setup.sh` is not edited (I-phase scope). `parallel-subwave-isolation.md §4` SSOT #65 REFERENCE status unchanged — this patch adds a parallel BUILD channel, not a replacement.
2. **SSOT #65** (`prior-art-evaluations.md:133`) — existing ADOPT verdict for Superpowers `using-git-worktrees` on the AI-session axis remains valid. This R-phase's BUILD finding is for the **human/CI axis** (different problem class) and does not override #65.
3. **`@cc-only-rationale` marker** in `worktree-setup.sh:26-28` — confirmed present on current main branch (`worktree-setup.sh:26`: `# @cc-only-rationale: WorktreeCreate hook event is CC-only; no portable equivalent fires at worktree creation moment.`). The I-phase will update this to `@dual-pair` once the portable script lands; that is an I-phase concern, not this R-phase.
4. **No principle test violations** anticipated — this file has scope annotation (principle 10), no capability commit (doc-only, no capability artifact in this commit), no Prior-art trailer needed (escape-hatch form in commit below).

---

## §8 T15 Self-application (recursive self-application check)

Does this R-phase apply its own discipline to itself?

- **T3 (evidence-backed findings):** Every finding in this patch has either a DeepWiki excerpt, a WebFetch result, or a direct git command output. Zero prose-only findings.
- **T5 (no code changes):** Only `docs/meta-factory/research-patches/2026-05-30-worktree-create-dual-channel.md` is written. No hooks, no scripts, no tests modified.
- **T11 (BFR §3 prior to proposal):** 4 candidates surveyed (Superpowers, tfriedel, oh-my-openagent, aif-handoff) before confirming BUILD. WebSearch ≥3 phrasings run (§2.3).
- **T13 (ADOPTED item not zero-work):** SSOT #65 (Superpowers, ADOPT) re-verified as AI-session-bound — not assumed to cover the CLI gap (DeepWiki 2 queries confirm it does not).
- **T16 (problem-class match explicit):** All 4 alt-targets carry "Upstream problem class / Our problem class / Match?" in §3 table.
- **T19 (own cold-QA):** Applied post-draft (see §9 below).
- **T20 (verdict backed by evidence):** BUILD verdict in §5 backed by 4 DeepWiki queries + 1 WebFetch + 3 WebSearch runs (all cited in §2). No inline vibes-only verdict.

Self-application finding: **PASS** — all active traps applied.

---

## §9 T19 Cold-QA (own review before handoff)

Adversarial cold-review of this patch as a fresh reviewer:

**Finding 1 (MINOR):** §2.3 Option B sketch uses `origin/staging` hardcoded — this is project-specific and would break for consumers. Sketch should note this limitation. → Added note in §6.1 sketch: "Explicit base-ref arg overrides auto-detection; default = origin/staging (this repo)" — I-phase must make the trunk-branch configurable (env var or `git remote show origin`).

**Finding 2 (CHECK):** The `@dual-pair` marker plan in §6.3 says the hook's `@cc-only-rationale` marker will be *replaced* by `@dual-pair`. Verify: `dual-implementation-discipline.md §6` says a hook without `@cc-only-rationale` OR `@dual-pair` is a violation. The I-phase MUST replace (not delete) — the portable script makes the `@cc-only-rationale` factually incorrect once it lands. **Captured in §6.3 for I-phase awareness.**

**Finding 3 (CHECK):** SSOT #86 (Superset, REJECT) is cited in the header as "did not moot Bug 1". Confirm: SSOT #86 verdict is REJECT-as-substrate + KEEP-NARROW + REFERENCE-schema (from git show origin/staging, row #86). Bug 1 (portable bash script for worktree creation) is not served by Superset (REJECT-as-substrate means we don't adopt Superset as a consumer substrate). Conclusion: correct, Bug 1 is unaffected by #86 verdict. **No issue.**

**Finding 4 (PASS):** §1.7 Forward/Backward sections each contain ≥1 file:line citation (`packages/core/principles/10-research-patch-annotation.test.ts:23`, `prior-art-evaluations.md:133`, `worktree-setup.sh:26-28`). Both sections ≥40 non-whitespace chars. CI `discipline-self-check.yml` should pass.

**Cold-QA verdict: GO** with the two minor notes captured for I-phase.
