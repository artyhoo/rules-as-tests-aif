# Auto-sync local `staging` on git activity (E3-refined) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the personal hook `~/.claude/hooks/post-api-push-autosync.sh` so that, on ordinary git activity inside a Claude Code session, local `staging` in `rules-as-tests-aif` opportunistically fast-forwards to `origin/staging` — no manual `git pull`, no idle timer.

**Architecture:** Add a second, independent code path ("Path B") to the existing hook. The hook keeps its current API-down-sync ("Path A") untouched. Path B gates on: native-git trigger → aif-repo scope → ≤10-min throttle, then `git fetch origin staging` + FF-only (`merge --ff-only` when `staging` is the checked-out branch, ancestor-guarded `update-ref` otherwise). A `AIFAUTOSYNC_DEBUG=1` seam emits each gate decision to stderr and stops before the network call, making the gating logic testable hermetically (no network). Real network FF is covered by a live-fire smoke.

**Tech Stack:** Bash (macOS/BSD userland), `jq`, git, GitHub CLI. Tests are a plain bash assertion script (no vitest — the hook is a personal dotfile, not a repo package).

**Important environment facts (verified 2026-06-15):**
- `~/.claude` is **NOT a git repo** → the hook and its test script are personal dotfiles. There are **no git commits** for them. Rollback safety = a one-time `.bak` copy (Task 1). The spec and *this plan* live in the `rules-as-tests-aif` repo and are committed on branch `git-autosync-staging-e3` (spec already committed as `41456e5`).
- `find <f> -mmin -10` works on macOS BSD `find` (throttle primitive).
- `git fetch origin staging` updates `refs/remotes/origin/staging` via the configured refspec `+refs/heads/*:refs/remotes/origin/*`, so `origin/staging` is fresh for the subsequent `merge --ff-only`.
- The repo is regularly **on** `staging` (it is now) → `git fetch origin staging:staging` is **refused** by git; the `merge --ff-only` path is required.

**Spec:** [docs/superpowers/specs/2026-06-15-git-autosync-local-staging-design.md](../specs/2026-06-15-git-autosync-local-staging-design.md)

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `~/.claude/hooks/post-api-push-autosync.sh` | the hook: Path A (API down-sync, unchanged behaviour) + Path B (new staging FF) + `AIFAUTOSYNC_DEBUG` seam | Modify |
| `~/.claude/hooks/post-api-push-autosync.test.sh` | hermetic pipe-tests for the Path B gates + Path A regression, network-free via the debug seam | Create |
| `~/.claude/hooks/post-api-push-autosync.sh.bak-2026-06-15` | rollback copy of the pre-change hook | Create (Task 1) |

---

## Task 1: Backup + failing test harness

**Files:**
- Create: `~/.claude/hooks/post-api-push-autosync.sh.bak-2026-06-15`
- Create: `~/.claude/hooks/post-api-push-autosync.test.sh`

- [ ] **Step 1: Back up the current hook (rollback safety — no git here)**

```bash
cp ~/.claude/hooks/post-api-push-autosync.sh \
   ~/.claude/hooks/post-api-push-autosync.sh.bak-2026-06-15
```

- [ ] **Step 2: Write the test script (the failing test)**

Create `~/.claude/hooks/post-api-push-autosync.test.sh` with exactly this content:

```bash
#!/usr/bin/env bash
# Hermetic pipe-tests for post-api-push-autosync.sh.
# AIFAUTOSYNC_DEBUG=1 makes the hook emit one gate-decision token to stderr and
# STOP before any network call — so these tests need no network and no remote.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
HOOK="$HOME/.claude/hooks/post-api-push-autosync.sh"
AIF="/Users/art/code/rules-as-tests-aif"
STAMP="/tmp/aif-staging-autosync.stamp"

# A throwaway non-aif github repo (for the scope test).
TMPREPO=$(mktemp -d)
git -C "$TMPREPO" init -q
git -C "$TMPREPO" remote add origin https://github.com/foo/bar.git
cleanup() { rm -rf "$TMPREPO"; }
trap cleanup EXIT

pass=0; fail=0
run() { # $1=name $2=expected-token $3=command $4=cwd  (stamp state set by caller)
  local json out
  json=$(jq -nc --arg c "$3" --arg d "$4" '{tool_input:{command:$c},cwd:$d}')
  out=$(printf '%s' "$json" | AIFAUTOSYNC_DEBUG=1 bash "$HOOK" 2>&1 1>/dev/null)
  if printf '%s' "$out" | grep -q "$2"; then
    echo "PASS: $1"; pass=$((pass+1))
  else
    echo "FAIL: $1 — expected token '$2', got: [$out]"; fail=$((fail+1))
  fi
}

# 1. A non-git command never triggers Path B.
run "non-git command -> not-git-trigger" "not-git-trigger" "echo hello" "$AIF"

# 2. Native git in a non-aif repo is out of scope.
run "non-aif repo -> not-aif" "not-aif" "git status" "$TMPREPO"

# 3. Fresh stamp throttles.
touch "$STAMP"
run "fresh stamp -> throttled" "throttled" "git fetch" "$AIF"

# 4. Stale/absent stamp passes all gates (debug stops before network).
rm -f "$STAMP"
run "stale stamp -> would-sync" "would-sync" "git status" "$AIF"

# 5. An API-push command is NOT a Path B trigger (no 'git <subcmd>' in it).
rm -f "$STAMP"
run "api-push cmd -> not a B trigger" "not-git-trigger" "gh pr merge 5 --squash" "$AIF"

# 6. Regression: an API-push command still fires Path A.
rm -f "$STAMP"
run "api-push cmd -> path A fires" "pathA:would-sync" "gh pr merge 5 --squash" "$AIF"

echo "----"
echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
```

- [ ] **Step 3: Make it executable and run it — verify it FAILS**

```bash
chmod +x ~/.claude/hooks/post-api-push-autosync.test.sh
bash ~/.claude/hooks/post-api-push-autosync.test.sh; echo "exit=$?"
```

Expected: tests FAIL (current hook emits no debug tokens and has no Path B), `exit=1`. Specifically tests 1–5 fail (no `not-git-trigger`/`not-aif`/`throttled`/`would-sync` tokens) and test 6 fails (no `pathA:would-sync` token yet).

---

## Task 2: Restructure the hook — gates + debug seam (no network yet)

**Files:**
- Modify: `~/.claude/hooks/post-api-push-autosync.sh` (full rewrite of the body below the shebang)
- Test: `~/.claude/hooks/post-api-push-autosync.test.sh`

- [ ] **Step 1: Replace the hook body with the restructured version (Path A debug-gated + Path B gates, stopping at `would-sync`)**

Write `~/.claude/hooks/post-api-push-autosync.sh` to exactly this content:

```bash
#!/usr/bin/env bash
# PostToolUse(Bash) hook — two INDEPENDENT local-sync paths:
#   Path A: DOWN-sync local branch <- GitHub remote after an API-side push/merge
#           (fires when git transport is dead but api.github.com works).
#   Path B: opportunistic FF-sync of local `staging` <- origin/staging on native
#           git activity, scoped to rules-as-tests-aif only.
# Design: docs/superpowers/specs/2026-06-15-git-autosync-local-staging-design.md
# AIFAUTOSYNC_DEBUG=1 -> emit each path's gate decision to stderr and skip the
# network (used by post-api-push-autosync.test.sh).
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

dbg() { [ -n "${AIFAUTOSYNC_DEBUG:-}" ] && echo "[autosync-debug] $1" >&2; return 0; }

input=$(cat 2>/dev/null) || exit 0
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$cmd" ] && exit 0

# Never recurse on the down-sync helper itself.
printf '%s' "$cmd" | grep -q 'sync-branch-from-api' && exit 0

# Resolve the repo from the tool call's cwd (fall back to the hook's process cwd).
dir=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$dir" ] && cd "$dir" 2>/dev/null || true
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
git remote get-url origin 2>/dev/null | grep -q 'github.com' || exit 0

# ---------- Path A: API push/merge DOWN-sync (original behaviour) ----------
api_fire=0
printf '%s' "$cmd" | grep -qE 'gh +pr +merge|harvest-via-api|harvest\.ts|api-promote|promote-via-api' && api_fire=1
if [ "$api_fire" -eq 0 ] && printf '%s' "$cmd" | grep -qE 'git/refs|git/commits|git/trees|/contents/'; then
  printf '%s' "$cmd" | grep -qE '(-X|--method)[ =]?(POST|PATCH|PUT|DELETE)|--field|--raw-field|--input| -f ' && api_fire=1
fi
if [ "$api_fire" -eq 1 ]; then
  dbg "pathA:would-sync"
  if [ -z "${AIFAUTOSYNC_DEBUG:-}" ]; then
    branch=$(git symbolic-ref --short HEAD 2>/dev/null) || branch=""
    if [ -n "$branch" ]; then
      out=$(bash "$HOME/.claude/sync-branch-from-api.sh" "$branch" 2>&1) || true
      if ! printf '%s' "$out" | grep -q 'Already in sync'; then
        last=$(printf '%s' "$out" | grep -E '✅|ABORT|could not reconstruct' | tail -1)
        [ -n "$last" ] && echo "auto-sync($branch): $last"
      fi
    fi
  fi
fi

# ---------- Path B: opportunistic staging FF-sync (aif only) ----------
STAMP="/tmp/aif-staging-autosync.stamp"
path_b() {
  # native git activity trigger (word-anchored, BSD-grep safe)
  printf '%s' "$cmd" | grep -qE '(^|[[:space:];&|(])git +(push|fetch|pull|checkout|status|log|commit|merge|rebase)' \
    || { dbg "not-git-trigger"; return 0; }
  # scope: aif only
  git remote get-url origin 2>/dev/null | grep -q 'rules-as-tests-aif' \
    || { dbg "not-aif"; return 0; }
  # throttle: skip if synced < ~10 min ago
  if [ -n "$(find "$STAMP" -mmin -10 2>/dev/null)" ]; then dbg "throttled"; return 0; fi
  dbg "would-sync"
  [ -n "${AIFAUTOSYNC_DEBUG:-}" ] && return 0   # debug: stop before the network
  return 0                                       # real FF added in Task 3
}
path_b
exit 0
```

- [ ] **Step 2: Run the tests — verify they PASS**

```bash
bash ~/.claude/hooks/post-api-push-autosync.test.sh; echo "exit=$?"
```

Expected: all 6 tests PASS, `pass=6 fail=0`, `exit=0`.

---

## Task 3: Add the real Path B network FF (below the debug seam)

**Files:**
- Modify: `~/.claude/hooks/post-api-push-autosync.sh` (inside `path_b()`, replace the `return 0  # real FF added in Task 3` line)

- [ ] **Step 1: Implement the FF-only sync**

In `~/.claude/hooks/post-api-push-autosync.sh`, replace this exact line inside `path_b()`:

```bash
  return 0                                       # real FF added in Task 3
```

with:

```bash
  # Real FF-only sync. Silent on tunnel flap; never fail the turn.
  git fetch --quiet origin staging 2>/dev/null || { touch "$STAMP"; return 0; }
  local head before after
  head=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  before=$(git rev-parse --verify -q staging 2>/dev/null || echo "")
  if [ "$head" = "staging" ]; then
    git merge --ff-only --quiet origin/staging 2>/dev/null || true
  elif [ -n "$before" ] && git merge-base --is-ancestor staging origin/staging 2>/dev/null; then
    git update-ref refs/heads/staging origin/staging
  fi
  after=$(git rev-parse --verify -q staging 2>/dev/null || echo "")
  touch "$STAMP"
  if [ -n "$before" ] && [ "$before" != "$after" ]; then
    echo "auto-sync(staging): ${before:0:9} -> ${after:0:9}"
  fi
  return 0
```

- [ ] **Step 2: Re-run the hermetic tests — still PASS (debug seam unaffected)**

```bash
bash ~/.claude/hooks/post-api-push-autosync.test.sh; echo "exit=$?"
```

Expected: `pass=6 fail=0`, `exit=0`. (The debug-mode tests stop at `would-sync`, before this new code, so they are unchanged.)

- [ ] **Step 3: Syntax-check the final hook**

```bash
bash -n ~/.claude/hooks/post-api-push-autosync.sh && echo "syntax OK"
```

Expected: `syntax OK`.

---

## Task 4: Live-fire smoke (real network path)

**Files:** none (verification only).

- [ ] **Step 1: Real run — stale stamp, in-sync staging → no crash, no spurious output**

```bash
rm -f /tmp/aif-staging-autosync.stamp
printf '{"tool_input":{"command":"git status"},"cwd":"/Users/art/code/rules-as-tests-aif"}' \
  | bash ~/.claude/hooks/post-api-push-autosync.sh; echo "exit=$?"
ls -l /tmp/aif-staging-autosync.stamp
```

Expected: `exit=0`; no output line (staging already in sync → nothing printed); stamp file now exists (the run touched it). This proves the real `git fetch` + FF path runs end-to-end without error and the throttle stamp is written.

- [ ] **Step 2: Throttle holds on the immediate second run**

```bash
printf '{"tool_input":{"command":"git status"},"cwd":"/Users/art/code/rules-as-tests-aif"}' \
  | AIFAUTOSYNC_DEBUG=1 bash ~/.claude/hooks/post-api-push-autosync.sh 2>&1 1>/dev/null
```

Expected: `[autosync-debug] throttled` (stamp from Step 1 is < 10 min old).

- [ ] **Step 3: Observational check (record, do not block)**

The genuine FF (a non-empty `auto-sync(staging): X -> Y` line) is only observable when `origin/staging` is actually ahead of local. Note in the session summary that the next time `origin/staging` advances and the maintainer runs any `git status`/`git fetch`/etc. in the aif repo (with a stale stamp), the hook should print one `auto-sync(staging): …` line and leave `git rev-list staging ^origin/staging` empty afterwards. No action needed now.

- [ ] **Step 4: Confirm the mirror invariant still holds (sanity)**

```bash
git -C /Users/art/code/rules-as-tests-aif rev-list staging ^origin/staging --count
```

Expected: `0` (the hook only ever FFs staging — it never creates local-only commits).

---

## Task 5: Finalize plan doc in the repo

**Files:**
- Modify (commit): this plan file in the `rules-as-tests-aif` repo, on branch `git-autosync-staging-e3`.

- [ ] **Step 1: Commit the plan to the feature branch**

```bash
cd /Users/art/code/rules-as-tests-aif
git add docs/superpowers/plans/2026-06-15-git-autosync-local-staging.md
git commit -m "docs(plan): E3-refined auto-sync local staging — implementation plan

Prior-art: skipped — plan/design-doc only, no new capability/dependency/code module."
```

Expected: commit succeeds; `git rev-list staging ^origin/staging --count` still `0` (we are on the feature branch, not staging).

- [ ] **Step 2: Note for the maintainer**

The hook + test script live under `~/.claude/hooks/` (not git-tracked). A rollback copy is at `~/.claude/hooks/post-api-push-autosync.sh.bak-2026-06-15`. The spec (`41456e5`) and this plan are committed on branch `git-autosync-staging-e3`; pushing/PR-ing them is the maintainer's call (not required for the hook to take effect — it is already live as an installed personal hook once Task 2/3 land).

---

## Self-Review

**1. Spec coverage** (each spec §5 row → task):
- Channel (second path in hook) → Task 2 Step 1. ✓
- Trigger (broaden to native git ops) → Task 2 `path_b()` grep. ✓
- Scope gate (aif only) → Task 2 `path_b()` aif grep + test 2. ✓
- Sync (fetch + merge --ff-only / ancestor-guarded update-ref) → Task 3 Step 1. ✓
- Force = none (FF-only, skip non-FF) → Task 3 (no force; `merge --ff-only` / `is-ancestor` guard). ✓
- Throttle (≤10 min stamp) → Task 2 `find -mmin -10` + test 3. ✓
- Latency (inline) → Task 3 runs inline (no `&`). ✓
- Fail-safe (exit 0, quiet on flap) → Task 3 `|| { touch; return 0; }`, hook ends `exit 0`. ✓
- Recursion (existing guard kept) → Task 2 `sync-branch-from-api` guard retained. ✓
- §7 testing (pipe-test + live-fire) → Tasks 1–4. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases". The Task-2 `return 0  # real FF added in Task 3` is a deliberate, named seam replaced verbatim in Task 3 Step 1 — not a vague placeholder. ✓

**3. Type/name consistency:** `path_b` (defined Task 2, edited Task 3); `STAMP=/tmp/aif-staging-autosync.stamp` (hook + test agree); `AIFAUTOSYNC_DEBUG` (hook + test agree); decision tokens `not-git-trigger`/`not-aif`/`throttled`/`would-sync`/`pathA:would-sync` (emitted in hook, asserted in test) all match. ✓
