# Brownfield CI WARN completeness + `check:lintstaged` wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix GH #521 — make the `install.sh` brownfield CI-orphan WARN name **every** enforcement gate missing from a kept workflow (not just `check:globs`) and print a ready-to-paste block, and wire `check:lintstaged` into the shipped CI templates so `{WARN-named} = {greenfield CI} = {validate}` (4 gates, zero drift).

**Architecture:** Two shipped CI templates gain one `- run:` step each (Change 1). The `install.sh` §6c WARN block is rewritten from a single-gate grep into a per-gate loop (Change 2): for each of 4 gates whose enforcing artifact is installed, if no kept workflow references it, collect it + its paste-step; print one WARN block when any are missing. Non-destructive, rc=0, no YAML parsing, no new dependency. Tests are bash scripts under `tests/install-sh/` (run individually in `.github/workflows/audit-self.yml`).

**Tech Stack:** Bash (`install.sh` is `#!/usr/bin/env bash`), GitHub Actions YAML templates, bash test harness (`tests/install-sh/*.test.sh`, `ok`/`bad` counters, `seed_install` helper).

**Design spec:** [`docs/superpowers/specs/2026-06-14-brownfield-ci-warn-completeness-design.md`](../specs/2026-06-14-brownfield-ci-warn-completeness-design.md). Approved by maintainer 2026-06-14.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `templates/ts-server/github-actions-ci.yml` | Modify — add 1 step to `lint` job (after line 39) | greenfield ts-server CI runs `check:lintstaged` |
| `packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml` | Modify — add 1 step to `lint` job (after line 36) | greenfield react-next CI runs `check:lintstaged` |
| `install.sh` | Modify — replace §6c block (lines 645-667) | per-gate CI-orphan detection + complete WARN + paste-block |
| `tests/install-sh/r2-glob-reach.test.sh` | Modify — rewrite §#1, add §#4 | proves per-gate WARN accuracy + template wiring |

**Pre-flight facts (verified, do not re-derive):**
- All 4 gate artifacts are shipped to BOTH stacks: `scripts/check-rule-globs.sh` (install.sh:461), `scripts/audit-ai-docs.sh` (install.sh:455), `scripts/check-lintstaged-resolves.sh` (install.sh:465), `.dependency-cruiser.cjs` (install.sh:600 ts / :612 react).
- Both shipped CI templates already have a `lint` job running `bash scripts/check-rule-globs.sh`; the new step goes immediately after it.
- `check-lintstaged-resolves.sh` is CI-safe: skips (exit 0) without `node_modules`, runs after `npm ci`; no husky/extra dep ([check-lintstaged-resolves.sh:20-31](../../../packages/core/audit-self/check-lintstaged-resolves.sh)).
- The old WARN phrase `"NOT into any workflow under .github/workflows"` is grepped ONLY in `r2-glob-reach.test.sh:96,109` (both rewritten here). No other dependents.
- `r2-glob-reach.test.sh` is wired in `.github/workflows/audit-self.yml:294` → these tests run in CI.
- Test scripts do **not** use `set -e` (they capture `$?` after helpers); the `cmd && ok || bad` idiom is safe.

---

## Task 1: Wire `check:lintstaged` into both shipped CI templates

**Files:**
- Modify: `templates/ts-server/github-actions-ci.yml` (after line 39)
- Modify: `packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml` (after line 36)
- Test: `tests/install-sh/r2-glob-reach.test.sh` (new §#4 section)

- [ ] **Step 1: Write the failing test (new §#4 section)**

Append this section to `tests/install-sh/r2-glob-reach.test.sh`, immediately before the final `echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]` line:

```bash
# ══════════════════════════════════════════════════════════════════════════════
# #4 — check:lintstaged wired in BOTH shipped CI templates (#521 Change 1)
# ══════════════════════════════════════════════════════════════════════════════
# `validate` runs 4 gates; the shipped greenfield ci.yml must wire the same 4 so
# {WARN-named} = {greenfield CI} = {validate}. Direct template grep — deterministic.
for _tpl in \
  "$REPO_ROOT/templates/ts-server/github-actions-ci.yml" \
  "$REPO_ROOT/packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml"; do
  grep -q "check-lintstaged-resolves.sh" "$_tpl" \
    && ok "#4: ${_tpl#"$REPO_ROOT"/} wires check:lintstaged" \
    || bad "#4: ${_tpl#"$REPO_ROOT"/} missing check-lintstaged-resolves.sh (validate≠CI drift)"
done
# NEG (non-vacuous): the predicate rejects a body lacking the step.
grep -q "check-lintstaged-resolves.sh" <<<"- run: bash scripts/check-rule-globs.sh" \
  && bad "#4 NEG: predicate matched a body without check:lintstaged → vacuous" \
  || ok "#4 NEG: predicate rejects a template lacking check:lintstaged (non-vacuous)"
```

- [ ] **Step 2: Run the test to verify §#4 fails**

Run: `bash tests/install-sh/r2-glob-reach.test.sh`
Expected: FAIL — two `✗ #4: … missing check-lintstaged-resolves.sh` lines (templates don't have the step yet); the `#4 NEG` line passes.

- [ ] **Step 3: Add the step to the ts-server template**

In `templates/ts-server/github-actions-ci.yml`, in the `lint` job, immediately after line 39 (`        run: bash scripts/check-rule-globs.sh`), add:

```yaml
      - name: lint-staged config resolves (binaries reachable before first commit)
        run: bash scripts/check-lintstaged-resolves.sh
```

- [ ] **Step 4: Add the step to the react-next template**

In `packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml`, in the `lint` job, immediately after line 36 (`        run: bash scripts/check-rule-globs.sh`), add the identical block:

```yaml
      - name: lint-staged config resolves (binaries reachable before first commit)
        run: bash scripts/check-lintstaged-resolves.sh
```

- [ ] **Step 5: Run the test to verify §#4 passes**

Run: `bash tests/install-sh/r2-glob-reach.test.sh`
Expected: the two `#4:` lines now PASS. (Other sections may still pass/fail as before — Task 2 handles §#1.)

- [ ] **Step 6: Commit**

```bash
git add templates/ts-server/github-actions-ci.yml \
        packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml \
        tests/install-sh/r2-glob-reach.test.sh
git commit -m "fix(install): wire check:lintstaged into shipped CI templates — #521 Change 1

Greenfield ci.yml ran 3 of validate's 4 gates; check:lintstaged lived only in the
validate script. Add it to both shipped CI lint jobs so greenfield CI == validate.
CI-safe: the gate skips without node_modules, runs after npm ci.

Prior-art: skipped — wiring an existing gate into shipped CI templates, no new capability."
```

---

## Task 2: Broaden the §6c CI-orphan WARN to per-gate detection + paste-block

**Files:**
- Modify: `install.sh` (replace lines 645-667)
- Test: `tests/install-sh/r2-glob-reach.test.sh` (replace the §#1 section)

- [ ] **Step 1: Rewrite the §#1 test section (write the failing tests first)**

In `tests/install-sh/r2-glob-reach.test.sh`, replace the entire `#1 — CI-orphan WARN` section (from the `# #1 — CI-orphan WARN` banner down to just before the `# #3 — globals dev-dep` banner) with the following. Keep the `seed_install` helper definition at the top of the new section (it is also used by #3):

```bash
# #1 — CI-orphan WARN completeness (brownfield kept ci.yml → gates unwired in CI) — #521
# ══════════════════════════════════════════════════════════════════════════════
# NO --force: the brownfield scenario is the default skip-if-exists path that LEAVES the consumer's
# own ci.yml in place. </dev/null so the #483 dev-dep [y/N] gate reads empty stdin → defaults "no".
seed_install() { # $1 dir, $2 ci.yml body ("" = greenfield), $3 logfile; returns install rc
  printf '{"name":"t507","version":"0.0.0"}\n' > "$1/package.json"
  if [ -n "$2" ]; then mkdir -p "$1/.github/workflows"; printf '%s\n' "$2" > "$1/.github/workflows/ci.yml"; fi
  ( cd "$1" && git init -q && bash "$REPO_ROOT/install.sh" ts-server </dev/null ) > "$3" 2>&1
}
# Brownfield CI wiring NONE of the 4 gates.
BROWNFIELD_CI=$'name: CI\njobs:\n  build:\n    steps:\n      - run: pnpm turbo run lint typecheck test'
# Brownfield CI wiring ONLY the glob gate (the partial case that proves per-gate accuracy).
PARTIAL_CI=$'name: CI\njobs:\n  build:\n    steps:\n      - run: bash scripts/check-rule-globs.sh\n      - run: pnpm turbo run lint typecheck test'

# ── POS-all: none wired → WARN names all 4 (colon forms are WARN-exclusive; install copy-echoes use
#    hyphenated file names) + paste-block has the check:lintstaged step; rc=0; consumer ci.yml intact.
P=$(mktemp -d); LOG=$(mktemp); seed_install "$P" "$BROWNFIELD_CI" "$LOG"; RCP=$?
[ "$RCP" = "0" ] && ok "#1 POS-all: install exited 0 (CI-orphan warn never aborts)" || bad "#1 POS-all: install exited $RCP"
grep -q "CI-orphan" "$LOG" \
  && ok "#1 POS-all: CI-orphan WARN fired on brownfield" \
  || bad "#1 POS-all: no CI-orphan WARN (saw: $(grep -i 'workflow\|validate' "$LOG" | head -1))"
for _g in "check:globs" "arch:check" "audit:docs" "check:lintstaged"; do
  grep -q "$_g" "$LOG" \
    && ok "#1 POS-all: WARN names $_g" \
    || bad "#1 POS-all: WARN omits $_g (under-reporting — the #521 bug)"
done
grep -q "run: bash scripts/check-lintstaged-resolves.sh" "$LOG" \
  && ok "#1 POS-all: paste-block includes the check:lintstaged step" \
  || bad "#1 POS-all: paste-block missing the check:lintstaged step"
grep -q "turbo run lint" "$P/.github/workflows/ci.yml" \
  && ok "#1 POS-all: pre-existing ci.yml left intact (warn is non-destructive)" \
  || bad "#1 POS-all: install mutated the consumer's ci.yml (must be advisory only)"

# ── POS-partial (load-bearing #521 proof): only globs wired → WARN names the OTHER 3, NOT check:globs.
PP=$(mktemp -d); LOGPP=$(mktemp); seed_install "$PP" "$PARTIAL_CI" "$LOGPP"; RCPP=$?
[ "$RCPP" = "0" ] && ok "#1 POS-partial: install exited 0" || bad "#1 POS-partial: install exited $RCPP"
for _g in "arch:check" "audit:docs" "check:lintstaged"; do
  grep -q "$_g" "$LOGPP" \
    && ok "#1 POS-partial: WARN names still-missing $_g" \
    || bad "#1 POS-partial: WARN omits $_g (per-gate detection failed)"
done
# The already-wired glob gate must NOT be named — proves per-gate accuracy, not a blanket warn.
# "check:globs" (colon) is WARN-exclusive; the install copy-echo says "check-rule-globs.sh" (hyphen).
grep -q "check:globs" "$LOGPP" \
  && bad "#1 POS-partial: WARN names the already-wired check:globs (false positive — not per-gate)" \
  || ok "#1 POS-partial: WARN omits the already-wired check:globs (per-gate accuracy)"

# ── NEG (load-bearing): greenfield → shipped ci.yml wires ALL 4 → no warn.
N=$(mktemp -d); LOGN=$(mktemp); seed_install "$N" "" "$LOGN"; RCN=$?
[ "$RCN" = "0" ] && ok "#1 NEG: greenfield install exited 0" || bad "#1 NEG: greenfield install exited $RCN"
for _s in "check-rule-globs.sh" "check-lintstaged-resolves.sh"; do
  grep -q "$_s" "$N/.github/workflows/ci.yml" \
    && ok "#1 NEG: greenfield shipped ci.yml wires $_s" \
    || bad "#1 NEG: greenfield ci.yml missing $_s"
done
grep -q "CI-orphan" "$LOGN" \
  && bad "#1 NEG: CI-orphan warn fired on greenfield (false positive — all gates wired)" \
  || ok "#1 NEG: no CI-orphan warn on greenfield (all gates wired by the shipped ci.yml)"
```

- [ ] **Step 2: Run the test to verify §#1 fails**

Run: `bash tests/install-sh/r2-glob-reach.test.sh`
Expected: FAIL — POS-all `✗` on `CI-orphan` + the `arch:check`/`audit:docs`/`check:lintstaged` names (old WARN says "rule-glob liveness gate", names only globs); POS-partial `✗`. The NEG section passes (old WARN only checks globs, which greenfield wires).

- [ ] **Step 3: Replace the §6c block in `install.sh`**

Replace `install.sh` lines 645-667 (the entire `# ─── 6c. #507 (reopen): glob-liveness gate CI-orphan WARN ───` block, from its banner comment through its closing `fi`) with:

```bash
# ─── 6c. #507 (reopen) + #521: CI-orphan WARN — completeness across ALL enforcement gates ───
# A brownfield consumer's pre-existing ci.yml is KEPT (copy_safe skips it), so the shipped CI's
# enforcement gates run in NO CI job — only on a local `npm run validate`, which a dev must
# remember. #507 warned about the glob gate only; #521 broadens it: for EACH gate whose artifact
# is installed, if no kept workflow references it, name it (with what it enforces) and print a
# ready-to-paste step. Non-destructive (consumer owns their CI) — exit stays 0. Greenfield (install
# wrote ci.yml wiring all gates) → nothing missing → no warn. "check:globs" etc. colon forms are
# WARN-exclusive; the grep patterns also match the hyphenated script names used inside workflows.
if [ "$DRY_RUN" != "--dry-run" ] && [ -d "$PROJECT_ROOT/.github/workflows" ]; then
  _aif_missing=()
  _aif_steps=()
  _aif_gate_check() { # $1 "gate — what it enforces"  $2 wired-grep  $3 installed-artifact  $4 paste-step
    [ -e "$PROJECT_ROOT/$3" ] || return 0          # gate not installed for this stack → nothing to warn
    local _wf
    for _wf in "$PROJECT_ROOT/.github/workflows/"*.yml "$PROJECT_ROOT/.github/workflows/"*.yaml; do
      [ -f "$_wf" ] || continue
      if grep -qE "$2" "$_wf" 2>/dev/null; then return 0; fi   # referenced by some workflow → wired
    done
    _aif_missing+=("$1"); _aif_steps+=("$4")
  }
  _aif_gate_check "check:globs — R2/R7/R8 ESLint-rule liveness"        'check-rule-globs\.sh|check:globs'               "scripts/check-rule-globs.sh"          "- run: bash scripts/check-rule-globs.sh"
  _aif_gate_check "arch:check — R3 architecture boundaries"            'arch:check|depcruise'                           ".dependency-cruiser.cjs"              "- run: npm run arch:check"
  _aif_gate_check "audit:docs — AI-documentation drift"               'audit:docs|audit-ai-docs\.sh'                   "scripts/audit-ai-docs.sh"             "- run: bash scripts/audit-ai-docs.sh"
  _aif_gate_check "check:lintstaged — lint-staged binaries resolve"   'check:lintstaged|check-lintstaged-resolves\.sh' "scripts/check-lintstaged-resolves.sh" "- run: bash scripts/check-lintstaged-resolves.sh"
  if [ "${#_aif_missing[@]}" -gt 0 ]; then
    echo ""
    echo "⚠ CI-orphan: some rule-enforcement gates run in 'npm run validate' but are NOT in any kept workflow under .github/workflows/."
    echo "   A pre-existing CI workflow was kept (install never overwrites it), so these gates fire only on a local"
    echo "   'npm run validate' — CI can stay green while a rule is violated. Gates missing from your CI:"
    for _m in "${_aif_missing[@]}"; do echo "     • $_m"; done
    echo "   Add the missing step(s) to your lint/test job's \`steps:\` (only these):"
    for _s in "${_aif_steps[@]}"; do echo "       $_s"; done
    echo "   (or re-run install with --force to adopt the shipped ci.yml that wires them — but --force overwrites"
    echo "    ALL kept files, e.g. vitest.config.ts / .prettierignore, not just the workflow)."
  fi
  unset -f _aif_gate_check
fi
```

- [ ] **Step 4: Run the test to verify §#1 passes**

Run: `bash tests/install-sh/r2-glob-reach.test.sh`
Expected: PASS — all `#1 POS-all`, `#1 POS-partial`, `#1 NEG` lines `✓`; final `PASS=N FAIL=0`.

- [ ] **Step 5: Run a dry-run smoke (guard against the WARN aborting install under set -euo pipefail)**

Run:
```bash
T=$(mktemp -d); cd "$T"; git init -q
printf '{"name":"smoke","version":"0.0.0"}\n' > package.json
mkdir -p .github/workflows
printf 'name: CI\njobs:\n  build:\n    steps:\n      - run: echo hi\n' > .github/workflows/ci.yml
bash "$REPO_ROOT/install.sh" ts-server </dev/null; echo "install rc=$?"
cd - >/dev/null
```
Expected: install prints the 4-gate CI-orphan WARN and `install rc=0` (the block never aborts). Replace `$REPO_ROOT` with the repo root path.

- [ ] **Step 6: Commit**

```bash
git add install.sh tests/install-sh/r2-glob-reach.test.sh
git commit -m "fix(install): brownfield CI-orphan WARN names every missing gate + paste-block — #521

§6c warned only about check:globs; arch:check (R3), audit:docs, check:lintstaged were
silently unwarned. Rewrite as a per-gate loop: for each gate whose artifact is installed
and that no kept workflow references, name it (with what it enforces) and print a paste
step. Non-destructive, rc=0, no YAML parser. POS-partial test proves per-gate accuracy.

Prior-art: skipped — WARN-completeness fix on an existing block, no new capability."
```

---

## Task 3: Full-suite verification + greenfield-green acceptance

**Files:** none (verification only).

- [ ] **Step 1: Run the full `install-sh` bash suite locally (no regression)**

Run:
```bash
fail=0
for t in tests/install-sh/*.test.sh; do
  echo "── $t"; bash "$t" || { echo "FAILED: $t"; fail=1; }
done
echo "suite fail=$fail"
```
Expected: `suite fail=0`. If any test fails, fix before proceeding. (These bash tests do not need `npm` deps.)

- [ ] **Step 2: Acceptance — greenfield `check:lintstaged` is green in a CI-like run (the one read-unverifiable claim)**

This confirms Change 1 doesn't break fresh consumers' CI. It needs `node_modules`, so run only where deps can install:
```bash
G=$(mktemp -d); cd "$G"; git init -q
printf '{"name":"gf","version":"0.0.0"}\n' > package.json
bash "$REPO_ROOT/install.sh" ts-server --full   # --full installs dev-deps non-interactively
bash scripts/check-lintstaged-resolves.sh; echo "check:lintstaged rc=$?"
cd - >/dev/null
```
Expected: `check:lintstaged rc=0` (either "no node_modules — skipped" if `--full` deps didn't land offline, or "OK"). **If network/deps are unavailable in this environment, do NOT fabricate a pass** — record "deferred: greenfield-green to be confirmed by the shipped ci.yml's own first run / a consumer-mode CI test" in the final report and flag it to the maintainer.

- [ ] **Step 3: Confirm no other test depended on the old WARN wording**

Run: `grep -rn "NOT into any workflow\|rule-glob liveness gate" tests/ .github/`
Expected: no matches (the only two were rewritten in Task 2). If any appear, update them to grep `"CI-orphan"`.

- [ ] **Step 4: Push the branch + update PR #522 (transport note)**

SSH to github is dead in this environment (proxy tunnel blocks `github.com:22`). Push via the gh Git Data API, rebasing the implementation commits onto the current `staging` tip so the PR diff stays clean (the spec commit is already on the remote branch as `db98ac03`). After push, update the PR #522 title/body to drop the `SPEC-ONLY` banner (it now contains the implementation). See memory `feedback_diagnose_fix_remote_pr_via_gh_api` for the blob→tree→commit→ref method; base each new tree on the live `staging` tree to avoid reverting staging-delta.

Expected: PR #522 shows spec + Change 1 + Change 2 + tests; `audit-self.yml` runs `r2-glob-reach.test.sh` green.

---

## Self-Review

**1. Spec coverage:**
- Change 1 (wire `check:lintstaged` into both CI templates) → Task 1. ✓
- Change 2 (per-gate detect + complete WARN + paste-block + honest `--force`) → Task 2 Step 3. ✓
- Detection spec (4 gates, grep patterns, install-present guard) → Task 2 `_aif_gate_check` calls. ✓
- Invariants preserved (non-destructive, rc=0, dry-run, pipefail-safe via `if grep` in condition) → Task 2 block + Step 5 smoke. ✓
- Test plan (POS-all, POS-partial per-gate accuracy, NEG all-4-wired, template assertion) → Task 1 §#4 + Task 2 §#1. ✓
- Greenfield-green empirical caveat → Task 3 Step 2 (with no-fabrication guard). ✓
- Non-goals (no YAML parser, no `--wire-ci`) → honored; nothing in the plan adds them. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full bash/YAML. ✓

**3. Type/name consistency:** WARN marker `CI-orphan` is grepped identically in POS (present) and NEG (absent). Gate colon-labels (`check:globs`/`arch:check`/`audit:docs`/`check:lintstaged`) match between the `_aif_gate_check` first-arg and the test greps. Paste-step `- run: bash scripts/check-lintstaged-resolves.sh` matches between the block and the POS-all grep. Helper `seed_install` signature unchanged from the original. ✓
