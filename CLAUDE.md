# Claude / Agent Guidance

This file is auto-loaded by Claude Code when sessions run inside this repo.

## Build-vs-reuse invariant (Phase 8.8)

Before introducing any **capability commit** (definition below), **MUST**:

1. Consult [docs/meta-factory/prior-art-evaluations.md](docs/meta-factory/prior-art-evaluations.md) (SSOT) for matches on the capability area.
2. Run context7 query (≥3 phrasings) on the capability area; cite candidates surfaced.
3. Document the evidence via a `Prior-art:` commit trailer (syntax below).

If no SSOT entry matches and context7 surfaces no production-grade analog, add a new SSOT entry — with `Verdict`, `Rationale`, `Trigger to revisit` — in the same commit as the capability artifact (per [prior-art-evaluations.md §3](docs/meta-factory/prior-art-evaluations.md)).

The phase entry consult gate is the same enforcement at planning time — see [EXECUTION-PLAN.md §5.5 Step 1.5](docs/meta-factory/EXECUTION-PLAN.md).

## What is a capability commit?

A commit that does **any** of the following (mirrors `.husky/pre-push` detection — the prose definition and the hook stay in sync):

- Adds a new **explicit dependency** in `package.json` (transitive deps don't count; matched by `^\+\s*"[^"]+":\s*"\^?[0-9]` in the package.json diff).
- Adds a new file **≥50 LOC** under a new subdirectory of `packages/core/<new-dir>/`.
- Adds a new file **≥80 LOC** anywhere under `packages/`.

Refactors, doc edits, test additions for existing capabilities, bug fixes, snapshot regenerations, recipe data edits — **NOT** capability commits.

## `Prior-art:` trailer syntax

In the commit message body, after the blank line that follows the subject:

```
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

## See also

- [CONTRIBUTING.md](CONTRIBUTING.md) — full contributor-facing details (hook setup, bypass policy).
- [docs/meta-factory/prior-art-evaluations.md](docs/meta-factory/prior-art-evaluations.md) — the SSOT.
- [.github/pull_request_template.md](.github/pull_request_template.md) — PR checklist.
- [packages/core/principles/08-prior-art-cited.test.ts](packages/core/principles/08-prior-art-cited.test.ts) — meta-test enforcing citations.
