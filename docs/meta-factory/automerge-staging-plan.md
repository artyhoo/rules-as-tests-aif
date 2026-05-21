<!-- scope: automerge→staging operational plan + maintainer settings recipe -->
# Automerge → staging integration plan

> **Status:** PLANNED. Code prerequisites **DONE** (2026-05-22); remaining work is maintainer-side GitHub settings + the orchestrator flow.
> **Authoritative for:** the automerge→staging operational plan — decided shape, phased rollout, the maintainer GitHub-settings recipe, and the open sub-decisions. Supersedes the `open-questions.md §13.40` placeholder home (open-questions hit its 500-line pre-commit cap and no §13.x was cleanly terminal to archive; a dedicated multi-phase plan doc is the better fit than the open-question registry).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The CI-backstop mechanism it depends on — see [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) and the `pr-commit-trailers` job in [.github/workflows/audit-self.yml](../../.github/workflows/audit-self.yml).

## §1 Goal

The maintainer can leave the computer ~3 hours and PRs keep merging without him — into a long-lived **staging** integration branch, **not** `main`. The maintainer later merges `staging → main` himself as a ship/no-ship **decision / circuit-breaker** — explicitly NOT "human verifies the AI". The AI must have fully self-verified + re-tested everything into staging first (the human click is a decision where there is no clear unambiguous best, not a QA pass).

## §2 Decided shape

- **Target:** sub-PRs auto-merge into a long-lived `staging` branch; never directly into `main`.
- **Mechanism — variant A:** GitHub **native auto-merge** (`gh pr merge --auto`) gated on green CI. No LLM, no paid runtime → respects [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md). (Variant B = live-session preverify-then-CI, weaker; variant C = autonomous paid agent, needs explicit policy exception — both rejected.)
- **Human gate:** maintainer reviews staging and merges `staging → main` manually.

## §3 Prerequisite status — CI-backstop (DONE)

The hard blocker was: today's §1.7 / Prior-art / test gates ran only in `.husky/pre-push`, so "CI green" ≠ "verified" until they were mirrored into CI deterministically. Without that, auto-merge could land work the local hook would have blocked (the hook-bypass hole).

This is now closed:

| PR | What it added | State |
|---|---|---|
| **#121** | `pr-commit-trailers` job in [audit-self.yml](../../.github/workflows/audit-self.yml) — runs §1.7 + §7 over the real PR commit range via the `PREPUSH_ONLY` seam; §1.7 hard-enforced, §7 base blocks, §7 substance warn-only (Option B). | MERGED |
| **#123** | Parameterised the diff base via `PREPUSH_UPSTREAM_REF` so the backstop gates PRs targeting a **non-main base** (i.e. PRs → `staging`), not only `origin/main`. Paired-negative: [tests/hooks/prepush-upstream-ref.test.sh](../../tests/hooks/prepush-upstream-ref.test.sh). | MERGED |

So a sub-PR → `staging` is now re-checked at merge time against `staging` even if its push bypassed pre-push. The deterministic gate is real, which is what makes auto-merge safe.

## §4 Phased plan

0. **CI-backstop** — DONE (§3).
1. **Create the `staging` branch + branch protection** requiring the same status checks `main` requires (the `ci-success` set per [workflow-integrity.yml](../../.github/workflows/workflow-integrity.yml)); enable repo-level auto-merge. ⚠ **Maintainer-side** — branch protection / rulesets are GitHub settings the agent cannot set (`settings.json` is agent-uncommittable). Recipe in §5.
2. **Orchestrator flow:** sub-PRs target `staging`; the AI sets `gh pr merge --auto <PR>`; PRs merge on green while the maintainer is away; the AI posts a plain-language report (what merged / what it verified / gaps & why).
3. **Decision gate:** maintainer reviews `staging`, merges `staging → main` manually.
4. **(Optional, later)** automate `staging → main` once trust is established — higher blast radius (production), out of scope now.

## §5 Maintainer settings recipe

Run once, by the maintainer (these touch branch protection / repo settings — not agent-committable):

```bash
# 1. Create the long-lived staging branch off main.
git fetch origin
git branch staging origin/main
git push -u origin staging

# 2. Enable repo-level auto-merge (Settings → General → "Allow auto-merge",
#    or via API):
gh api -X PATCH repos/{owner}/{repo} -F allow_auto_merge=true

# 3. Protect staging: require the same status checks as main, require branches
#    up to date. Replace the contexts list with main's required set
#    (gh api repos/{owner}/{repo}/branches/main/protection to read it).
gh api -X PUT repos/{owner}/{repo}/branches/staging/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci-success"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

> The `contexts` array must list the actual required-check names. The repo currently expresses the required set as the `ci-success` context (asserted on `main` by [workflow-integrity.yml](../../.github/workflows/workflow-integrity.yml) lines ~78). Confirm whether `ci-success` is a real aggregate job or a placeholder before relying on it for staging (see §6 open sub-decision 2).

Then, per sub-PR (agent-side, while the maintainer is away):

```bash
gh pr create --base staging --head <feature-branch> ...
gh pr merge --auto --squash <PR>     # merges when CI goes green
```

## §6 Open sub-decisions (maintainer sign-off)

1. **Branch name / reuse of the epic flow.** This plan uses a long-lived `staging`. The project also has an `epic/ID-<digits>-<topic>` integration flow where the *agent* merges sub-PRs into a per-umbrella epic branch (circuit-breaker at `epic→main`). These are distinct mechanisms (native auto-merge into long-lived `staging` vs agent-merge into per-epic branch). Decision needed: keep them separate, or make per-epic branches the auto-merge target instead of one long-lived `staging`.
2. **Required-check contexts.** §5 assumes a working `ci-success` aggregate. There is no job literally named `ci-success` in the workflows — it is a context name referenced by branch protection. Confirm the exact set of job contexts `staging` should require (e.g. the `audit-self` jobs incl. `pr-commit-trailers`, `discipline-self-check`, `workflow-integrity`, `framework-self-template-render`).
3. **Squash vs merge-commit** into staging (affects how `pr-commit-trailers` sees the range on the eventual `staging→main` PR).

## §7 Cross-references

- [.github/workflows/audit-self.yml](../../.github/workflows/audit-self.yml) — `pr-commit-trailers` job (the deterministic gate this plan relies on).
- [tests/hooks/prepush-upstream-ref.test.sh](../../tests/hooks/prepush-upstream-ref.test.sh) — paired-negative for the non-main-base support.
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — why variant A (native auto-merge) and not an autonomous paid agent.
- [.github/workflows/workflow-integrity.yml](../../.github/workflows/workflow-integrity.yml) — `ci-success` required-check assertion (the model staging protection mirrors).
