# Claude / Agent Guidance

This file is auto-loaded by Claude Code when sessions run inside this repo.

> **Authoritative for:** AI-tooling conventions, capability-commit gates, build-vs-reuse discipline, Artifact Ownership Contract.
> **NOT authoritative for:** project goal, methodology, design invariants — see [README.md#why-this-exists](README.md#why-this-exists).

## Read-first (Step 0)

At session start, read [.claude/session-bootstrap.md](.claude/session-bootstrap.md) — it re-states the project goal + invariants from README in compaction-resilient form. Implements the AIF Step 0 / Cline Memory Bank re-read pattern: anchors goal across context-loss events that compaction cannot guarantee to preserve.

## Project goal pointer (do not elevate methodology to goal)

**Goal:** AI agents can't silently bypass undocumented conventions. Every codified rule is an executable artifact (ESLint rule, pre-push check, principle test, mutation gate, drift probe, Living Documentation assertion) that fails at the earliest reachable channel — edit-time → pre-commit → pre-push → CI → production audit. **CI is the last-resort gate, not the primary one.** Full statement: [README.md#why-this-exists](README.md#why-this-exists).

**Methodology:** recursive self-application — framework validates itself with its own logic. *Quality signal* (per GCC bootstrap precedent, `rustc` compile-self analogy), not the project's goal. **Do not elevate to «north star» in any operational doc.** If you find yourself reasoning under a goal that contradicts README — stop. The contradicting doc has drifted, not README. Surface as a coverage-gap patch under [docs/meta-factory/research-patches/](docs/meta-factory/research-patches/).

## Build-vs-reuse invariant (Phase 8.8)

Before introducing any **capability commit** (definition below), **MUST**:

1. Consult [docs/meta-factory/prior-art-evaluations.md](docs/meta-factory/prior-art-evaluations.md) (SSOT) for matches on the capability area.
2. Run context7 query (≥3 phrasings) on the capability area; cite candidates surfaced.
3. Document the evidence via a `Prior-art:` commit trailer (syntax below).

If no SSOT entry matches and context7 surfaces no production-grade analog, add a new SSOT entry — with `Verdict`, `Rationale`, `Trigger to revisit` — in the same commit as the capability artifact (per [prior-art-evaluations.md §3](docs/meta-factory/prior-art-evaluations.md)).

The phase entry consult gate is the same enforcement at planning time — see [EXECUTION-PLAN.md §5.5 Step 1.5](docs/meta-factory/EXECUTION-PLAN.md).

For the **consumer-side authority model** governing how shipped artefacts may be customised after install (three-layer model + `<file>.override.md` escape hatch), see [INSTALL-FOR-AI.md `Three-layer authority for shipped artefacts`](INSTALL-FOR-AI.md#three-layer-authority-for-shipped-artefacts). This is the consumer-facing companion to the build-vs-reuse discipline above.

## What is a capability commit?

A commit that does **any** of the following (mirrors `.husky/pre-push` detection — the prose definition and the hook stay in sync):

- Adds a new **explicit dependency** in `package.json` (transitive deps don't count; matched by `^\+\s*"[^"]+":\s*"\^?[0-9]` in the package.json diff).
- Adds a new file **≥50 LOC** under a new subdirectory of `packages/core/<new-dir>/`.
- Adds a new file **≥80 LOC** anywhere under `packages/`.

Refactors, doc edits, test additions for existing capabilities, bug fixes, snapshot regenerations, recipe data edits — **NOT** capability commits.

## `Prior-art:` trailer syntax

In the commit message body, after the blank line that follows the subject:

```text
Prior-art: <free-form narrative referencing prior-art-evaluations.md#<ID>, or escape hatch>
```

**Examples:**

- Positive: `Prior-art: prior-art-evaluations.md#1 (Autogrep, verdict DEFER — different domain, no overlap with this commit's capability).`
- Multiple refs: stack two `Prior-art:` lines, one per entry. Each line is independently parsed.
- Escape hatch (non-capability commits caught by the hook in mixed PRs): `Prior-art: skipped — refactor only, no new capability` — rationale **must** be ≥20 chars and specify *why* (e.g. «refactor only, no new capability», «snapshot regen after recipe edit», NOT «TODO» / «later» / placeholder).

## Recursive self-application

This convention is enforced via three layers, each validating a different artifact:

| Layer | Surface | Artifact | Added |
|---|---|---|---|
| 1 — meta-test | Phase 2 principle 08 | research files cite SSOT by ID; broken refs caught | T3 |
| 2 — process gate | EXECUTION-PLAN §5.5 Step 1.5 | phase research consult before drafting | T6 |
| 3 — developer-time | `.husky/pre-push` + commit trailer | capability commits carry `Prior-art:` line | T7 + T8 |

The convention applies to its own implementation: Phase 8.8 commits T2-T11 carry `Prior-art:` trailers, and principle 08 validates the SSOT it builds on.

## Artifact Ownership Contract

Each artifact has one owner. Cross-owner edits require explicit handoff (separate atomic commit + rationale, not side-effect of operational work). Reviewer agents are read-only for any artifact they don't own.

| Artifact | Owner | Read-only for | Why |
|---|---|---|---|
| [README.md](README.md) (`§Why this exists`) | maintainers (deliberate edit) | all reviewer / implementation / planning sessions | goal-redefinition is structural change |
| [docs/meta-factory/EXECUTION-PLAN.md](docs/meta-factory/EXECUTION-PLAN.md) | maintainers + planning sessions | reviewer agents, implementation agents | operational; does not own goal |
| [docs/meta-factory/PROPOSAL.md](docs/meta-factory/PROPOSAL.md) | frozen — historical artifact | all sessions | design-history record; do not retroactively rewrite |
| [docs/meta-factory/prior-art-evaluations.md](docs/meta-factory/prior-art-evaluations.md) | phase research sessions, capability-commit authors | reviewer agents | append-only register per [§3](docs/meta-factory/prior-art-evaluations.md) |
| [docs/meta-factory/retros/](docs/meta-factory/retros/) `*` | phase orchestrator at retro time | all subsequent sessions | closed historical artifact post-merge |
| [docs/meta-factory/research-patches/](docs/meta-factory/research-patches/) `*` | session that discovered the gap | all subsequent sessions | one patch per gap, append-only |
| [.husky/pre-push](.husky/pre-push), [.claude/rules/](.claude/rules/) `*` | maintainers | all session agents | enforcement layer |
| [.claude/session-bootstrap.md](.claude/session-bootstrap.md) | maintainers (deliberate edit) | reviewer agents | operational restatement; modify only when invariants/reading-order change |
| [packages/core/principles/](packages/core/principles/) `*` | meta-tests CI | implementation agents | enforcement code |

The contract addresses the exact mechanism of the 2026-05-09 incident: reviewer agents pattern-matching on language in [docs/meta-factory/EXECUTION-PLAN.md](docs/meta-factory/EXECUTION-PLAN.md) §1 («north star»), then reinforcing the wrong goal across reviewer cycles. Read-only constraint on goal-bearing artifacts (README) prevents reviewer agents from silently re-establishing a different goal.

## PR strategy

When working on an agreed scope (a defined umbrella, batch, or single-concern PR), stay strictly within that scope.

**Rule:** if you notice a separate systemic issue mid-PR (e.g. «PR template missing §1.7 stubs causes recurring CI fails»), do NOT autonomously open an additional PR. Surface it as an observation in the final summary («I noticed X, want me to fix as a separate task?»), do NOT spawn a PR/branch/commit autonomously.

**Why:** Incident 2026-05-11, PR #33. While completing PR #32 (Wave 5 readiness SSOT remap), the orchestrator noticed a real recurring CI-fail trigger in the PR template and opened PR #33 autonomously. Maintainer pushback: drive-by scope expansion adds PR review overhead, introduces shared-state operations without explicit invitation, and violates atomic-umbrella discipline. Atomic-umbrella discipline is parallel to atomic-commit discipline: one concern per PR, even if «we're already here».

**How to apply:**

- Within the originally agreed umbrella scope → atomic commits OK, multiple files OK, multiple concerns within the umbrella OK.
- Outside the umbrella → surface as observation, await explicit invitation.
- The `work-without-stopping` user override applies to **clarification within the agreed scope**, not to expanding scope with new shared-state operations.
- Exception: if maintainer explicitly invited the systemic fix in this session, proceed — but that's an explicit invitation, not autopilot.

## See also

- [CONTRIBUTING.md](CONTRIBUTING.md) — full contributor-facing details (hook setup, bypass policy).
- [docs/meta-factory/prior-art-evaluations.md](docs/meta-factory/prior-art-evaluations.md) — the SSOT.
- [.github/pull_request_template.md](.github/pull_request_template.md) — PR checklist.
- [packages/core/principles/08-prior-art-cited.test.ts](packages/core/principles/08-prior-art-cited.test.ts) — meta-test enforcing citations.
- [agents/compliance-verifier.md](agents/compliance-verifier.md) — AI-agnostic sub-agent for §1.7 substance review; read in your active session before merging a discipline-bearing PR (Wave 8.1b, $0 LLM-in-CI).
