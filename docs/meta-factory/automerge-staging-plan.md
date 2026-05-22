<!-- scope: automerge→staging operational plan, branching flow + maintainer settings recipe -->
# Automerge → staging integration plan

> **Status:** **LIVE** (staging-as-trunk, 2026-05-22). `staging` is the trunk + GitHub default branch — all work auto-merges into it via PR on green `ci-success`. `main` is prod-promotion-only (manual fast-forward; direct push blocked). `ci-success` is the sole required check on both. git-safety.sh push-block inverted (staging pushable, main blocked). **Merge queue: DEFERRED** — not configurable on this repo (REST API 422s on `merge_queue`; toggle absent in branch-protection + rulesets UI). The unattended-parallel-merge goal is met instead by disabling strict "require up-to-date" on `staging`; `main` stays strict + protected.
> **Authoritative for:** the automerge→staging operational plan — the branching flow (§2.1), decided shape, the maintainer GitHub-settings recipe (applied), and the open sub-decisions.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The CI-backstop mechanism it depends on — see [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) and the `pr-commit-trailers` job in [.github/workflows/audit-self.yml](../../.github/workflows/audit-self.yml).

## §1 Goal

The maintainer can leave the computer ~3 hours and PRs keep merging without him — into the permanent `staging` trunk via GitHub Merge Queue, **not** `main`. The maintainer later promotes `staging → main` himself as a ship/no-ship **decision** (the "prod deploy") — explicitly NOT "human verifies the AI". The AI must have fully self-verified + re-tested everything before staging merge; the human click is a decision, not a QA pass.

## §2 Decided shape

- **Target:** sub-PRs auto-merge into the `staging` trunk via GitHub Merge Queue. `staging` is the permanent default branch; `main` is prod-only.
- **Mechanism — variant A + Merge Queue:** GitHub **native Merge Queue** (`--auto` enqueues) gated on green `ci-success`. Each PR is tested against the real future trunk state (queue's temporary group ref), preventing two parallel PRs from each passing CI alone but conflicting on merge. No LLM, no paid runtime → respects [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md). (Variant B = live-session preverify, weaker; variant C = autonomous paid agent, needs explicit policy exception — both rejected.)
- **Human gate:** maintainer promotes `staging → main` manually (prod deployment decision).

## §2.1 Branching flow (the discipline)

```text
staging (permanent trunk, default branch) ──┐
   │  branch every feature/sub-PR FROM staging
   ▼
feature/* ──Merge Queue on green CI──▶ staging
                                        │  maintainer decides to ship
                                        ▼  ── promotes staging → main (prod deploy)
                                       main (prod snapshot)
```

**Always branch FROM `staging`, merge INTO `staging` via Merge Queue.** This is the standard trunk-based development discipline:

- `staging` is the **permanent trunk** — the active integration branch holding all CI-verified work. `main` is the **prod snapshot** — a downstream release pointer that receives only from `staging` via manual promotion.
- Branching from `staging` anchors every PR to the latest verified work, prevents integration debt from piling up, and lets the Merge Queue correctly test each PR against the real future trunk state (all preceding queued PRs included).
- The Merge Queue handles serialisation: multiple parallel AI sessions each call `gh pr merge --auto` on their respective PRs; the queue tests them in FIFO order (possibly batched) and merges only when CI passes on the combined group ref.

**RESYNC is retired.** In the old model, a RESYNC step (`git push origin origin/main:staging`) was needed to prevent `staging` from becoming a divergent develop branch. In the new model, `main` is strictly downstream of `staging` — it only ever receives promotions FROM `staging`. `main` never leads `staging`. After a staging→main promotion, `main` ≈ `staging` (it is the ff from staging). No resync needed; no drift possible (main can never be ahead of staging).

**Everything routine goes through `staging` — including single small changes.** A PR straight to `main` requires a manual merge click (owner-only). A PR to `staging` via Merge Queue auto-merges on green CI (zero clicks after `gh pr merge --auto`). The maintainer clicks once per batch at `staging → main`. Single small changes: use `staging` as the base and target.

**For overnight parallel AI sessions:**
```bash
# Each AI session:
git checkout -b feat/my-task origin/staging   # branch FROM staging (the trunk)
# ... make changes, commit ...
git push origin feat/my-task
gh pr create --base staging --head feat/my-task --title "..."
gh pr merge --auto --squash   # enqueues; queue handles merge when CI green
```

Multiple sessions can call `gh pr merge --auto` simultaneously.

### Parallel-sessions discipline (merge-queue is necessary, NOT sufficient)

The Merge Queue solves **ordering**, not **content**. There are two distinct failure modes for N parallel overnight sessions, and the queue only handles one of them:

- **(a) Stale-base / ordering churn — SOLVED by the queue.** With `strict:true` branch protection alone, every open PR goes out-of-date the moment another merges (→ manual `gh pr update-branch` + CI re-run per PR; with N sessions this thrashes and BLOCKS unattended — empirically reproduced: PR #140 returned "head branch is not up to date with the base"). The Merge Queue eliminates this: it auto-updates each PR against the live trunk, re-tests against the combined group ref, and merges in FIFO order with no manual step.
- **(b) True content conflicts — NOT solved by any tool.** Two sessions editing the **same lines** produce a real conflict. The queue does **not** auto-resolve this — it **REJECTS** the conflicting PR and drops it from the queue. No merge-bot exists that resolves semantic content conflicts.

**Therefore: the orchestrator dispatching N overnight sessions MUST partition their file scopes** — each session gets a **disjoint set of files** (the file-lock matrix), per [`parallel-subwave-isolation.md`](../../.claude/rules/parallel-subwave-isolation.md). Merge-queue + auto-merge gives "unattended, main green, no ordering thrash"; **file-scope partitioning** gives "no rejected PRs from content conflicts". Both are required for the overnight-parallel goal — the queue alone is not enough.

**The `git-safety` hook (user-global `~/.claude/hooks/git-safety.sh`):**
- `git push origin staging` — **allowed** (staging is the trunk; pushing feature-branch setup tracking refs is the normal workflow)
- `git push origin main` — **blocked** (prod-only; promotion is via PR, maintainer-only)
- `gh pr merge --auto` on a `staging`-targeted PR — **allowed** (`:83` gate permits `base=staging`)
- `gh pr merge` on a `main`-targeted PR — **blocked for agents** (`:83` gate; `main` in `прочее`, maintainer-only)

## §3 Prerequisite status — CI-backstop (DONE)

The hard blocker was: §1.7 / Prior-art / test gates ran only in `.husky/pre-push`, so "CI green" ≠ "verified" until they were mirrored into CI deterministically. Closed:

| PR | What it added | State |
|---|---|---|
| **#121** | `pr-commit-trailers` job in [audit-self.yml](../../.github/workflows/audit-self.yml) — runs §1.7 + §7 over the real PR commit range via the `PREPUSH_ONLY` seam; §1.7 hard-enforced, §7 base blocks, §7 substance warn-only (Option B). | MERGED |
| **#123** | Parameterised the diff base via `PREPUSH_UPSTREAM_REF` so the backstop gates PRs targeting a **non-main base** (PRs → `staging`), not only `origin/main`. | MERGED |
| **#125** | Real `ci-success` aggregate job (`needs:` every audit-self PR job) so branch protection can require one context. | MERGED |
| **feat/staging-trunk-migration** | `merge_group` trigger in `audit-self.yml` (DAY-1 prerequisite for Merge Queue); push-trigger extensions to `staging`; R11 assertion repointed from `main` → `staging`; pre-push default refs flipped to `origin/staging`; this doc rewritten for new topology. | MERGED |

The CI backstop is already correctly parameterised to `origin/${{ github.base_ref }}` — so staging-targeted PRs are checked against `origin/staging` automatically. No additional backstop changes needed.

## §4 Phased plan

0. **CI-backstop** — DONE (§3).
1. **`staging` branch + branch protection + repo auto-merge** — DONE (2026-05-22, recipe §5).
2. **`merge_group` trigger + push-trigger extensions + R11 repoint** — DONE (feat/staging-trunk-migration, §3).
3. **Merge Queue enabled on `staging`** — DONE or IN PROGRESS per migration runbook.
4. **Default-branch switch to `staging`** — DONE or IN PROGRESS per migration runbook.
5. **Orchestrator flow (fully automated):** sub-PRs target `staging` (branched FROM `staging`, §2.1); AI sets `gh pr merge --auto <PR>`; Merge Queue handles serialisation and merges on green CI; AI posts a plain-language report (what merged / what it verified / gaps & why).
6. **Decision gate:** maintainer reviews `staging` diff, promotes `staging → main` (prod deploy) manually.
7. **(Optional, later)** Automate `staging → main` once trust is established — higher blast radius (production), out of scope now.

## §5 Maintainer settings recipe (APPLIED 2026-05-22; updated for staging-as-trunk)

Reference for re-provisioning or emergency restore. `{owner}/{repo}` = `Yhooi2/rules-as-tests-aif`.

```bash
# 1. Ensure staging branch exists off the current trunk.
#    (If already exists: skip. If re-provisioning from scratch:)
git fetch origin && git branch staging origin/main && git push -u origin staging

# 2. Repo auto-merge (already enabled).
gh api -X PATCH repos/{owner}/{repo} -F allow_auto_merge=true

# 3. Protect staging — permanent trunk. ci-success sole required context.
#    actionlint + zizmor aggregated under ci-success via needs: in audit-self.yml.
#    merge_group trigger in audit-self.yml feeds ci-success to the queue.
#    ATTN-B-1: add required_pull_request_reviews count=0 if maintainer opts for
#    defense-in-depth symmetry with former main protection. Below includes it.
gh api -X PUT repos/{owner}/{repo}/branches/staging/protection --input - <<'JSON'
{
  "required_status_checks": {"strict": true, "contexts": ["ci-success"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {"required_approving_review_count": 0},
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

# 4. Enable Merge Queue on staging (UI recommended; CLI may require Rulesets API):
#    Settings → Branches → staging → Edit → "Require merge queue" → Save
#    Settings: minimum=1, maximum=5-10, wait=1-2 min, "Only merge non-failing PRs" ON
#    (If using classic protection API and it supports required_merge_queue field:)
#    gh api -X PATCH repos/{owner}/{repo}/branches/staging/protection \
#      -f required_merge_queue=true

# 5. Protect main — prod-only; no direct commits; no Merge Queue.
gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": {"strict": true, "contexts": ["ci-success"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {"required_approving_review_count": 0},
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

# 6. Switch default branch to staging:
gh api -X PATCH repos/{owner}/{repo} -f default_branch=staging
# Verify:
gh api repos/{owner}/{repo} --jq '.default_branch'   # expected: staging
```

Per sub-PR (agent-side, while the maintainer is away):
```bash
git checkout -b feat/my-task origin/staging   # FROM staging (the trunk)
# ... changes ...
git push origin feat/my-task
gh pr create --base staging --head feat/my-task --title "..."
gh pr merge --auto --squash   # enqueues; Merge Queue handles the rest
```

Per staging→main promotion (maintainer, when ready to ship):
```bash
# Option A: PR-based promotion (recommended for audit trail)
gh pr create \
  --base main \
  --head staging \
  --title "chore: promote staging → main (prod deployment)" \
  --body "Promoting staging trunk to main. All commits individually verified by CI on merge."
# Review the diff (this is the decision-click)
gh pr merge --squash   # or --merge for a merge commit

# Option B: direct fast-forward push (admin bypass, for simple ff promotions)
git push --force-with-lease origin staging:main
# Note: main protection (enforce_admins: false) allows admin bypass for promotion
```

## §6 Topology decision log (history preserved)

### §6.1 Old topology (2026-05-22 → before staging-as-trunk migration)

The project ran main-as-trunk from 2026-05-22 until the staging-trunk migration:
- `main` = source of truth (branches FROM main)
- `staging` = disposable review buffer (auto-merges from feature branches; maintainer promotes staging→main manually)
- RESYNC: `git push origin origin/main:staging` after each promotion (ff staging back to main)
- CI push triggers: `branches: [main, 'chore/**']`
- R11 assertion: asserted `ci-success` on `main`

### §6.2 New topology (staging-as-trunk migration; 2026-05-22+)

See §2.1 above. Key inversions from the old model:

| Property | Old (pre-migration) | New (post-migration) |
|---|---|---|
| Default/trunk branch | `main` | `staging` |
| Feature branch source | FROM `main` | FROM `staging` |
| Prod/release branch | `main` (dual role: trunk + release) | `main` (release-only) |
| Auto-merge mechanism | `gh pr merge --auto` (direct) | `gh pr merge --auto` → Merge Queue |
| Human action framing | Circuit-breaker merge | Prod-deploy decision |
| RESYNC discipline | Required (staging← main after promotion) | **Retired** (main only ff-from-staging) |
| CI push trigger | `branches: [main, 'chore/**']` | `branches: [staging, main, 'chore/**']` |
| R11 assertion target | `main` branch protection | `staging` branch protection |
| `merge_group` trigger | ABSENT | PRESENT in `audit-self.yml` |

### §6.3 Open sub-decisions (updated)

1. **Epic/ID-* flow in the new topology.** Feature and epic branches should now be cut FROM `staging` (not `main`). The git-safety.sh merge gate :83 already allows `base=staging` and `base=epic/ID-*`. Epic→staging continues to work. Orchestrator BASE_BRANCH discovery will find `staging` automatically. _(No code change needed; topology auto-corrects via discovery.)_
2. **Squash vs merge-commit** into staging — affects how `pr-commit-trailers` sees the range on the eventual `staging→main` PR. Squash recommended (one clean commit per sub-PR). _(Open — low stakes.)_
3. **README badge `?branch=main`** — three badges in README.md:4–6 still use `?branch=main`. After staging becomes the trunk, consider updating to `?branch=staging`. _(Maintainer decision — see ATTN-4 in migration runbook.)_
4. **`packages/core/templates/shared/integration-rules.md:31`** — "merge to main" consumer-facing phrase. Verify whether this refers to the consumer's own trunk (keep as-is) or should say "default branch". T-Migrate-A: do not auto-flip. _(Verify-with-maintainer — VM-01.)_

## §7 Cross-references

- [.github/workflows/audit-self.yml](../../.github/workflows/audit-self.yml) — `pr-commit-trailers` + `ci-success` + `merge_group` trigger (added by feat/staging-trunk-migration).
- [scripts/ci-success-gate.sh](../../scripts/ci-success-gate.sh) — aggregate gate logic (paired-negative tested).
- [tests/hooks/prepush-upstream-ref.test.sh](../../tests/hooks/prepush-upstream-ref.test.sh) — non-main-base backstop paired-negative.
- [.github/workflows/workflow-integrity.yml](../../.github/workflows/workflow-integrity.yml) — R11 `ci-success` required-check assertion (now targets `staging`).
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — why variant A (native auto-merge + Merge Queue), not an autonomous paid agent.
- [docs/meta-factory/closed-questions.md](../../docs/meta-factory/closed-questions.md) — §13.40 placeholder (superseded by this doc; open-questions hit 500-line cap).

<!-- merge-queue dry-run 2026-05-22T14:22:33Z -->
