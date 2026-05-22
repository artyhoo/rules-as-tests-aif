<!-- scope: automerge→staging operational plan, branching flow + maintainer settings recipe -->
# Automerge → staging integration plan

> **Status:** **LIVE** (2026-05-22). `staging` branch created; `staging` + `main` branch-protected (required check **`ci-success`** only — it `needs:`-aggregates actionlint + zizmor after they were moved into `audit-self.yml`; `strict: true`); repo auto-merge enabled. Code prerequisites merged (#121/#123/#125). Required-context fix: see §6 item 2.
> **Authoritative for:** the automerge→staging operational plan — the branching flow (§2.1), decided shape, the maintainer GitHub-settings recipe (applied), and the open sub-decisions. Supersedes the `open-questions.md §13.40` placeholder home (open-questions hit its 500-line pre-commit cap; a dedicated plan doc fits better than the open-question registry).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The CI-backstop mechanism it depends on — see [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) and the `pr-commit-trailers` job in [.github/workflows/audit-self.yml](../../.github/workflows/audit-self.yml).

## §1 Goal

The maintainer can leave the computer ~3 hours and PRs keep merging without him — into a long-lived **staging** integration branch, **not** `main`. The maintainer later merges `staging → main` himself as a ship/no-ship **decision / circuit-breaker** — explicitly NOT "human verifies the AI". The AI must have fully self-verified + re-tested everything into staging first (the human click is a decision where there is no clear unambiguous best, not a QA pass).

## §2 Decided shape

- **Target:** sub-PRs auto-merge into a long-lived `staging` branch; never directly into `main`.
- **Mechanism — variant A:** GitHub **native auto-merge** (`--auto`) gated on green CI. No LLM, no paid runtime → respects [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md). (Variant B = live-session preverify-then-CI, weaker; variant C = autonomous paid agent, needs explicit policy exception — both rejected.)
- **Human gate:** maintainer reviews staging and merges `staging → main` manually.

## §2.1 Branching flow (the discipline)

```text
main (source of truth, human-blessed) ──┐
   │  branch every feature/sub-PR FROM main
   ▼
feature/* ──auto-merge on green CI──▶ staging (disposable review buffer)
                                        │  maintainer reviews the batch
                                        ▼  ── merges staging → main (decision)
                                       main
                                        │  ── RESYNC: fast-forward staging to main
                                        ▼
                                     staging == main  (drift reset to zero)
```

**Always branch FROM `main`, auto-merge INTO `staging`.** This is deliberate and correct *for this model*, even though the usual git rule is "branch from the branch you merge into":

- `main` is the **source of truth** — the last state a human blessed. `staging` is a **disposable buffer** that, by design, holds *un-reviewed* auto-merged work.
- Branching from `main` anchors every PR to blessed code, **not** to a pile of unverified auto-merges. Building new work on top of unverified work is the thing to avoid.
- Inter-PR conflicts (two PRs off `main` touching the same file, each green alone) surface **in the buffer**, not in `main`, because `staging` protection sets `strict: true` (require branches up to date) — the second PR is forced to update and the conflict shows there.

**Load-bearing discipline — RESYNC.** After every `staging → main` promotion, fast-forward `staging` back to `main` so `staging ≈ main` at all times:

```bash
git push origin origin/main:staging   # clean ff; staging has no unique commits post-promotion
```

This is what keeps `staging` a *disposable buffer* rather than silently becoming a divergent long-lived `develop`. **If `staging` is allowed to drift from `main` for days/weeks, this whole model degrades** (integration problems pile up and hit `main` in bulk at promotion). Promote + resync frequently — ideally after each walk-away session.

**Everything routine goes through `staging` — including single small changes.** The binding cost is *maintainer clicks*, not git mechanics: a PR straight to `main` is owner-only, so it forces a **manual merge click every time** — exactly the toil this flow removes. A PR to `staging` **auto-merges on green CI (zero clicks)** and the maintainer clicks once per batch at `staging → main`. So "branch from main → staging" is the default for all routine work; **direct-to-`main` is reserved for owner-initiated urgent hotfixes** (which the owner merges themselves anyway).

> **Dependency for true zero-click walk-away:** the agent must be able to set `gh pr merge --auto` on a `staging`-targeted PR (auto-merge fires only on green required checks → safe; never touches `main`). The current `git-safety` hook allows agent merges only for `feat → epic/ID-*` and blocks `gh pr merge` to `staging`/`main` — so until it is relaxed to permit `gh pr merge --auto --base staging`, the maintainer still enables auto-merge per PR. Relaxing it is a maintainer edit (`.claude/hooks/git-safety.sh` is agent-denied). This is the actual lever for "0 involvement", not the branching choice.

## §3 Prerequisite status — CI-backstop (DONE)

The hard blocker was: §1.7 / Prior-art / test gates ran only in `.husky/pre-push`, so "CI green" ≠ "verified" until they were mirrored into CI deterministically. Closed:

| PR | What it added | State |
|---|---|---|
| **#121** | `pr-commit-trailers` job in [audit-self.yml](../../.github/workflows/audit-self.yml) — runs §1.7 + §7 over the real PR commit range via the `PREPUSH_ONLY` seam; §1.7 hard-enforced, §7 base blocks, §7 substance warn-only (Option B). | MERGED |
| **#123** | Parameterised the diff base via `PREPUSH_UPSTREAM_REF` so the backstop gates PRs targeting a **non-main base** (PRs → `staging`), not only `origin/main`. Paired-negative: [tests/hooks/prepush-upstream-ref.test.sh](../../tests/hooks/prepush-upstream-ref.test.sh). | MERGED |
| **#125** | Real `ci-success` aggregate job (`needs:` every audit-self PR job) so branch protection can require one context. Gate logic: [scripts/ci-success-gate.sh](../../scripts/ci-success-gate.sh), paired-negative [scripts/ci-success-gate.test.sh](../../scripts/ci-success-gate.test.sh). | MERGED |

So a sub-PR → `staging` is re-checked at merge time against `staging` even if its push bypassed pre-push. The deterministic gate is real, which is what makes auto-merge safe.

## §4 Phased plan

0. **CI-backstop** — DONE (§3).
1. **`staging` branch + branch protection + repo auto-merge** — DONE (2026-05-22, recipe §5).
2. **Orchestrator flow:** sub-PRs target `staging` (branched from `main`, §2.1); the AI sets `gh pr merge --auto <PR>`; PRs merge on green while the maintainer is away; the AI posts a plain-language report (what merged / what it verified / gaps & why).
3. **Decision gate:** maintainer reviews `staging`, merges `staging → main` manually, then **resyncs** `staging` to `main` (§2.1).
4. **(Optional, later)** automate `staging → main` once trust is established — higher blast radius (production), out of scope now.

## §5 Maintainer settings recipe (APPLIED 2026-05-22)

Done; kept for reference / re-provisioning. `{owner}/{repo}` = `Yhooi2/rules-as-tests-aif`.

```bash
# 1. staging branch off main.
git fetch origin && git branch staging origin/main && git push -u origin staging

# 2. repo auto-merge.
gh api -X PATCH repos/{owner}/{repo} -F allow_auto_merge=true

# 3. protect staging — require ONLY the real ci-success aggregate (#125).
#    actionlint + zizmor now live in audit-self.yml and are needs:-aggregated by
#    ci-success, so it gates them too (they no longer need separate required
#    contexts). Requiring path-filtered contexts directly deadlocks PRs that don't
#    touch their paths — the bug fixed by moving them under ci-success.
gh api -X PUT repos/{owner}/{repo}/branches/staging/protection --input - <<'JSON'
{"required_status_checks":{"strict":true,"contexts":["ci-success"]},"enforce_admins":false,"required_pull_request_reviews":null,"restrictions":null}
JSON

# 4. protect main — owner-only merges. On this single-owner repo, owner-only =
#    PR required + green checks + sole-owner write + the git-safety hook blocking
#    agent merges to main. (`restrictions` push allow-list is org-only.)
gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'JSON'
{"required_status_checks":{"strict":true,"contexts":["ci-success"]},"enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":0},"restrictions":null}
JSON
```

Per sub-PR (agent-side, while the maintainer is away):

```bash
gh pr create --base staging --head <feature-branch-off-main> ...
gh pr merge --auto --squash <PR>     # merges when CI goes green
```

## §6 Open sub-decisions (maintainer sign-off)

1. **Branch name / reuse of the epic flow.** This plan uses a long-lived `staging`. The project also has an `epic/ID-<digits>-<topic>` flow where the *agent* merges sub-PRs into a per-umbrella epic branch (circuit-breaker at `epic→main`). Distinct mechanisms. Decide: keep separate, or fold one into the other. _(Open.)_
2. ~~Required-check contexts.~~ **RESOLVED 2026-05-22** — real `ci-success` aggregate shipped (#125). Initial config required `ci-success` + `actionlint` + `zizmor`, but the two linters were path-filtered → they never reported on non-workflow PRs → deadlock. Fixed by moving actionlint + zizmor into `audit-self.yml` under `ci-success`'s `needs:`; `staging`+`main` now require **only `ci-success`** (it gates the linters transitively). Maintainer-side settings update: re-run the `gh api ... protection` calls above with the single-context payload.
3. **Squash vs merge-commit** into staging — affects how `pr-commit-trailers` sees the range on the eventual `staging→main` PR. Squash recommended (one clean commit per sub-PR). _(Open — low stakes.)_

## §7 Cross-references

- [.github/workflows/audit-self.yml](../../.github/workflows/audit-self.yml) — `pr-commit-trailers` + `ci-success` jobs.
- [scripts/ci-success-gate.sh](../../scripts/ci-success-gate.sh) — aggregate gate logic (paired-negative tested).
- [tests/hooks/prepush-upstream-ref.test.sh](../../tests/hooks/prepush-upstream-ref.test.sh) — non-main-base backstop paired-negative.
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — why variant A (native auto-merge), not an autonomous paid agent.
- [.github/workflows/workflow-integrity.yml](../../.github/workflows/workflow-integrity.yml) — `ci-success` required-check assertion.
