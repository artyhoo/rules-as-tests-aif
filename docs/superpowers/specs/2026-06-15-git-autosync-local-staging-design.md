# Auto-sync local `staging` on git activity (E3-refined) — design

> **Status:** approved 2026-06-15 (brainstorming → this spec → writing-plans).
> **Date:** 2026-06-15
>
> **Authoritative for:** the design of the opportunistic FF-sync of local `staging` added to the personal global hook `~/.claude/hooks/post-api-push-autosync.sh`. Scope/mechanism/trigger/throttle decisions and their evidence.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The existing API-down-sync behaviour of the same hook (unchanged by this design). Git-transport root-cause history — see memory `project_github_push_flaky_proxy_tunnel`.

## 1. Problem

Local `staging` in `rules-as-tests-aif` is a pure mirror of `origin/staging` (the maintainer never commits to it directly; it only ever fast-forwards). After the 2026-06-15 git-transport root-fix (gh-direct LaunchDaemon removed → native git works again), it can be synced the normal way (`git fetch` / `git pull`), but **not automatically**. Maintainer requirement (2026-06-15):

> «не надо вручную обновлять локальный staging, и не демон-в-простое»

Two constraints: (a) no manual `git pull` for staging; (b) no idle daemon/timer.

## 2. Decision: E3-refined

Extend the **existing** hook `~/.claude/hooks/post-api-push-autosync.sh` (PostToolUse/Bash, wired in `~/.claude/settings.json`) with a **second, independent code path** that opportunistically FF-syncs local `staging` on ordinary git activity inside a Claude Code session. The hook's current API-push/merge down-sync path is unchanged.

Rationale vs alternatives (from the 2026-06-15 brainstorm; full record in memory `project_git_autosync_e3_handoff`):

- **A — launchd timer:** rejected — runs in idle; maintainer explicitly dislikes.
- **E1 — `git nb` alias (point-of-use refresh):** rejected as primary — needs a new habit (conflicts with «не думать»). Kept as the fallback if E3's gap bites.
- **E2 — native `pre-push`:** rejected — `core.hooksPath=.husky`, `.husky/pre-push` is committed + shipped to consumers; personal sync can't live there cleanly.
- **E3-refined:** zero behaviour change, zero idle cost, no husky conflict, reuses the already-built hook. Best fit.

## 3. Refinements discovered by grounding in live code (2026-06-15)

The original handoff under-specified two things; both were corrected against live evidence before this spec.

### 3.1 Sync mechanism — handoff's `fetch origin staging:staging` is broken when `staging` is checked out

Live test (repo currently on `staging`):

```console
$ git fetch origin staging:staging
fatal: refusing to fetch into branch 'refs/heads/staging' checked out at '/Users/art/code/rules-as-tests-aif'
```

Git refuses a refspec-fetch into the currently checked-out branch. The repo is regularly **on** `staging` (it is right now). So the mechanism must branch on checkout state — the exact conditional already proven in `~/.claude/sync-branch-from-api.sh` lines 135–139 (personal home file, outside this repo):

```bash
git fetch origin staging            # updates only origin/staging; never touches local staging — safe at any checkout
if [ "$(git symbolic-ref --short HEAD)" = "staging" ]; then
  git merge --ff-only origin/staging        # works on the checked-out branch
else
  # not checked out: FF the ref directly, only if it's a true fast-forward
  git merge-base --is-ancestor staging origin/staging && \
    git update-ref refs/heads/staging origin/staging
fi
```

### 3.2 Drop the guarded-force — FF-only, skip on non-FF

The handoff proposed forcing local `staging` when `git rev-list staging ^origin/staging` is empty. **Decision: no force at all.** Evidence:

- `git rev-list --left-right --count staging...origin/staging` → `local-ahead=0` (always; the mirror invariant).
- `git reflog show staging` → 100% `fast-forward` / `merge … Fast-forward` entries; never committed-to, never ahead.
- The feared non-FF case (a *rewrite of staging itself*) does not occur in this workflow: a squash-merge **into** staging is a FF (+1 commit), not a history rewrite.
- Forcing a **checked-out** branch corrupts the working-tree↔HEAD relationship (everything shows as modified) — unsafe even when "no unique commits".

Therefore: FF-only. On the (effectively-never) non-FF case, **silently skip** — `staging` stays where it is, the maintainer notices it's stale and resyncs manually. Simpler and strictly safer than a force path. FF cannot lose work, so this is safe even outside the proven mirror invariant.

## 4. Scope: `rules-as-tests-aif` only

The opportunistic staging-FF fires only when the repo's `origin` is the aif repo (`git remote get-url origin | grep -q rules-as-tests-aif`). In any other repo the new block no-ops; the existing API-down-sync path is untouched and still works everywhere.

Rationale: the need + the mirror invariant are proven only for aif. Generalising to "any repo with a local `staging`" would fire fetches in repos with no demonstrated demand (BDDS, sisters-sphere), and their staging may not be a pure mirror. YAGNI.

**Falsifier / revisit trigger:** if the maintainer later wants this in another repo, generalise the gate to "any github repo with a local `staging` branch" and switch the single stamp to a per-repo stamp (`/tmp/aif-staging-autosync.<repo-hash>.stamp`). Small, localised change.

## 5. Mechanism summary

| Aspect | Decision | Basis |
|---|---|---|
| **Channel** | second independent path in `~/.claude/hooks/post-api-push-autosync.sh` | reuse already-built hook (BFR) |
| **Trigger** | broaden command match to native git ops: `git push\|fetch\|pull\|checkout\|status\|log\|commit\|merge\|rebase` | fires only during active git work in CC → zero idle cost (vs timer) |
| **Scope gate** | `origin` matches `rules-as-tests-aif` | §4 |
| **Sync** | `git fetch origin staging` → `merge --ff-only` (if HEAD=staging) / ancestor-guarded `update-ref` (else) | §3.1, proven in sync-branch-from-api.sh |
| **Force** | none — FF-only, skip on non-FF | §3.2 |
| **Throttle** | skip if synced < ~10 min ago (stamp file `/tmp/aif-staging-autosync.stamp`, mtime check) | keep staging ≤10 min fresh during active work; don't refetch every command |
| **Latency** | inline (not backgrounded) | throttle ⇒ ≤1 fetch / 10 min (~1 s); a backgrounded fetch races the next git command for `.git/*.lock` |
| **Fail-safe** | always `exit 0`; quiet on tunnel flap; one concise line only when staging actually advanced | never break the turn |
| **Recursion** | none — the hook's internal `git` calls are subprocesses, not Bash-tool calls, so they don't re-fire PostToolUse; keep the existing `sync-branch-from-api` guard for manual invocations | PostToolUse fires on the tool, not on hook subprocesses |

## 6. Known gap (accepted consciously)

- Fires **only inside Claude Code sessions** → pure-terminal git work outside CC won't trigger it (manual `git pull` still available there).
- Fires **after** the activity → staging is fresh for the *next* git op, not the current one. Negligible: git is run near-constantly during active work, so the window stays ≤10 min.
- If the maintainer ends up doing lots of bare-terminal git → switch to **E1** (`git nb` alias). This spec does not build E1; it is the documented fallback.

## 7. Testing

- **Pipe-test:** feed a synthetic PostToolUse JSON to the hook on stdin (`{"tool_input":{"command":"git status"},"cwd":"/Users/art/code/rules-as-tests-aif"}`) and assert it FFs `staging` (or no-ops within throttle), exit 0.
- **Negative pipe-tests:** non-aif `cwd` → no-op; non-git command → no-op; within-throttle → no-op.
- **Live-fire:** run a real `git status` in the aif repo with a stale local `staging` and confirm it advances to `origin/staging` and prints one concise line.
- **git-safety caution:** literal `git reset --hard` / `gh pr merge` substrings in test fixtures are blocked by `~/.claude/hooks/git-safety.sh`. Trigger via native `git status` / `git fetch` strings instead.

## 8. See also

- memory `project_git_autosync_e3_handoff` — origin handoff (the decision + deferred-build record this spec implements).
- memory `project_github_push_flaky_proxy_tunnel` — git-transport root-fix that made native staging-sync viable again.
- memory `feedback_sync_branch_down_via_gh_api` — the pipe-test + live-fire test pattern reused here; the sync-branch-from-api.sh down-sync companion.
- `~/.claude/hooks/post-api-push-autosync.sh` — the hook extended by this design.
- `~/.claude/sync-branch-from-api.sh` — proven checked-out-vs-not FF conditional (§3.1).
