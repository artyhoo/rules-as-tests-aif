# Harvest skill + local CI-equivalent sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `/harvest` skill + shared `scripts/run-local-ci-sweep.sh` that runs the local CI-equivalent gate set (diff-aware, fail-safe to full, cheapest-first/fail-fast) before pushing a harvested aif branch, so the recurring "pushed, CI reddened on a gate I didn't re-run" failure becomes unmissable.

**Architecture:** One executable artefact (`run-local-ci-sweep.sh`) is the SSOT of the local gate set; a thin `/harvest` SKILL.md wires egress + cross-stage integration + the sweep gate for standalone harvests; `/dispatcher §2.4` calls the same script. Diff-aware scope is the repo's own change-scoped-gate pattern (SSOT #114) applied to the sweep.

**Tech Stack:** Bash (target **bash 3.2** — macOS default, no `globstar`/associative arrays), vitest (principle tests), the existing `tests/install-sh/*` + `packages/core` gate suites the sweep aggregates.

**Spec:** [docs/superpowers/specs/2026-06-26-harvest-skill-design.md](../specs/2026-06-26-harvest-skill-design.md)

## Global Constraints

- **bash 3.2 compatible** — no `globstar` (`**`), no associative arrays (`declare -A`), no `${var,,}`. Use prefix/suffix `case` matching and newline-delimited strings. (`install.sh` already targets 3.2.)
- **No-paid-LLM** — every gate is deterministic (bash/vitest/tsc/actionlint); zero API calls.
- **False-green is the worst failure** — when in doubt the sweep escalates to `--full`; it never silently narrows the gate set.
- **`/harvest` is repo-internal** — it harvests aif branches (operator-only); it is **NOT** added to the `setup.d/10-skills.sh` ship allowlist (peer of `self-reflection`/`ai-doc`). Therefore zero install/byte-identical impact.
- **Sweep's own test MUST stub gates** via `SWEEP_GATES_FILE` + `SWEEP_DIFF_OVERRIDE` seams — never invoke the real ~5-min suite from the test.
- **Output language:** all artefacts English. Operator chat is Russian (out of scope for these files).
- **Commit trailers:** the SKILL.md introducing commit carries a `Prior-art:` trailer (principle 11 scopes `.claude/skills/*/SKILL.md`). The script lives under `scripts/` (not `packages/`) → not a capability-commit, but the **SSOT entry ships in the same commit** as the script (build-first-reuse-default.md §3).

---

## File Structure

- **Create** `scripts/run-local-ci-sweep.sh` — the aggregator (runner + gate table + diff-aware scope).
- **Create** `scripts/run-local-ci-sweep.test.sh` — paired-negative test (stubbed gates), wired into CI like `scripts/ci-success-gate.test.sh`.
- **Create** `.claude/skills/harvest/SKILL.md` — thin wiring skill (egress + cross-stage + sweep gate + cold-review).
- **Modify** `.github/workflows/audit-self.yml` — add a `run:` step for the sweep test (principles-meta-tests job).
- **Modify** `.claude/skills/dispatcher/SKILL.md` (§2.4) — call the sweep before push.
- **Modify** `docs/meta-factory/prior-art-evaluations.md` — new SSOT entry (REUSE posture + ADAPT change-scope + BUILD aggregator).

---

## Task 1: Sweep runner core — gate iteration, fail-fast, exit codes (stub-driven)

Build the engine first with **stubbed** gates, so the control flow is tested without the real 5-min suite.

**Files:**
- Create: `scripts/run-local-ci-sweep.sh`
- Test: `scripts/run-local-ci-sweep.test.sh`

**Interfaces:**
- Produces: an executable accepting `--full`, `--base <ref>`, `--capture`; honouring `SWEEP_GATES_FILE` (tab-separated `rank<TAB>name<TAB>trigger<TAB>command`, one gate per line) and `SWEEP_DIFF_OVERRIDE` (newline/space list of changed paths) for testing. Exit 0 if all selected gates pass; exit 1 on the first FAIL (fail-fast).
- Output: one `PASS`/`FAIL`/`WARN-skip` line per gate (prefixed `[sweep]`), a final `SWEEP: <n> ran, <k> pass, <f> fail` summary line.

- [ ] **Step 1: Write the failing test (runner basics)**

Create `scripts/run-local-ci-sweep.test.sh`:

```bash
#!/usr/bin/env bash
# Paired-negative test for run-local-ci-sweep.sh. Stubs all gates — never runs the real suite.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SWEEP="$HERE/run-local-ci-sweep.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
fails=0
check() { # check <desc> <expected-rc> <actual-rc>
  if [ "$2" = "$3" ]; then echo "  ✓ $1"; else echo "  ✗ $1 (want rc=$2 got rc=$3)"; fails=$((fails+1)); fi
}
grep_out() { # grep_out <desc> <pattern> <file>
  if grep -qF "$2" "$3"; then echo "  ✓ $1"; else echo "  ✗ $1 (missing: $2)"; fails=$((fails+1)); fi
}

# --- (pos) all stubbed gates green → rc 0, all PASS ---
printf '1\tcheap\tALWAYS\ttrue\n2\tmid\tALWAYS\ttrue\n' > "$TMP/gates.tsv"
SWEEP_GATES_FILE="$TMP/gates.tsv" SWEEP_DIFF_OVERRIDE="x.txt" bash "$SWEEP" --full >"$TMP/o1" 2>&1
check "all-green exits 0" 0 $?
grep_out "all-green reports PASS" "PASS" "$TMP/o1"

# --- (neg) a gate fails → rc 1, fail-fast (later gate never runs) ---
printf '1\tcheapfail\tALWAYS\tfalse\n2\texpensive\tALWAYS\ttouch %s/RAN\n' "$TMP" > "$TMP/gates.tsv"
SWEEP_GATES_FILE="$TMP/gates.tsv" SWEEP_DIFF_OVERRIDE="x.txt" bash "$SWEEP" --full >"$TMP/o2" 2>&1
check "one-fail exits 1" 1 $?
grep_out "failing gate reported FAIL" "FAIL" "$TMP/o2"
if [ -e "$TMP/RAN" ]; then echo "  ✗ fail-fast: later gate ran"; fails=$((fails+1)); else echo "  ✓ fail-fast: later gate skipped"; fi

[ "$fails" -eq 0 ] && { echo "run-local-ci-sweep: ALL PASS"; exit 0; } || { echo "run-local-ci-sweep: $fails FAIL"; exit 1; }
```

*(Each `check`/`grep_out`/inline assertion bumps `$fails`; the script exits non-zero iff any assertion failed.)*

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash scripts/run-local-ci-sweep.test.sh`
Expected: FAIL — `run-local-ci-sweep.sh` does not exist yet (`No such file`).

- [ ] **Step 3: Write the minimal runner**

Create `scripts/run-local-ci-sweep.sh`:

```bash
#!/usr/bin/env bash
# run-local-ci-sweep.sh — local CI-equivalent gate sweep for harvest pre-push.
# Default: diff-aware (vs merge-base), cheapest-first, fail-fast, fail-safe to full.
# Spec: docs/superpowers/specs/2026-06-26-harvest-skill-design.md
# bash 3.2 compatible (no globstar / associative arrays).
set -uo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MODE="diff"; BASE_REF=""; export CAPTURE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --full) MODE="full" ;;
    --base) shift; BASE_REF="${1:-}" ;;
    --capture) CAPTURE=1 ;;
    *) echo "[sweep] unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

# Gate table: rank<TAB>name<TAB>trigger<TAB>command. Overridable for tests.
gate_table() {
  if [ -n "${SWEEP_GATES_FILE:-}" ]; then cat "$SWEEP_GATES_FILE"; return; fi
  # Real table is added in Task 2.
  printf ''
}

ran=0; pass=0; fail=0
# Sort by rank (column 1), iterate cheapest-first.
gate_table | sort -t"$(printf '\t')" -k1,1n | while IFS="$(printf '\t')" read -r rank name trigger cmd; do
  [ -z "${name:-}" ] && continue
  ran=$((ran+1))
  if eval "$cmd" >/dev/null 2>&1; then
    echo "[sweep] PASS $name"; pass=$((pass+1))
  else
    echo "[sweep] FAIL $name"; echo "SWEEP: stopped at $name"; exit 1
  fi
done
rc=$?
[ "$rc" -ne 0 ] && exit "$rc"
echo "SWEEP: all selected gates passed"
exit 0
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash scripts/run-local-ci-sweep.test.sh`
Expected: PASS — all-green exits 0, one-fail exits 1, fail-fast skips the later gate.

- [ ] **Step 5: `chmod +x` and commit**

```bash
chmod +x scripts/run-local-ci-sweep.sh scripts/run-local-ci-sweep.test.sh
git add scripts/run-local-ci-sweep.sh scripts/run-local-ci-sweep.test.sh
git commit -m "feat(harvest): sweep runner core — cheapest-first, fail-fast (stub-driven test)"
```

---

## Task 2: Diff-aware scope + fail-safe-to-full + real gate table

Add path→gate selection and the real `--full` gate set.

**Files:**
- Modify: `scripts/run-local-ci-sweep.sh`
- Modify: `scripts/run-local-ci-sweep.test.sh`

**Interfaces:**
- Consumes: Task 1 runner loop.
- Produces: diff-aware default (only gates whose `trigger` matches a changed path), `--full` override (all gates), fail-safe escalation (any changed path matching no gate's trigger → MODE=full).

- [ ] **Step 1: Add scope tests (append to the test file, before the final summary)**

```bash
# --- (diff-aware) md-only diff selects the doc gate, not the shipped gate ---
printf '1\tdoc\t.md\ttrue\n4\tbyte\tSHIPPED\ttouch %s/BYTE\n' "$TMP" > "$TMP/gates.tsv"
SWEEP_GATES_FILE="$TMP/gates.tsv" SWEEP_DIFF_OVERRIDE="README.md" bash "$SWEEP" >"$TMP/o3" 2>&1
check "md diff exits 0" 0 $?
grep_out "md diff ran doc gate" "PASS doc" "$TMP/o3"
[ -e "$TMP/BYTE" ] && { echo "  ✗ md diff wrongly ran shipped gate"; fails=$((fails+1)); } || echo "  ✓ md diff skipped shipped gate"

# --- (fail-safe) an unmapped path escalates to full (runs every gate) ---
printf '1\tdoc\t.md\ttrue\n2\tother\tpackages/\ttouch %s/OTHER\n' "$TMP" > "$TMP/gates.tsv"
SWEEP_GATES_FILE="$TMP/gates.tsv" SWEEP_DIFF_OVERRIDE="weird/unmapped.bin" bash "$SWEEP" >"$TMP/o4" 2>&1
[ -e "$TMP/OTHER" ] && echo "  ✓ unmapped path escalated to full (ran all gates)" || { echo "  ✗ unmapped path did not escalate"; fails=$((fails+1)); }
```

- [ ] **Step 2: Run the test to verify the new cases fail**

Run: `bash scripts/run-local-ci-sweep.test.sh`
Expected: FAIL on the diff-aware + fail-safe cases (scope logic not yet implemented; default mode currently runs nothing or everything).

- [ ] **Step 3: Implement scope selection**

In `run-local-ci-sweep.sh`, replace the `gate_table | sort ... | while ...` block with selection logic. Add before the loop:

```bash
# --- compute changed paths (vs merge-base) ---
changed_paths() {
  if [ -n "${SWEEP_DIFF_OVERRIDE:-}" ]; then printf '%s\n' $SWEEP_DIFF_OVERRIDE; return; fi
  local base="${BASE_REF:-$(git merge-base origin/staging HEAD 2>/dev/null || echo HEAD~1)}"
  git diff --name-only "$base"...HEAD
}

# trigger matches a path? trigger is ALWAYS | SHIPPED | a prefix (ends with /) | a suffix (starts with .)
trigger_matches() { # trigger_matches <trigger> <path>
  local trig="$1" p="$2"
  case "$trig" in
    ALWAYS) return 0 ;;
    SHIPPED)
      case "$p" in
        skills/*|agents/*|packages/core/templates/*|packages/preset-*/*|.claude/rules/*) return 0 ;;
        *.md) case "$p" in .claude/skills/*) return 0 ;; esac ;;
      esac
      return 1 ;;
    .*) case "$p" in *"$trig") return 0 ;; esac; return 1 ;;   # suffix
    */) case "$p" in "$trig"*) return 0 ;; esac; return 1 ;;   # prefix
    *)  case "$p" in $trig) return 0 ;; esac; return 1 ;;      # literal/glob
  esac
}

CHANGED="$(changed_paths)"
# Fail-safe: any changed path matching NO gate trigger → escalate to full.
if [ "$MODE" = "diff" ] && [ -n "$CHANGED" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    matched=0
    while IFS="$(printf '\t')" read -r r n trig c; do
      [ -z "${n:-}" ] && continue
      if trigger_matches "$trig" "$p"; then matched=1; break; fi
    done <<EOF
$(gate_table)
EOF
    if [ "$matched" -eq 0 ]; then echo "[sweep] unmapped path '$p' → escalating to --full"; MODE="full"; break; fi
  done <<EOF
$CHANGED
EOF
fi
```

Then make the run loop select per-mode. Replace the loop body's gate iteration with a selection guard:

```bash
gate_selected() { # gate_selected <trigger>
  [ "$MODE" = "full" ] && return 0
  local trig="$1" p
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if trigger_matches "$trig" "$p"; then return 0; fi
  done <<EOF
$CHANGED
EOF
  return 1
}
```

And in the run loop, `gate_selected "$trigger" || continue` before running each gate.

- [ ] **Step 4: Add the real gate table** (replace the `printf ''` placeholder in `gate_table()`):

```bash
  printf '%s\n' \
    "1$(printf '\t')meta-all-wired$(printf '\t')tests/install-sh/$(printf '\t')bash tests/install-sh/meta-all-wired.test.sh" \
    "1$(printf '\t')md-line-gate$(printf '\t').md$(printf '\t')bash packages/core/audit-self/md-line-gate.sh ." \
    "1$(printf '\t')actionlint$(printf '\t').github/workflows/$(printf '\t')command -v actionlint >/dev/null 2>&1 && actionlint || echo SKIP-actionlint-absent" \
    "2$(printf '\t')format-check$(printf '\t')SHIPPED$(printf '\t')npm run format:check" \
    "2$(printf '\t')render-check$(printf '\t').claude/rules/$(printf '\t')npx tsx packages/core/render/render-rules.ts --check" \
    "3$(printf '\t')typecheck$(printf '\t')packages/$(printf '\t')npm run typecheck" \
    "4$(printf '\t')byte-identical$(printf '\t')SHIPPED$(printf '\t')SNAPSHOT_MODE=compare bash tests/install-sh/byte-identical.test.sh" \
    "5$(printf '\t')install-sh-suite$(printf '\t')tests/install-sh/$(printf '\t')for t in tests/install-sh/*.test.sh; do bash \"\$t\" || exit 1; done" \
    "5$(printf '\t')agnosticism$(printf '\t')packages/core/$(printf '\t')bash tests/agnosticism/harness-self.test.sh" \
    "6$(printf '\t')vitest-principles$(printf '\t')packages/core/$(printf '\t')npm --prefix packages/core run test:principles" \
    "6$(printf '\t')vitest-hooks$(printf '\t')packages/core/$(printf '\t')npm --prefix packages/core run test:hooks" \
    "6$(printf '\t')vitest-render$(printf '\t')packages/core/$(printf '\t')npm --prefix packages/core run test:render"
```

> **`--full` superset note:** `setup.d/` + `install.sh` diffs trigger byte-identical + install-sh-suite via fail-safe escalation (they match no narrow gate → full). The heavy `framework-self-*` matrix stays CI-only by design (spec §Known gaps).

- [ ] **Step 5: Run the test to verify all cases pass**

Run: `bash scripts/run-local-ci-sweep.test.sh`
Expected: PASS — runner + diff-aware + fail-safe all green.

- [ ] **Step 6: Commit**

```bash
git add scripts/run-local-ci-sweep.sh scripts/run-local-ci-sweep.test.sh
git commit -m "feat(harvest): diff-aware scope, fail-safe-to-full, real gate table"
```

---

## Task 3: Wire the test into CI + SSOT entry + real self-verify

**Files:**
- Modify: `.github/workflows/audit-self.yml`
- Modify: `docs/meta-factory/prior-art-evaluations.md`

- [ ] **Step 1: Add the SSOT entry.** Find the next free id: `grep -oE '^\| [0-9]+ ' docs/meta-factory/prior-art-evaluations.md | sort -n | tail -1`. Append a row `<N> | Local CI-equivalent gate sweep (run-local-ci-sweep.sh) — change-scoped aggregator | ... | BUILD | <the 6-item search evidence from the spec: act REJECT, husky/lint-staged ADAPT #114, superpowers REUSE-posture> | Revisit if act gains lightweight change-scoped local-gate selection.`

- [ ] **Step 2: Wire the sweep test into `audit-self.yml`** (principles-meta-tests job, next to the `ci-success-gate.test.sh` step):

```yaml
      - name: Run local-ci-sweep paired-negative (harvest sweep aggregator)
        run: bash scripts/run-local-ci-sweep.test.sh
```

- [ ] **Step 3: Verify meta-gate awareness.** `meta-all-wired.test.sh` covers only `tests/install-sh/*`; the sweep test lives in `scripts/`, so manual wiring (Step 2) is the mechanism, mirroring `ci-success-gate.test.sh`. Confirm: `grep -c 'run-local-ci-sweep.test.sh' .github/workflows/audit-self.yml` → `1`.

- [ ] **Step 4: Real self-verify against actual gates.** Run the sweep for real on a known-clean diff and on a forced shipped-touch:

```bash
# diff-aware on the current branch (should select doc/script gates only)
bash scripts/run-local-ci-sweep.sh
# full override (the true CI-equivalent; expect ~5 min, may surface the pre-existing layer-units base red — interpret vs base)
bash scripts/run-local-ci-sweep.sh --full
```

Expected: diff-aware run completes in seconds and reports only selected gates; `--full` runs the suite. **A pre-existing base red (e.g. `layer-units`) is surfaced, not a regression** — confirm it also reds on `origin/staging`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/audit-self.yml docs/meta-factory/prior-art-evaluations.md
git commit -m "feat(harvest): wire sweep test into CI + SSOT entry for the aggregator"
```

---

## Task 4: `/harvest` SKILL.md

**Files:**
- Create: `.claude/skills/harvest/SKILL.md`

**Interfaces:**
- Consumes: `scripts/run-local-ci-sweep.sh` (Task 1-2), `harvest.ts` / `harvest-via-api.sh` (existing).
- Produces: a `/harvest` slash command (`disable-model-invocation: true`) — the standalone post-acceptance procedure.

- [ ] **Step 1: Write the SKILL.md.** Model structure on `.claude/skills/dispatcher/SKILL.md`. MUST include, in order:
  1. **Frontmatter** — `name: harvest`, a trigger `description`, `disable-model-invocation: true`.
  2. **Doc-authority header** (principle 09) — `> **Class:** C — ...`, `> **Authoritative for:** the /harvest standalone post-aif-acceptance procedure ...`, `> **NOT authoritative for:** project goal — see README ...; egress primitives (harvest.ts) ...`.
  3. **BFR verdict line** (principle 11) — an explicit verdict, e.g. `> Build-vs-reuse: ADAPT (reuses harvest.ts egress + run-local-ci-sweep.sh; SSOT #<N>).`
  4. **§1-§4 procedure** — the four steps from spec Unit 2: (1) Egress with the **9 codified gotchas** (each one-liner with its rule, from `feedback_aif_harvest_egress_gotchas`); (2) Cross-stage integration (blob-compare, tests-as-falsifier); (3) Sweep gate — `bash scripts/run-local-ci-sweep.sh` (default diff-aware), interpret vs merge-base, STOP on branch-introduced red; (4) Cold-review via `superpowers:requesting-code-review` + §1.7 PR body + push/PR.
  5. **Paired-negative block** (principle 15) — `## Without this skill` and `## With this skill`, each ≥40 chars, differing (model on dispatcher's "Why this skill exists" framing: without → operator hand-runs a subset, CI reddens; with → one command runs the scoped gate set, the forgotten step is unforgettable).

- [ ] **Step 2: Verify principle tests green**

Run: `npm --prefix packages/core run test:principles`
Expected: PASS — including principle 09 (header), 11 (BFR verdict), 15 (paired-negative), 22 (English). If 11 fails (F1 — needs Prior-art/SSOT): ensure the SSOT id from Task 3 is referenced in the BFR line AND the commit (Step 3) carries the trailer.

- [ ] **Step 3: Commit with Prior-art trailer**

```bash
git add .claude/skills/harvest/SKILL.md
git commit -m "feat(harvest): /harvest skill — standalone egress + cross-stage + sweep gate

Prior-art: prior-art-evaluations.md#<N> (BUILD aggregator + ADAPT change-scope #114 + REUSE superpowers verify-posture)."
```

---

## Task 5: `/dispatcher §2.4` wiring

**Files:**
- Modify: `.claude/skills/dispatcher/SKILL.md` (§2.4 — around line 107-115)

- [ ] **Step 1: Add the sweep call to §2.4.** Before the `harvest.ts` push description, insert a sentence + command: the dispatcher runs `bash scripts/run-local-ci-sweep.sh` (diff-aware) on the harvested branch before push; a branch-introduced red HALTs harvest (surface, don't push). Cite the shared script (no dual-prompt drift — `dual-implementation-discipline.md §7`).

- [ ] **Step 2: Verify dispatcher principle tests still green**

Run: `npm --prefix packages/core run test:principles`
Expected: PASS (dispatcher is EXEMPT from principle 15; its header/BFR already present — edit must not break them).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/dispatcher/SKILL.md
git commit -m "feat(harvest): wire run-local-ci-sweep into /dispatcher §2.4 (same script, no drift)"
```

---

## Task 6: Final full self-verify (the sweep on its own change)

- [ ] **Step 1: Run the sweep's own test + the principle suite + a dogfood run.**

```bash
bash scripts/run-local-ci-sweep.test.sh
npm --prefix packages/core run test:principles
npm run format:check                      # this PR touched md + sh + skill
bash scripts/run-local-ci-sweep.sh        # diff-aware on this very branch — dogfood
```

Expected: all green except a confirmed-pre-existing base red (interpret vs `origin/staging`). This is the recursive self-application check: the harvest sweep runs on the harvest-sweep PR.

- [ ] **Step 2: Open the PR** with a §1.7 body (Forward: no-paid-llm, build-first-reuse ADAPT/BUILD with the 6-item search, dual-implementation §7, memory-codification §3 for the 9 gotchas; Backward: extends harvest surface, supersedes nothing). Base `staging`.

---

## Self-Review

**Spec coverage:** Unit 1 → Tasks 1-3; Unit 2 → Task 4; Unit 3 → Task 5; diff-aware/fail-safe/cheapest-first → Task 2; CI-equivalence gaps (pr-commit-trailers, zizmor, framework-self) → documented in spec, sweep behaviour (WARN-skip / CI-only) reflected in the gate table + escalation; SSOT entry → Task 3; recursive self-application → Task 6. No gap.

**Placeholder scan:** `<N>` (SSOT id) is resolved in Task 3 Step 1 and threaded into Tasks 3-4 — it is a lookup, not a placeholder. No "TODO/TBD" steps.

**Type consistency:** the seams `SWEEP_GATES_FILE` / `SWEEP_DIFF_OVERRIDE`, the `rank<TAB>name<TAB>trigger<TAB>command` schema, and the `trigger_matches`/`gate_selected`/`gate_table` function names are used identically across Tasks 1-2 and the test.
