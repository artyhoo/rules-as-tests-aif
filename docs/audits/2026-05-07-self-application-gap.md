# Self-application gap — framework doesn't enforce its own rules locally

> Discovered: 2026-05-07 during PR #1 (umbrella `feat/audit-fixes-2026-05`).
> Severity: BLOCKER (philosophical) / MAJOR (practical).
> Status: OPEN — separate follow-up umbrella required.

## What happened

While shipping the workflow-integrity workflow (R11 executable check), it failed three times on its own first PR run with a cumulative ~16 zizmor findings, only catchable on CI. The author had not run `zizmor` or `actionlint` locally before pushing — neither tool is part of the framework's own pre-commit/pre-push tooling.

Each fix landed via push → fail → diagnose → fix → push, instead of fail-fast locally. That is exactly the antipattern this framework declares it solves for consumers.

## The contradiction

Framework's central thesis (from `skills/rules-as-tests/SKILL.md`):

> Documents lie; tests don't. Every rule is an executable test that fails the build when violated.

In `templates/shared/husky-pre-commit.sh` and `templates/shared/husky-pre-push.sh`, the framework ships pre-commit/pre-push hooks **for consumer projects**. These hooks run `eslint`, `tsc`, `vitest related <changed>`, etc. on changed files.

But this repo — the framework itself — has **no** `.husky/`, no pre-commit, no pre-push, no equivalent local enforcement. The framework preaches but does not practice.

## Concrete gaps

| What the framework enforces in consumer repos | Equivalent in this repo |
|---|---|
| `husky-pre-commit.sh` runs `tsc --noEmit` on changed `.ts` | None |
| `husky-pre-commit.sh` runs `eslint <changed>` | None |
| `husky-pre-push.sh` runs `vitest related <changed>` | None |
| R11 — `actionlint` on `.github/workflows/**` | Only on CI (post-push) |
| R11 — `zizmor` on `.github/workflows/**` | Only on CI (post-push) |
| R2-style spec discipline (no fabricated SHAs) | Manual; multiple violations during PR #1 |
| Markdown size ≤500 lines | On CI only; no pre-commit gate |
| Dead-link check | On CI only |

## Specific violations from PR #1 timeline

1. `batch-D.md` spec contained a fabricated SHA for `rhysd/actionlint@4dde6cc...` (which was both wrong-SHA and a non-existent action — `rhysd/actionlint` has no `action.yml`). Caught only by IDE diagnostic after merge of batch D, not by any spec-validation step.
2. `workflow-integrity.yml` shipped with 16 zizmor findings (5 suppressed, 11 medium). Caught only by the workflow itself running on CI for the first time.
3. `audit-self.yml` had 6 unpinned actions (`@v4` tags) and 0 explicit `permissions:` blocks. Pre-existing; never blocked any PR before because no local check existed.

## Proposed follow-up umbrella: `chore/self-application`

### Phase 1 — Pre-commit guard

1. Add `.husky/pre-commit` running:
   - `bash -n` on every changed `*.sh`
   - `python3 -c "yaml.safe_load(...)"` on every changed `*.yml` and `*.yaml`
   - `python3 -c "json.load(...)"` on every changed `*.json`
   - Markdown size cap (≤500 lines) on every changed `*.md`
2. Add `.husky/pre-push` running:
   - `actionlint .github/workflows/*.yml` (install via brew/curl in setup if missing)
   - `zizmor --format plain .github/workflows/` (install via `pip install zizmor` if missing)
   - `bash tests/audit/audit-ai-docs.test.sh`
3. Document install in `CONTRIBUTING.md` (new file).

### Phase 2 — Spec validation

1. Add `scripts/validate-batch-spec.ts`: lint `.claude/orchestrator-prompts/**/*.md` for:
   - Fabricated SHAs (any `@[a-f0-9]{40}` claim must be verified against a known whitelist OR via `gh api` at lint time).
   - Non-existent action repos (`uses:` references must exist with `action.yml` at the pinned ref).
2. Wire into `.husky/pre-commit` if the changed files include `*.md` under orchestrator-prompts.

### Phase 3 — Drift detection

1. Add a `framework-self-test` job to `.github/workflows/audit-self.yml`: applies the framework's own `bash install.sh` + `bash setup.sh` against a tmp project and asserts the result passes the framework's own audits.
2. This catches "we shipped a broken installer" at PR time.

## Why this PR doesn't fix it

Per discussion: the current umbrella is large enough (16 commits, 28 files). Folding self-application into it would push it past coherent review size. The fix requires:
- Author commitment to local pre-commit overhead (~30s extra per commit)
- New `.husky/` directory + bootstrap script
- `CONTRIBUTING.md` for repo-local dev setup

Tracked as separate umbrella; should land before the next significant feature umbrella (Phase 4 npm publishing) so any new spec violations get caught locally.

## Lesson for the framework

The auditor's most painful finding is the one that makes the audit valid: **the framework's `audit-self.yml` works perfectly as long as someone cares to run it pre-push**. Without local pre-push enforcement, "self-audit" becomes "post-push audit" — strictly worse than not having it (because it normalizes the push-then-fix cycle).

This document exists so that next time someone proposes "self-application is implicit because the framework is the framework," they can be referred to PR #1's three-fix cycle as evidence to the contrary.
