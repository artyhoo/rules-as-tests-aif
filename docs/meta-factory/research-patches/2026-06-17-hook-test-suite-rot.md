<!-- scope:hook-test-suite-rot -->

# Hook test suite rot — classified root-cause report

**Status:** investigation complete; CI-gap fork parked as DECISION-NEEDED.
**Date:** 2026-06-17
**Branch:** `feature/hook-test-suite-rot-6434ae`
**Environment:** Linux container (handoff agent), no `jq`, root `node_modules` empty (no `npm install`), GNU xargs.

---

## §1 Population — full failing census

Run: `npx vitest run packages/core/hooks/` on this branch (Linux container).

```text
Test Files  13 failed | 18 passed | 11 skipped (42)
      Tests  39 failed | 451 passed | 110 skipped (600)
```

**Note on hypothesis vs. actuals:** The kickoff hypothesised ~15 failures across 5 files.
Actual: 39 failures across 13 files. The hypothesised files `check-doc-authority.test.ts`
and `end-of-turn-reminder.test.ts` are **skipped** in this env (both guarded by
`describe.skipIf(!JQ)` — `jq` absent → entire suite skipped). On macOS with `jq`
available these suites run and may add 0–4 further failures.

### Complete failing test list (T1 / T10 obligation — enumerate before classifying)

| # | Test name | File | Exit |
|---|---|---|---|
| 1 | `invokes the remaining audit-self self-tests by literal path` | `pre-push.test.ts` | AssertionError |
| 2 | `UNBASELINED: <pending> placeholder → honest "not yet baselined"` | `deps-hash-check.test.ts` | AssertionError |
| 3 | `packages/ source and .claude/ dogfood copy are byte-identical` | `deps-hash-check.test.ts` | AssertionError |
| 4 | `IDENTICAL: seen == current → silent` | `delta-diff.test.ts` | exit 1 |
| 5 | `MIXED-DIFF: 1 retained + 1 dropped + 1 new` | `delta-diff.test.ts` | exit 1 |
| 6 | `ALL-RESOLVED: empty current + populated seen` | `delta-diff.test.ts` | exit 1 |
| 7 | `SPECIAL-CHARS: ids with §, /, :` | `delta-diff.test.ts` | exit 1 |
| 8 | `HAPPY-PATH: existing delta + valid args → arrays rewritten` | `delta-write-from-state.test.ts` | exit 1 |
| 9 | `IDEMPOTENT: second invocation reproduces identical file` | `delta-write-from-state.test.ts` | exit 1 |
| 10 | `INVALID-CURRENT-JSON: exit 1 + stderr diagnostic` | `delta-write-from-state.test.ts` | exit 1 |
| 11 | `INVALID-RESOLVED-JSON: exit 1 + stderr diagnostic` | `delta-write-from-state.test.ts` | exit 1 |
| 12 | `SYMLINK-AWARE: delta symlinked into CANON survives array rewrite` | `delta-write-from-state.test.ts` | exit 1 |
| 13 | `STATE-PRESENT: valid state JSON → emits winner_id + sub_wave_state` | `dispatch-from-state.test.ts` | AssertionError |
| 14 | `Case 1 — C2 POSITIVE: jaccard POTENTIAL_DUPE match → status=DONE` | `done-md-completion-filter.test.ts` | exit 123 |
| 15 | `Case 2 — C2 NEGATIVE: zero jaccard overlap → still candidate` | `done-md-completion-filter.test.ts` | exit 123 |
| 16 | `Case 3 — C3 POSITIVE: valid done.md → status=DONE` | `done-md-completion-filter.test.ts` | exit 123 |
| 17 | `Case 3b — C3 n/a: done.md "Final PR: n/a" → status=DONE` | `done-md-completion-filter.test.ts` | exit 123 |
| 18 | `Case 4 — C3 NEGATIVE: no done.md → still candidate` | `done-md-completion-filter.test.ts` | exit 123 |
| 19 | `Case 5 — COMBINED: C1 fail + C2 hit → DONE; C3 hit → DONE` | `done-md-completion-filter.test.ts` | exit 123 |
| 20 | `Case 6 — ALL LAYERS FAIL: still candidate` | `done-md-completion-filter.test.ts` | exit 123 |
| 21 | `(a) SYMLINK: kickoff.md is a symlink into $CANON after helper runs` | `link-coordination.test.ts` | AssertionError |
| 22 | `(c) CONFLICT: real file in both worktree and CANON → exit 1` | `link-coordination.test.ts` | AssertionError |
| 23 | `(d) WRITE-BACK: edit via symlink visible in $CANON` | `link-coordination.test.ts` | AssertionError |
| 24 | `(f) ADOPT: real gitignored file in worktree is adopted` | `link-coordination.test.ts` | AssertionError |
| 25 | `on-conflict=canon: canonical wins, worktree file relinked` | `link-coordination.test.ts` | AssertionError |
| 26 | `on-conflict=skip (default): exits 1, leaves both files intact` | `link-coordination.test.ts` | AssertionError |
| 27 | `on-conflict=worktree: worktree wins, adopted into CANON` | `link-coordination.test.ts` | AssertionError |
| 28 | `POSITIVE: merged PR feat/<umbrella> tags umbrella status=DONE` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 29 | `POSITIVE-PREFIXES: fix/, chore/, docs/, research/ strip to match` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 30 | `PR #236 CASE: meta-orchestrator-skill-memory → DONE done_pr=236` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 31 | `NEGATIVE: open umbrella with no matching merged PR → no DONE` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 32 | `PR #266 CASE: merged feat/<umbrella>-s2 does NOT match bare name` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 33 | `named-mode early-exit PAIRED-NEGATIVE: integer arg proceeds` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 34 | `rank-order: umbrella with larger kickoff.md appears first` | `priority-score-branch-matcher.test.ts` | exit 123 |
| 35 | `CONTROL — umbrella WITH kickoff.md never emits RECONSTRUCT-STUB` | `priority-score-reconstruct-stub.test.ts` | exit 123 |
| 36 | `SYMLINK-AWARE: delta symlinked survives metadata update` | `update-delta.test.ts` | exit 1 |
| 37 | `IDEMPOTENT: pre-existing file → ONLY metadata fields updated` | `update-delta.test.ts` | exit 1 |
| 38 | `POSITIVE: kickoff.md present AS A SYMLINK in worktree` | `worktree-setup-hydration.test.ts` | AssertionError |
| 39 | `DUAL-PAIR PARITY: hook and script both produce symlinks` | `worktree-setup-hydration.test.ts` | AssertionError |

Two additional suite-level crashes (no individual test failures — module import throws):

| File | Error |
|---|---|
| `checks/guard-liveness.test.ts` | `Cannot find package 'eslint' imported from .../guard-liveness.ts:26` |
| `checks/guard-liveness-fullsweep.test.ts` | Same `eslint` import error via `guard-liveness.ts:46` |

---

## §2 Per-file root-cause classification

### 2.1 `pre-push.test.ts` — 1 failure · `stale-assertion`

**Failing test:** `invokes the remaining audit-self self-tests by literal path` (`pre-push.test.ts:54`)

**Assertion:**
```typescript
// pre-push.test.ts:58-60
for (const s of ['audit-ai-docs.test.sh', 'hook-stub-completeness.test.sh']) {
  expect(ORCHESTRATOR).toContain(`packages/core/audit-self/${s}`);
}
```

**Evidence:**
- `packages/core/hooks/pre-push.ts:525`: the actual invocation path is
  `'packages/core/audit-self/audit-ai-docs.test.ts'` (`.ts`, not `.sh`)
- `packages/core/hooks/pre-push.ts:519` comment: `// audit-ai-docs.test.ts (Wave 10.4): run via vitest (replaces audit-ai-docs.test.sh)`
- `hook-stub-completeness.test.sh` does not appear anywhere in `pre-push.ts` — it was deleted and replaced by `packages/core/principles/16-hook-stub-completeness.test.ts` (confirmed via `packages/core/principles/16-hook-stub-completeness.test.ts:4`: `Source: packages/core/audit-self/hook-stub-completeness.test.sh (now deleted)`)

**Classification:** `stale-assertion` — Wave 10.4 migrated `audit-ai-docs.test.sh` → `.test.ts`; `hook-stub-completeness.test.sh` was deleted (moved to `principles/16`). The test was never updated to reflect either migration.

**Follow-up fix (one-liner):** Change `['audit-ai-docs.test.sh', 'hook-stub-completeness.test.sh']` to `['audit-ai-docs.test.ts']` and remove the `hook-stub-completeness` entry. (Scope: test file only.)

---

### 2.2 `deps-hash-check.test.ts` — 2 failures · `local-dirty-tree-artifact` (does NOT reproduce on clean staging)

**Failing tests:**
1. `UNBASELINED: <pending> placeholder → honest "not yet baselined" warning, NOT "deps changed"` (`deps-hash-check.test.ts:148`)
2. `packages/ source copy and .claude/ dogfood copy are byte-identical` (`deps-hash-check.test.ts:266`)

**Evidence:**
```text
$ git diff HEAD -- .claude/hooks/deps-hash-check.sh | head -25
-  case "$STORED_HASH" in
-    sha256-*)
-      printf '⚠ package.json deps changed since last tool-bootstrap …\n'
-      ;;
-    *)
-      printf '⚠ tool decisions not yet baselined — run /tool-bootstrapping…\n'
-      ;;
-  esac
+  printf '⚠ package.json deps changed since last tool-bootstrap …\n'
```

`git status` at session start shows `M .claude/hooks/deps-hash-check.sh` (unstaged modification pre-existing to this task — not introduced here).

- The **source** `packages/core/hooks/deps-hash-check.sh` is at HEAD with the sha256-case distinction (GH #548 fix, merged PR #598 `4f8ed0ff2`).
- The **dogfood** `.claude/hooks/deps-hash-check.sh` has been stripped of that sha256-case logic in the *working tree* but is NOT committed — HEAD has source and dogfood byte-identical.
- UNBASELINED test runs the dogfood working-tree copy, which emits "deps changed" instead of "not yet baselined" — assertion fails at `deps-hash-check.test.ts:148`.
- Byte-identity test compares source vs. dogfood working-tree copy — fails at `deps-hash-check.test.ts:266` because the working tree has 12 lines stripped.

**Classification:** `local-dirty-tree-artifact` — these 2 failures exist only because this worktree has an uncommitted modification to `.claude/hooks/deps-hash-check.sh`. On clean `staging` (the kickoff's stated baseline, where `deps-hash-check.sh` was NOT among the 5 hypothesised failing files), HEAD has source and dogfood byte-identical and both tests pass. This is a worktree-local artifact, not a staging regression. The tests are correctly designed; the failure is a signal to restore the working tree.

**Active probe result:** These failures do NOT represent the regression hiding in the pile. The genuinely staging-resident real-regression is the xargs-pipefail bug in `priority-score-synthetic.sh` (§2.5–2.7) — that is in committed code and reproduces on any clean checkout.

**Follow-up fix:** Restore `.claude/hooks/deps-hash-check.sh` working tree to match committed HEAD: `git restore .claude/hooks/deps-hash-check.sh`. If the working-tree change was intentional, update source and dogfood together and commit them, then update test expectations.

---

### 2.3 `link-coordination.test.ts` — 7 failures · `stale-assertion`

**Failing tests:** (a) SYMLINK, (c) CONFLICT, (d) WRITE-BACK, (f) ADOPT, on-conflict=canon, on-conflict=skip, on-conflict=worktree

**All 7 tests use `kickoff.md` as the test file.**

**Evidence — `scripts/link-coordination.sh`:**
```bash
# scripts/link-coordination.sh:34 (comment, the migration note):
# Lifecycle split (cross-session kickoff portability, SSOT #116): kickoff.md is a
# committed durable design doc (git owns it); state.md + _plan-cache +
# _master-backlog-delta are gitignored regenerable runtime (this helper owns them).

# scripts/link-coordination.sh:38:
# Tracked files skipped: README.md (root), */done.md + */kickoff.md (per umbrella).

# scripts/link-coordination.sh:123 (adopt-then-link loop):
[[ "$filename" == "kickoff.md" ]] && continue

# scripts/link-coordination.sh:193 (link-from-CANON loop):
[[ "$filename" == "kickoff.md" ]] && continue
```

Migration commit: `d03d541b6 feat(pipeline): kickoff-portability mechanism (#520)`.

All 7 tests assert that `kickoff.md` is symlinked/adopted/conflict-checked. After the SSOT #116 lifecycle split (PR #520), `kickoff.md` is a tracked committed file — `link-coordination.sh` now explicitly skips it in both loops. The tests were written for the pre-split behavior.

**Classification:** `stale-assertion` — 7 tests assert the OLD behavior (kickoff.md as a gitignored symlinked file) but the script implements the NEW behavior (kickoff.md is tracked, skipped). No bug in the script; the tests are stale.

**Follow-up fix:** Update all 7 tests to use `state.md` (or another genuinely gitignored runtime file) as the test subject, OR add new tests asserting the NEW expected behavior (kickoff.md remains a real file in the worktree, is not symlinked).

---

### 2.4 `worktree-setup-hydration.test.ts` — 2 failures · `stale-assertion` (same root)

**Failing tests:** POSITIVE (kickoff.md present as symlink), DUAL-PAIR PARITY (hook and script both produce symlinks)

**Evidence:** `worktree-setup-hydration.test.ts:38-39`:
```typescript
const SCRIPT = resolve(REPO_ROOT, 'scripts/create-worktree.sh');
const LINK_COORDINATION = resolve(REPO_ROOT, 'scripts/link-coordination.sh');
```
`create-worktree.sh` invokes `link-coordination.sh`. Both failing tests expect `kickoff.md` to be a symlink in the worktree after running the script:
```typescript
// worktree-setup-hydration.test.ts:264:
expect(existsSync(kickoffPath), 'kickoff.md must exist').toBe(true);
expect(lstatSync(kickoffPath).isSymbolicLink(), 'kickoff.md must be a symlink').toBe(true);
```
Since `link-coordination.sh` now skips `kickoff.md` (§2.3 above), `kickoff.md` never appears in the worktree.

Note: the 2 remaining tests that use the hook path (requiring `jq`) are correctly **skipped** via `describe.skipIf(!JQ)` (`worktree-setup-hydration.test.ts:179`). The portable script tests run but fail because they share the same kickoff.md expectation.

**Classification:** `stale-assertion` — same SSOT #116 root cause as §2.3; this suite tests `create-worktree.sh` which delegates to `link-coordination.sh`.

---

### 2.5 `priority-score-branch-matcher.test.ts` — 7 failures · `real-regression`

**Failing tests:** POSITIVE, POSITIVE-PREFIXES, PR #236 CASE, NEGATIVE, PR #266 CASE, named-mode PAIRED-NEGATIVE, rank-order.
**Passing test:** `named-mode early-exit: non-empty string arg → exits 0 with skip-line` (the only test that hits the early-exit path before the synthetic section).

**Exit code observed:** 123 (all 7 failing tests).

**Root cause — `priority-score-synthetic.sh:48-53`:**
```bash
# Line 48-53 in priority-score-synthetic.sh:
find "${PROMPTS_DIR}" -mindepth 2 -maxdepth 2 -name 'state.md' 2>/dev/null \
  | xargs grep -l -iE 'PENDING|TODO|AWAITING|REVIEW-PENDING' 2>/dev/null \
  | while read -r s; do
    umbrella="$(basename "$(dirname "${s}")")"
    echo "${umbrella}-state-pending type=state-followup kickoff=synthetic source=state.md"
  done
```

**Proof of exit 123:**
```bash
$ printf "" | xargs grep -l -iE 'PENDING'
# exit:123
```

When `find ... -name state.md` returns nothing (test sandbox has no `state.md` files), `xargs` (GNU xargs on Linux) receives empty stdin and runs `grep -l -iE 'PENDING|...'` with no file arguments. `grep` reads stdin (which is EOF from the find pipe), finds no match, exits 1. GNU `xargs` propagates this as exit code 123. With `set -euo pipefail` active in `priority-score-synthetic.sh:17`, the pipeline fails and the script exits 123.

`priority-score.sh` ends with `bash "${_PS_DIR}/priority-score-synthetic.sh"` — so the exit code of priority-score.sh is 123.

The comment at `priority-score-synthetic.sh:56` shows awareness of this risk for section (c):
```bash
# (c) Memory files with TODO-codify: — durable conventions stranded in memory
# Avoid pipefail issues: iterate via process substitution + explicit grep test per file.
```
But section (b) at lines 48-53 still has the unfixed xargs-pipefail pattern.

**Platform note:** On macOS, **BSD xargs does NOT run the command with empty stdin** (behaves as if `--no-run-if-empty` is the default). So on macOS, this bug does NOT manifest — the test passes. On Linux with GNU xargs, it fails. The `priority-score-synthetic.sh` was split from the inline section in commit `772734390` ("Stage 4 slim"), introducing this cross-platform divergence.

**Classification:** `real-regression` — cross-platform bug introduced when the synthetic section was extracted to a separate subprocess. On Linux the pipeline exits 123 for every test that reaches the synthetic section. Fixes on macOS; breaks on Linux. **This is the real-regression hiding in the pile** — in committed code, reproducible on any clean staging checkout, invisible only because the hooks suite is ungated.

---

### 2.6 `priority-score-reconstruct-stub.test.ts` — 1 failure · `real-regression` (same root)

**Failing test:** `CONTROL — umbrella WITH kickoff.md never emits RECONSTRUCT-STUB`
**Exit code:** 123. Same xargs-pipefail bug via priority-score.sh → priority-score-synthetic.sh.

---

### 2.7 `done-md-completion-filter.test.ts` — 7 failures · `real-regression` (same root)

**All 7 tests invoke `priority-score.sh` as `HELPER`:**
```typescript
// done-md-completion-filter.test.ts:59-62:
const HELPER = resolve(
  REPO_ROOT,
  '.claude/skills/pipeline/helpers/priority-score.sh',
);
```
**Exit code:** 123 on all 7. Same xargs-pipefail root cause.

---

### 2.8 `delta-diff.test.ts` — 4 failures · `genuine-env-dependence` (jq absent)

**Failing tests:** IDENTICAL, MIXED-DIFF, ALL-RESOLVED, SPECIAL-CHARS.
**Exit code:** 1.

**Evidence:**
```bash
$ jq --version
/bin/bash: line 1: jq: command not found
```

`delta-diff.sh:54-58`:
```bash
if [ -f "$DELTA_FILE" ]; then
  if ! jq empty "$DELTA_FILE" 2>/dev/null; then
    echo "delta-diff.sh: delta corrupt — invalid JSON at $DELTA_FILE" >&2
    exit 1
  fi
  jq -r '.untracked_seen[]?.id' "$DELTA_FILE" 2>/dev/null | sort -u > "$SEEN_FILE"
fi
```

When `jq` is not installed: `jq empty "$DELTA_FILE"` exits 127 (command not found). `! 127` = true → script exits 1 with "delta corrupt" even though the JSON is valid. Tests expect exit 0; actual: exit 1.

**Classification:** `genuine-env-dependence` — `jq` is not installed in this container. On macOS with `jq` (Homebrew), these tests pass. The tests do not have `skipIf(!jq)` guards (unlike `check-doc-authority.test.ts` and `end-of-turn-reminder.test.ts` which do).

---

### 2.9 `delta-write-from-state.test.ts` — 5 failures · `genuine-env-dependence` (jq absent)

**Failing tests:** HAPPY-PATH, IDEMPOTENT, INVALID-CURRENT-JSON, INVALID-RESOLVED-JSON, SYMLINK-AWARE.
**Exit code:** 1.

`delta-write-from-state.sh:73`: `if ! jq empty "${DELTA_FILE}" 2>/dev/null; then` — same pattern as §2.8. `jq` absent → exits 1 treating valid JSON as corrupt.

Three passing tests (FRESH-DELTA, BOUNDARY, MALFORMED): FRESH-DELTA doesn't read a pre-existing file (no jq path reached); BOUNDARY exits 2 before jq; MALFORMED expects exit 1 and coincidentally gets it (because jq-not-found → "corrupt" branch fires).

**Classification:** `genuine-env-dependence` — `jq` absent. No skipIf guards.

---

### 2.10 `update-delta.test.ts` — 2 failures · `genuine-env-dependence` (jq absent)

**Failing tests:** SYMLINK-AWARE, IDEMPOTENT. **Exit code:** 1.
**Passing tests:** FRESH-DELTA (template write path, no jq needed), MALFORMED (expects exit 1 and gets it coincidentally), BOUNDARY (arg-count check before jq).

`update-delta.sh:105`: `if ! jq empty "${DELTA_FILE}" 2>/dev/null; then` — same jq-absent pattern.

**Classification:** `genuine-env-dependence`.

---

### 2.11 `dispatch-from-state.test.ts` — 1 failure · `genuine-env-dependence` (jq absent)

**Failing test:** `STATE-PRESENT: valid state JSON → emits winner_id + sub_wave_state from file`

**Evidence:**
```text
AssertionError: expected '=== dispatch state ===\n\n=== kickoff body ===\nMISSING kickoff...'
to match /winner_id:\s*wave-9\.1/
```

`dispatch-from-state.sh:69-76`:
```bash
emit_state_section() {
  echo "=== dispatch state ==="
  if [[ ! -f "${STATE_FILE}" ]]; then ...
  if ! jq empty "${STATE_FILE}" 2>/dev/null; then
    echo "(state file corrupt — falling back to kickoff body as SSOT)" >&2
    return 0  # ← winner_id never printed
  fi
  ...
  echo "winner_id: ${winner}"
  echo "sub_wave_state: ${sub_state}"
}
```
`jq` not found → `jq empty` exits 127 → `! 127` = true → "state file corrupt" branch → `winner_id` never emitted.

5 other tests (NO-ARG, FRESH-STATE, KICKOFF-FOUND, MISSING-KICKOFF, CORRUPT-STATE) pass because they do not assert on state content emitted via jq.

**Classification:** `genuine-env-dependence` — `jq` absent. The test has no `skipIf(!jq)` guard.

---

### 2.12 `checks/guard-liveness.test.ts` — suite crash · `genuine-env-dependence` (eslint absent)

**Error:**
```text
Error: Cannot find package 'eslint' imported from
  packages/core/hooks/checks/guard-liveness.ts:26
```

`guard-liveness.ts:26`: `import { Linter } from 'eslint';`

`packages/core/package.json:47`: `"eslint": "^10.4.1"` (declared in `dependencies`).

**Root cause:** This worktree has no `packages/core/node_modules/` and the root `node_modules/` is empty. `npm install` was not run in this container. `eslint` is unavailable.

Verification: `ls packages/core/node_modules/ 2>/dev/null` → no such directory.

**Classification:** `genuine-env-dependence` — `eslint` not installed. Suite crashes before running any tests (module resolution fails at import time). On a machine where `npm install` has been run, these suites would attempt to run.

---

### 2.13 `checks/guard-liveness-fullsweep.test.ts` — suite crash · `genuine-env-dependence` (same root)

Same error as §2.12 — imports `guard-liveness.ts` which imports `eslint`. No tests run.

---

## §3 CI-gap claim — CONFIRMED

**Claim:** `packages/core/hooks/` vitest suite is gated nowhere.

**Evidence (file:line):**

| Surface | File:line | What it does |
|---|---|---|
| `test:principles` script | `packages/core/package.json:27` | `"vitest run principles/"` — scans only `packages/core/principles/`, never `packages/core/hooks/` |
| Pre-push hook | `.husky/pre-push:22` | `exec node --import tsx/esm "$TS_HOOK"` → runs `pre-push.ts` delegation checks; does NOT invoke the hooks vitest suite |
| CI gate | `.github/workflows/audit-self.yml:208` | `run: npm --prefix packages/core run test:principles` — explicitly scopes to `test:principles` (principles/ only) |

No CI step exists that runs `vitest run packages/core/hooks/` or `vitest run hooks/` or any equivalent covering `packages/core/hooks/*.test.ts`.

**How 39 failures accumulated unnoticed:** every push, every CI run, every pre-push check ran only `test:principles` (principles/ only). The hooks test suite ran when a developer explicitly invoked it, but its failures were invisible to gating. The suite rotted freely.

---

## §4 T15 self-application

The project's thesis is «documents lie; tests don't». The hooks test suite IS the executable truth for hook behavior. But an ungated test suite that runs zero enforcement channels is indistinguishable, from a CI perspective, from no tests at all. The framework's own recursive-self-application claim is undercut by the CI gap documented in §3.

Specifically: principle 22 (`internal-english.test.ts`), principle 16 (`hook-stub-completeness`), and other principles are gated. The HOOK tests — which validate the runtime behavior of the `pre-push`, `link-coordination`, `priority-score` etc. — are not. The project can certify «my principles are green» while «my hook behavior is unverified». That is the same document-vs-test gap the project was built to close, recursively applied to itself.

---

## §5 DECISION-NEEDED — CI gate for `packages/core/hooks/`

This is a strategy fork the executor MUST NOT decide. Options and consequences for the maintainer or an `/orchestrator` session:

**Option A — gate the entire hooks suite in CI (after env-guarding env-dependent tests)**
- Add a CI step that runs `vitest run packages/core/hooks/` after `npm install`
- First: env-guard all jq-dependent tests (`delta-diff`, `delta-write-from-state`, `update-delta`, `dispatch-from-state`) with `it.skipIf(!hasJq)` so CI doesn't fail on those
- First: fix the xargs-pipefail bug in `priority-score-synthetic.sh:49` (replace `xargs grep` with `xargs -r grep` / `xargs --no-run-if-empty grep`) so the Linux CI doesn't exit 123
- First: fix the stale-assertion failures (§2.1, §2.3, §2.4)
- Consequence: full hook test suite runs in CI; any future regression caught at the gate. Requires `jq` to be installed in the CI runner (or guard added), and `eslint`/devDeps to be installed (`npm install` already done at `audit-self.yml:206`).

**Option B — keep hooks suite local-only by design, document explicitly**
- Add a comment in `packages/core/package.json` and/or `README.md` declaring the hooks suite is intentionally local-only
- Consequence: CI remains as-is; hook behavior is only verified locally. The CI gap becomes documented-by-design rather than accidental. Stale tests still rot unless developers run the suite manually.

**Option C — split: gate deterministic hook tests; mark env-dependent ones `it.skipIf(...)`**
- Add `skipIf(!hasJq)` to all jq-dependent tests (§2.8–§2.11)
- Fix the xargs-pipefail bug (§2.5–§2.7)
- Fix the stale-assertion tests (§2.1, §2.3, §2.4)
- Add a CI step that runs only `vitest run packages/core/hooks/` — the skipIf guards ensure env-dependent tests are silently skipped on Linux without jq
- Consequence: deterministic tests (link-coordination, pre-push, worktree-setup-hydration) are gated; jq-dependent tests are guarded. Most of the CI gap is closed.

**Parked:** Task status set to `manualReviewRequired` / `blocked_external`. This report delivers the evidence; the choice between A/B/C belongs to the maintainer or an `/orchestrator` session.

---

## §6 Follow-up fixes (FOLLOW-UP scope — NOT applied in this task)

| # | File | Fix | Category |
|---|---|---|---|
| F1 | `packages/core/hooks/pre-push.test.ts:58` | Change `['audit-ai-docs.test.sh', 'hook-stub-completeness.test.sh']` to `['audit-ai-docs.test.ts']` | stale-assertion |
| F2 | `packages/core/hooks/link-coordination.test.ts` | Replace `kickoff.md` with `state.md` in all 7 failing tests (or assert kickoff.md is NOT symlinked) | stale-assertion |
| F3 | `packages/core/hooks/worktree-setup-hydration.test.ts:264,302` | Update to assert kickoff.md is NOT a symlink (per new behavior) | stale-assertion |
| F4 | `.claude/skills/pipeline/helpers/priority-score-synthetic.sh:49` | Replace `xargs grep` with `xargs -r grep` (GNU) / `xargs --no-run-if-empty grep` (portable alias) — grep is not invoked when `find` produces no results, so exit 123 cannot occur. **Do NOT** append `\|\| true` to the middle stage of this 3-stage pipeline: `\|\|` has lower precedence than `\|`, so `find \| xargs grep \|\| true \| while` parses as `(find \| xargs grep) \|\| (true \| while)` — the `while`-loop body never executes and the `${umbrella}-state-pending` candidate line is never produced (verified empirically by reviewer). | real-regression |
| F5 | `.claude/hooks/deps-hash-check.sh` | Restore working tree to match committed source: `git restore .claude/hooks/deps-hash-check.sh` | real-regression |
| F6 | `packages/core/hooks/delta-diff.test.ts` | Add `it.skipIf(!hasJq)` guard to all 4 failing tests | env-dependence |
| F7 | `packages/core/hooks/delta-write-from-state.test.ts` | Add `it.skipIf(!hasJq)` guard to 5 failing tests | env-dependence |
| F8 | `packages/core/hooks/update-delta.test.ts` | Add `it.skipIf(!hasJq)` guard to SYMLINK-AWARE and IDEMPOTENT | env-dependence |
| F9 | `packages/core/hooks/dispatch-from-state.test.ts` | Add `it.skipIf(!hasJq)` guard to STATE-PRESENT | env-dependence |

The `checks/guard-liveness` suite crash (§2.12–§2.13) is resolved by running `npm install` before the suite. No test code change needed.

---

## §7 Anti-laziness audit (per ai-laziness-traps.md §2 §3 obligations)

- **T1/T10 (population first):** Full 39-test population enumerated in §1 before any classification. Root cause never assumed from 3-of-5 sample.
- **T3 (no prose-only findings):** Every finding cites file:line + actual error output or diff excerpt.
- **T14 (no lazy "env flake" conclusion):** Each env-dependence finding specifies which dependency (`jq`, `eslint`/devDeps), which line in the script fails, and how (command-not-found propagation). The two real-regressions (§2.2, §2.5–§2.7) were not dismissed as env flakes.
- **T-Rot-A (active probe for regression):** Actively investigated whether any failure was a genuine bug. Found ONE committed real-regression hiding in the pile: the xargs-pipefail cross-platform bug in `priority-score-synthetic.sh` (§2.5–§2.7), which exists in committed code and reproduces on any clean checkout. The `deps-hash-check.test.ts` failures (§2.2) are a local dirty-tree artifact driven by an uncommitted working-tree modification — not a staging regression.
- **T15 (self-application):** See §4 — the ungated vitest suite is itself a recursive-self-application gap in the framework.
