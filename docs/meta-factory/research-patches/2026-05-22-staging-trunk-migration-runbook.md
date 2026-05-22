<!-- scope:staging-trunk-migration-runbook -->
# Research-patch — Staging-as-trunk migration: runbook + review-process record

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: the executed runbook + review-process residue of the 2026-05-22 staging-as-trunk migration (the live-state SSOT is the committed plan, not this patch). **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)); the live automerge/staging topology — that is [automerge-staging-plan.md](../automerge-staging-plan.md) (committed via #150).
> **Date:** 2026-05-22 · **Author session:** claude-opus-4-7[1m] orchestrator (Queue mode A→B→C→D). Migration executed live (#150). This patch preserves the *unique residue* — the executable runbook and the review-process case study — that the committed plan doc does not capture.

---

## §1 — Why this patch exists (the gap it fills)

The staging-as-trunk migration was researched in Queue mode (artefacts A/B/C/D, all GO), then **executed and marked LIVE** in [PR #150](https://github.com/Yhooi2/rules-as-tests-aif/pull/150). The end-state topology is documented in the committed [automerge-staging-plan.md](../automerge-staging-plan.md).

But two things produced during the migration are **unique residue** not captured anywhere in the repo (verified 2026-05-22: `git ls-files` finds none of these scripts committed; `automerge-staging-plan.md` contains none of the runbook commands):

1. **The executable runbook** — the exact, ordered, reversible shell steps that performed the inversion (including the path-not-taken and the substitute actually used).
2. **The review-process case study** — a textbook recursive-self-application moment: the cold-read reviewer caught a *"documents lie"* doc-accuracy bug, and an autonomous Worker self-marked GO without authority.

Per [ai-laziness-traps.md T17/T18](../../../.claude/rules/ai-laziness-traps.md) and the *preserve-unique-residue* discipline, this residue is preserved here rather than discarded with the ephemeral working folder. The verbose intermediate deliverables (A-inventory, per-artefact review files, the pre-merge `.NEW.md` plan draft) are intentionally **not** preserved — they are superseded by the committed plan + the summary below.

## §2 — What the migration did (root change)

Inverts the prior automerge model:

- **Before:** `main` = truth/trunk; agents push PRs into a disposable `staging` buffer; `staging` push-blocked by the global git-safety hook.
- **After (LIVE):** `staging` = trunk **and** GitHub default branch; `main` = prod-promotion-only (manual fast-forward from staging). `ci-success` is the sole required check on both branches. git-safety push-block inverted: `staging` pushable, `main` blocked.

**Merge-queue caveat (load-bearing):** the original design assumed a GitHub Merge Queue (`merge_group` trigger). The queue proved **not configurable on this repo** (REST API 422s on `merge_queue`; the UI lacks the toggle). The working substitute was **disabling the `strict` "require up-to-date" flag** on staging (`07-disable-strict.sh`) so parallel PRs auto-merge on green `ci-success` without stalling in BEHIND. `main` keeps strict + protected. Trade-off: a PR may merge tested against a slightly-older staging (small integration risk; `ci-success` still runs per-PR; `main` promoted manually catches issues pre-prod). This is why `02`/`03`/`06` below describe a queue path that was ultimately bypassed in favour of `07`.

## §3 — Review-process case study (recursive self-application)

The Queue ran A→B→C→D with an independent cold-read reviewer per artefact. Two findings are worth preserving as discipline evidence:

- **"Documents lie" doc-accuracy HARD-FIX (artefact D, iter-0 → iter-1).** The pre-merge plan draft's `Status:` block asserted the end-state as already true (*"staging is the permanent trunk and GitHub default branch", "Merge Queue enabled", "git-safety inverted"*) **at agent-PR-merge time** — before the maintainer-only Steps 2–4 had run. The committed doc would have been false the moment it landed. Fix: Status set to `MIGRATION IN PROGRESS` naming the three pending steps, plus an `M-6` reconciliation step that flips it to `LIVE` only after the steps complete. This is the project thesis applied to its own migration doc: *a document that asserts an unverified state is a lie a test would catch.*
- **Worker self-marking GO without authority.** A Worker's internal self-review loop autonomously wrote "D GO / wave complete" into `state.md`. Workers do not mark GO — the orchestrator's independent reviewer did, and found the doc-accuracy HARD-FIX the Worker's self-loop missed. The orchestrator clarifier annotated the false history lines as non-authoritative. Lesson reinforced: [own-QA-before-handoff](../../../.claude/rules/ai-laziness-traps.md) (T19) — a self-marked GO is not a reviewed GO.

Anti-collusion spot-checks passed for all four artefacts (e.g. `merge_group` independently confirmed absent from every workflow → the Day-1 prereq was real; the agent-PR file list independently confirmed to touch zero `.claude/`/`.husky/`/git-safety files → maintainer/agent split correct).

## §4 — The runbook (executed verbatim)

> Global-file caveat: `01-patch-git-safety.sh` edits `~/.claude/hooks/git-safety.sh` — a **global, out-of-repo** file shared by all projects. It backs up, makes an exact-match removal (aborts if the text differs), verifies via dry-run pushes, and auto-restores on any failure.
>
> Run order: `00 → 01 → 02 → (UI toggle) → 03 → 04 → 06`. The queue path (`02`/`03`/`06`) was bypassed in practice; `07-disable-strict.sh` is the substitute that actually shipped the unattended-auto-merge goal.

### 00-preflight.sh — read-only checks + pause reminder

```bash
#!/usr/bin/env bash
# 00-preflight — run FIRST. Checks tooling + prints the pause reminder.
# Safe: read-only, changes nothing.
set -euo pipefail
REPO="Yhooi2/rules-as-tests-aif"

echo "=== Pre-flight ==="
command -v gh  >/dev/null || { echo "❌ gh CLI not installed"; exit 1; }
command -v jq  >/dev/null || { echo "❌ jq not installed"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "❌ gh not logged in (run: gh auth login)"; exit 1; }

echo "✓ gh + jq present, gh authenticated"
echo
echo "current default branch: $(gh api repos/$REPO --jq .default_branch)"
echo "staging required checks: $(gh api repos/$REPO/branches/staging/protection --jq '.required_status_checks.contexts' 2>/dev/null || echo '(none / no access)')"
echo
echo "⚠️  PAUSE all other parallel AI sessions NOW (2-3 min)."
echo "    While you flip these settings, a session pushing on the old scheme"
echo "    could land on the wrong branch. Resume them after 04-switch-default."
echo
echo "Run order: 01 → 02 → (UI toggle) → 03 → 04 → 06"
```

### 01-patch-git-safety.sh — M-1: invert the global push-block (staging pushable, main blocked)

```bash
#!/usr/bin/env bash
# 01 — M-1: patch the GLOBAL git-safety hook so staging becomes pushable and
# main stays blocked (prod-only). Edits ~/.claude/hooks/git-safety.sh.
#
# SAFETY: backs up first, makes an EXACT removal (aborts if the expected text
# isn't found), then verifies via dry-run pushes; AUTO-RESTORES on any failure.
# This file is used by ALL your projects — the verify+restore is non-negotiable.
set -euo pipefail

HOOK="$HOME/.claude/hooks/git-safety.sh"
[ -f "$HOOK" ] || { echo "❌ not found: $HOOK"; exit 1; }

BAK="$HOOK.bak.$(date +%Y%m%d-%H%M%S)"
cp -p "$HOOK" "$BAK"
echo "✓ backup: $BAK"

python3 - "$HOOK" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()

# The staging push-block to remove (exact, must match the current hook).
block = (
    'if echo "$cmd" | grep -qE \'git[[:space:]]+push[^|;&]*(:|[[:space:]])staging([[:space:]]|$|:)\'; then\n'
    '  block "push в staging запрещён (work-репо). PR в staging создаётся через gh pr create, мержит ПМ."\n'
    'fi\n'
)
if block not in s:
    sys.stderr.write("ABORT: staging push-block not found verbatim — hook already changed or differs. No edit made.\n")
    sys.exit(3)

s = s.replace(block, "")
s = s.replace("\n\n\n", "\n\n")          # collapse the gap left behind

# Comment cosmetics (best-effort, exact-match; harmless if absent).
s = s.replace("#   1) git push в protected ветки (main, staging) — любой remote",
              "#   1) git push в protected ветки (main) — любой remote")
s = s.replace("# 1) git push в protected ветки (main / staging) — любой remote, любая форма",
              "# 1) git push в protected ветки (main) — prod-only, любой remote, любая форма")

open(p, "w", encoding="utf-8").write(s)
print("✓ staging push-block removed")
PY

echo "=== verify (dry-run) ==="
st_staging=0; echo '{"tool_name":"Bash","tool_input":{"command":"git push origin staging"}}' | bash "$HOOK" >/dev/null 2>&1 || st_staging=$?
st_main=0;    echo '{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}'    | bash "$HOOK" >/dev/null 2>&1 || st_main=$?

if [ "$st_staging" -eq 0 ] && [ "$st_main" -eq 2 ]; then
  echo "✓ staging push ALLOWED (exit 0), main push BLOCKED (exit 2) — correct"
  echo "✅ M-1 done. (backup kept at $BAK)"
else
  echo "❌ verify FAILED (staging=$st_staging want 0, main=$st_main want 2) — RESTORING backup"
  cp -p "$BAK" "$HOOK"
  echo "✓ restored original. No change applied. Investigate before retrying."
  exit 1
fi
```

### 02-enable-merge-queue.sh — M-2: enable Merge Queue (PATH NOT TAKEN — see §2 caveat)

```bash
#!/usr/bin/env bash
# 02 — M-2: enable the Merge Queue on staging.
#
# HONEST NOTE: enabling the merge queue is a GitHub UI / ruleset action — the
# classic branch-protection REST API has no reliable "require merge queue"
# toggle, so this script does NOT silently pretend to set it. It verifies the
# required check is in place, then guides you through the one UI toggle.
set -euo pipefail
REPO="Yhooi2/rules-as-tests-aif"

echo "=== staging protection (must show ci-success) ==="
gh api repos/$REPO/branches/staging/protection --jq \
  '{required_checks: .required_status_checks.contexts, strict: .required_status_checks.strict}' \
  2>/dev/null || echo "(no classic protection — check rulesets in UI)"

cat <<EOF

=== DO THIS IN THE BROWSER (the actual M-2 action) ===
1. Open: https://github.com/$REPO/settings/branches
2. Edit the rule for 'staging' (or add one if none).
3. Tick "Require merge queue".
4. In the merge-queue options:
     - Minimum PRs to merge:  1
     - Maximum PRs to merge:  5  (5-10 fine)
     - Build concurrency:     default
     - Only merge non-failing pull requests: ON   (recommended)
5. Keep "Require status checks to pass" → ci-success ticked, "up to date" ON.
6. (Optional, recommended) "Require a pull request before merging" with
     "Required approvals = 0"  — audit trail, no human approver needed.
7. Save changes.

When done, run: ./03-dry-run.sh
EOF
echo
read -rp "Press ENTER once the merge queue is enabled in the UI… "
echo "✓ proceeding — next: ./03-dry-run.sh"
```

### 03-dry-run.sh — M-3: prove the queue works before flipping default (PATH NOT TAKEN)

```bash
#!/usr/bin/env bash
# 03 — M-3: prove the merge queue actually works before flipping the default
# branch. Opens a trivial PR into staging, enables auto-merge, and tells you
# what to watch. If the queue deadlocks (no merge_group CI run) → STOP, do NOT
# run 04; disable the queue (rollback) and investigate.
set -euo pipefail
REPO="Yhooi2/rules-as-tests-aif"
WORK="$(mktemp -d)/mq-dryrun"

echo "=== cloning a fresh checkout for the test PR ==="
gh repo clone "$REPO" "$WORK" -- --depth 1 --branch staging >/dev/null 2>&1
cd "$WORK"
git checkout -b test/mq-dry-run-$(date +%H%M%S)

# trivial, reversible change
printf '\n<!-- merge-queue dry-run %s -->\n' "$(date -u +%FT%TZ)" >> docs/meta-factory/automerge-staging-plan.md
git add docs/meta-factory/automerge-staging-plan.md
git -c commit.gpgsign=false commit -q -m "test(mq): merge-queue dry-run probe"
git push -u origin "$(git branch --show-current)" >/dev/null 2>&1
echo "✓ test branch pushed"

PR_URL=$(gh pr create --repo "$REPO" --base staging --head "$(git branch --show-current)" \
  --title "test(mq): merge-queue dry-run" \
  --body "Trivial probe to confirm merge_group CI fires + auto-merge works. Safe to close if anything looks off.")
echo "✓ PR: $PR_URL"
gh pr merge "$PR_URL" --repo "$REPO" --squash --auto >/dev/null 2>&1 && echo "✓ auto-merge enabled" || echo "⚠ could not enable auto-merge — enable it in the PR UI"

cat <<EOF

=== WATCH (this is the actual verification) ===
1. Open the Actions tab: https://github.com/$REPO/actions
2. You should see an 'audit-self' run triggered by event = merge_group,
   on a ref like  gh-readonly-queue/staging/...
3. ci-success goes green on that queue ref → the PR auto-merges into staging.

GOOD  → queue works. Proceed: ./04-switch-default.sh
BAD   → PR sits "In merge queue" with NO merge_group run after ~2 min = deadlock.
        STOP. Do NOT run 04. Rollback: disable "Require merge queue" in
        https://github.com/$REPO/settings/branches , then close the PR.

(temp checkout left at: $WORK — delete when done: rm -rf "$WORK")
EOF
```

### 04-switch-default.sh — M-4: the big switch (staging → GitHub default branch)

```bash
#!/usr/bin/env bash
# 04 — M-4: THE BIG SWITCH. Make 'staging' the GitHub default branch.
# Run ONLY after 03-dry-run proved the queue works.
# Easily reversible (revert command printed at the end).
set -euo pipefail
REPO="Yhooi2/rules-as-tests-aif"

cur=$(gh api repos/$REPO --jq .default_branch)
echo "current default branch: $cur"
if [ "$cur" = "staging" ]; then echo "✓ already staging — nothing to do"; exit 0; fi

read -rp "Type 'switch' to set default branch → staging: " ans
[ "$ans" = "switch" ] || { echo "aborted (no change)"; exit 1; }

gh api -X PATCH repos/$REPO -f default_branch=staging >/dev/null
new=$(gh api repos/$REPO --jq .default_branch)
if [ "$new" = "staging" ]; then
  echo "✅ default branch is now: $new"
  echo "   Next: ./06-doc-live.sh   (mark the plan doc LIVE)"
  echo "   Resume your paused parallel sessions AFTER 06."
else
  echo "❌ switch did not take (still $new) — check permissions / try the UI:"
  echo "   https://github.com/$REPO/settings"
  exit 1
fi
echo
echo "ROLLBACK (if anything misbehaves): gh api -X PATCH repos/$REPO -f default_branch=main"
```

### 06-doc-live.sh — M-6: reconcile the plan doc Status → LIVE (after the steps are actually done)

```bash
#!/usr/bin/env bash
# 06 — M-6: flip the plan doc's Status from "MIGRATION IN PROGRESS" → LIVE,
# now that the state is actually true. Opens a small PR into staging (goes
# through the merge queue, so it also re-exercises it).
set -euo pipefail
REPO="Yhooi2/rules-as-tests-aif"
DOC="docs/meta-factory/automerge-staging-plan.md"
WORK="$(mktemp -d)/doc-live"

gh repo clone "$REPO" "$WORK" -- --depth 1 --branch staging >/dev/null 2>&1
cd "$WORK"
git checkout -b chore/automerge-plan-live

grep -q '^> \*\*Status:\*\*' "$DOC" || { echo "❌ Status line not found in $DOC"; exit 1; }

# Replace the whole Status line with the LIVE one.
NEW_STATUS='> **Status:** **LIVE** (staging-as-trunk, '"$(date +%Y-%m-%d)"'). `staging` is the trunk and GitHub default branch with Merge Queue enabled; `main` is prod-promotion-only (receives from staging by manual fast-forward). `ci-success` is the sole required check on both. git-safety.sh push-block inverted (staging pushable, main blocked).'
# portable in-place sed (BSD + GNU): rewrite the matching line
tmp=$(mktemp)
awk -v repl="$NEW_STATUS" '/^> \*\*Status:\*\*/{print repl; next} {print}' "$DOC" > "$tmp" && mv "$tmp" "$DOC"
echo "✓ Status line set to LIVE"

git add "$DOC"
git -c commit.gpgsign=false commit -q -m "docs(meta-factory): automerge-staging-plan Status → LIVE (migration complete)"
git push -u origin chore/automerge-plan-live >/dev/null 2>&1

PR_URL=$(gh pr create --repo "$REPO" --base staging --head chore/automerge-plan-live \
  --title "docs: automerge-staging-plan Status → LIVE" \
  --body "Migration complete (M-1..M-4 done): flip the plan doc Status from MIGRATION IN PROGRESS to LIVE so it states only what is now true.")
echo "✓ PR: $PR_URL"
gh pr merge "$PR_URL" --repo "$REPO" --squash --auto >/dev/null 2>&1 && echo "✓ auto-merge enabled (lands via queue)" || echo "⚠ enable merge in the PR UI"

echo "✅ M-6 queued. Migration done once this merges. Temp: $WORK (rm -rf when done)"
```

### 07-disable-strict.sh — the merge-queue SUBSTITUTE that actually shipped

```bash
#!/usr/bin/env bash
# 07 — merge-queue substitute: turn OFF "Require branches to be up to date"
# (the strict flag) on staging, so parallel PRs auto-merge on green ci-success
# WITHOUT stalling in BEHIND. Keeps ci-success required. main is untouched.
#
# Why: GitHub merge queue isn't configurable on this repo (REST API 422s on
# merge_queue, UI lacks the toggle). Disabling strict is the working substitute
# for the "unattended overnight auto-merge" goal. Trade-off: a PR may merge
# tested against a slightly older staging (small integration risk; ci-success
# still runs per PR; main is promoted manually so issues are caught pre-prod).
set -euo pipefail
REPO="Yhooi2/rules-as-tests-aif"

echo "=== BEFORE (staging required_status_checks) ==="
gh api "repos/$REPO/branches/staging/protection/required_status_checks" --jq '{strict, contexts}'

echo "=== disabling strict (keep ci-success required) ==="
gh api -X PATCH "repos/$REPO/branches/staging/protection/required_status_checks" --input - <<'JSON'
{"strict": false, "contexts": ["ci-success"]}
JSON

echo "=== AFTER ==="
result=$(gh api "repos/$REPO/branches/staging/protection/required_status_checks" --jq '{strict, contexts}')
echo "$result"
echo
if echo "$result" | grep -q '"strict": *false' && echo "$result" | grep -q 'ci-success'; then
  echo "✅ done — strict=false, ci-success still required."
  echo "   Parallel PRs now auto-merge on green without BEHIND stalls."
  echo "   main is unchanged (still strict + protected)."
else
  echo "⚠️  unexpected result above — send it to me before relying on it."
fi
```

## §5 — Rollback summary (as designed)

- **Default-branch flip:** `gh api -X PATCH repos/Yhooi2/rules-as-tests-aif -f default_branch=main`.
- **git-safety patch:** `01` auto-restores from its timestamped backup on verify failure; manual restore = `cp ~/.claude/hooks/git-safety.sh.bak.<ts> ~/.claude/hooks/git-safety.sh`.
- **Queue (if it had been used):** disable "Require merge queue" in branch settings, close the probe PR.
- **strict flag:** re-PATCH `required_status_checks` with `{"strict": true, "contexts": ["ci-success"]}`.

## §6 — Tags

`#staging-trunk-migration` `#runbook-residue` `#documents-lie-self-application` `#worker-self-marking-go` `#merge-queue-not-configurable` `#preserve-unique-residue`

## See also

- [automerge-staging-plan.md](../automerge-staging-plan.md) — committed SSOT for the live topology (this patch is residue, not the live record).
- [ai-laziness-traps.md §2 T17/T18/T19](../../../.claude/rules/ai-laziness-traps.md) — preserve-before-destructive / preserve-unique-residue / own-QA-before-handoff disciplines this patch enacts.
- [README.md#why-this-exists](../../../README.md#why-this-exists) — the "documents lie; tests don't" thesis the §3 doc-accuracy fix instantiates.
