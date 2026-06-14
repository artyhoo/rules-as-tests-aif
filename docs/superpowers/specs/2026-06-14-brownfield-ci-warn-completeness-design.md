# Brownfield CI WARN completeness + `check:lintstaged` CI-wiring — design spec

> **Status:** design drafted 2026-06-14 (brainstorming) — **APPROVED by maintainer 2026-06-14**. Awaiting writing-plans.
> **Authoritative for:** the GH #521 fix scope — (a) wiring `check:lintstaged` into the two shipped CI templates so greenfield CI runs the full `validate` gate-set; (b) broadening the `install.sh` §6c CI-orphan WARN to detect+name **every** enforcement gate absent from a kept (brownfield) workflow and print a ready-to-paste YAML block; (c) the test extension that proves per-gate accuracy. Its detection spec, paste-block format, preserved invariants, and non-goals.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The `--force` overwrite semantics (unchanged). The `check:lintstaged` gate's own logic — see [`packages/core/audit-self/check-lintstaged-resolves.sh`](../../../packages/core/audit-self/check-lintstaged-resolves.sh).

## Why this exists

The framework's core promise (README#why-this-exists): every rule is an executable artifact that fails at the **earliest reachable channel**, and **CI is the only non-bypassable gate** — local hooks fall to `git push --no-verify`.

On a **brownfield** repo (one that already has `.github/workflows/ci.yml`), `install.sh` deploys its CI template via `copy_safe`, which **skips any pre-existing file** ([install.sh:181](../../../install.sh), [install.sh:603](../../../install.sh)). The consumer keeps their own CI verbatim — correct, non-destructive, "consumer owns their CI" ([install.sh:650](../../../install.sh)). But the enforcement suite then runs in **no CI job**; it survives only in the root `validate` script a developer must remember to run locally.

GH #521 reports two defects in how the installer handles this:

1. **The CI-orphan WARN under-reports.** The existing §6c WARN ([install.sh:653-667](../../../install.sh)) greps each kept workflow only for `check-rule-globs\.sh|check:globs` — so it warns about **one** gate. `arch:check` (R3 boundaries) and `audit:docs` are *also* absent from the kept CI but get **no warning**. A developer who reads the WARN and wires only the glob gate still ships R3 silently un-enforced in CI — a false "fixed" signal.
2. **`--force` is the wrong granularity.** The WARN's only "automatic" remedy is "re-run with `--force`" — but `--force` overwrites **every** skipped file ([install.sh:181](../../../install.sh)), clobbering kept `vitest.config.ts`, `.prettierignore`, etc. to wire one CI step.

## Verified facts (file:line — all #521 claims hold)

| Claim | Evidence |
|---|---|
| WARN greps only `check:globs` | [install.sh:657](../../../install.sh) — `grep -qE 'check-rule-globs\.sh\|check:globs'` |
| `--force` overwrites all skipped files | [install.sh:181](../../../install.sh) — `[ -e "$dst" ] && [ "$FORCE" != "--force" ]` |
| package.json already merges non-destructively (capability exists) | [install.sh:702-745](../../../install.sh) — node merge, only adds missing keys |
| ci.yml deployed via skip-if-exists | [install.sh:603](../../../install.sh) / [install.sh:615](../../../install.sh) |

**Additional fact found during verification (not in the issue):** `check:lintstaged` is in the `validate` script ([install.sh:723](../../../install.sh)) but **not wired into either shipped CI template** — only `check:globs` (lint job), `arch:check` (architecture job), `audit:docs` (audit-ai-docs job) are. So even a **greenfield** consumer never runs `check:lintstaged` in CI. The shipped gate script ([check-lintstaged-resolves.sh:20-31](../../../packages/core/audit-self/check-lintstaged-resolves.sh)) is **CI-safe**: it skips (exit 0) when `node_modules` is absent and runs meaningfully after `npm ci`; no husky / extra dependency.

## The design's core idea — one unified gate-set, zero drift

**Invariant established by this fix:** `{ gates the brownfield WARN names } = { gates the shipped greenfield CI wires } = { gates validate runs }`. Today `validate` (4 gates) and the shipped `ci.yml` (3 gates) silently disagree — itself the "config lies" class this project exists to kill. After this fix all three agree on the same **4 gates**: `check:globs`, `arch:check`, `audit:docs`, `check:lintstaged`.

## Change 1 — wire `check:lintstaged` into both shipped CI templates

Add one step to the existing **`lint` job** (which already runs `check-rule-globs.sh`) in both:
- [`templates/ts-server/github-actions-ci.yml`](../../../templates/ts-server/github-actions-ci.yml) (lint job, after line 39)
- [`packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml`](../../../packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml) (lint job, after line 36)

```yaml
      - name: lint-staged config resolves (binaries reachable before first commit)
        run: bash scripts/check-lintstaged-resolves.sh
```

The lint job already does `npm ci --prefer-offline` before its steps, so `node_modules` exists → the gate runs by design (does not auto-skip). Greenfield consumers' CI then runs the full validate set.

> **Behaviour-change note (small, verify empirically at I-phase):** fresh consumers' CI gains one gate. On a correct greenfield install the gate passes (shipped lint-staged config resolves), so no surprise breakage — **but the I-phase MUST confirm a clean `ts-server` install is green on this step in a CI-like run (deps installed)** before ship. This is the one read-only-unverifiable claim.

## Change 2 — broaden the §6c CI-orphan WARN ([install.sh:645-667](../../../install.sh))

Replace the single-gate grep + generic WARN + `--force`-only advice with **per-gate detection** over all kept workflows, a **complete** WARN, and a **paste-block**.

### Detection spec

For each gate, the WARN fires **iff** (a) the gate's enforcing artifact was installed (present in the consumer tree) **and** (b) no workflow under `.github/workflows/*.yml|*.yaml` references it:

| Gate | What it enforces | "wired?" grep pattern | install-present guard (artifact) |
|---|---|---|---|
| `check:globs` | R2/R7/R8 ESLint-rule liveness | `check-rule-globs\.sh\|check:globs` | `scripts/check-rule-globs.sh` |
| `arch:check` | R3 architecture boundaries | `arch:check\|depcruise` | `.dependency-cruiser.cjs` |
| `audit:docs` | AI-doc drift / code-vs-docs | `audit:docs\|audit-ai-docs\.sh` | `scripts/audit-ai-docs.sh` |
| `check:lintstaged` | lint-staged binary resolution | `check:lintstaged\|check-lintstaged-resolves\.sh` | `scripts/check-lintstaged-resolves.sh` |

- **Detection is best-effort + advisory.** A consumer invoking a gate by an exotic name could get a spurious WARN; that is acceptable (non-destructive, they ignore it). It can **never produce a false-green** — the failure mode an auto-wire would have.
- The install-present guard keeps the WARN honest: never warn about a gate whose artifact the consumer doesn't have (e.g. a stack that doesn't ship one).

### Output shape

- **All present → no WARN** (preserves current greenfield behaviour + the existing NEG test).
- **Some absent → one WARN block** naming each absent gate **with its enforcement coverage**, followed by a ready-to-paste YAML block containing **only the absent** `- run:` steps, scoped with a one-line "paste into your lint/test job's `steps:`" instruction.
- The `--force` mention is **reworded honestly**: "`--force` re-adopts the shipped ci.yml but overwrites **all** kept files (vitest.config.ts, .prettierignore, …), not just the workflow — usually pasting the steps above is the lighter touch."

### Paste-block format (example, all four absent)

```text
   Add these steps to your lint/test job's `steps:` (only the ones missing in your CI):
       - run: bash scripts/check-rule-globs.sh          # R2/R7/R8 ESLint-rule liveness
       - run: npm run arch:check                        # R3 architecture boundaries
       - run: bash scripts/audit-ai-docs.sh             # AI-doc drift
       - run: bash scripts/check-lintstaged-resolves.sh # lint-staged binaries resolve
```

### Preserved invariants

- **Non-destructive** — the consumer's workflow is never edited; output is advisory text only.
- **rc=0 always** — the whole block stays under `set -euo pipefail`; every grep carries `|| true` (parity with §6b [install.sh:636](../../../install.sh)) so a no-match never aborts the install. This is the load-bearing guard (cold-review M2 precedent in `nvmrc-ci-drift.test.sh`).
- **Dry-run unaffected** — guarded by the existing `[ "$DRY_RUN" != "--dry-run" ]` condition.

## Test plan — extend [`tests/install-sh/r2-glob-reach.test.sh §#1`](../../../tests/install-sh/r2-glob-reach.test.sh)

The harness already tests the §6c WARN (POS: brownfield → WARN + non-destructive + rc=0; NEG: greenfield → wired → no warn) with paired-negative + rc=0 discipline. Extend it:

- **POS-all** — brownfield `ci.yml` wiring **none** of the 4 → WARN names all 4 + paste-block prints 4 steps; install rc=0; consumer ci.yml left intact.
- **POS-partial** (the load-bearing new case that proves the #521 fix) — `ci.yml` wiring **only** `check:globs` → WARN names exactly `arch:check`+`audit:docs`+`check:lintstaged` and **does NOT** name `check:globs`. Proves per-gate accuracy the current single-grep lacks.
- **NEG** — greenfield → shipped CI wires all 4 (after Change 1) → no WARN. (Update the existing NEG assertion to also confirm `check-lintstaged-resolves.sh` is now wired in the shipped ci.yml.)
- **rc=0 guard** on every arm (harness pattern).

Plus a tiny template assertion (extend [`f12`](../../../tests/install-sh/f12-workflow-integrity-shipped.test.sh) or [`f3-f7`](../../../tests/install-sh/f3-f7-rule-globs.test.sh)) that both shipped CI templates now reference `check-lintstaged-resolves.sh` — so Change 1 can't silently regress.

## Non-goals (explicit scope fence)

- **No YAML parsing, no new dependency, no auto-edit of the consumer's workflow.** A non-destructive YAML merge would need a YAML parser (BFR capability-commit) or brittle text-editing that reproduces the very "manual YAML edit breaks one-button" footgun #521 names — and on a monorepo/multi-job CI could wire a step into the wrong job → silently-inert gate → **false-green CI**, the worst failure for a "no check → no rule" framework. Rejected on the project's own merits ([install.sh:650](../../../install.sh) "consumer owns their CI"; [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md)).
- **`--wire-ci` flag (issue's "optionally") — DEFER.** YAGNI; it still requires editing the consumer's YAML, just behind a flag. Recorded as a future option, not built now. Revisit trigger: a second documented brownfield consumer asks for hands-off auto-wiring AND a safe single-job-detection heuristic is benchmarked.

## Self-application note

This fix closes a gap in the **installer's own honesty surface**: the tool that ships "no silent gaps" was itself silently under-reporting a gap (1 of 3-then-4) and silently letting `validate` and shipped CI drift. After this change the installer's WARN, the shipped CI, and `validate` enforce the same set — the discipline applied to the discipline-shipping tool.

## Capability-commit check (CLAUDE.md gate)

Not a capability commit: edits to an existing shell block + two YAML templates + a bash test, no new dependency, no new ≥50/≥80-LOC module under `packages/`. `Prior-art:` trailer escape-hatch applies ("WARN-completeness + template-wiring fix, no new capability"). No SSOT entry required.
