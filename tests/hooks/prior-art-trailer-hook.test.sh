#!/usr/bin/env bash
# Anti-tautology guard for the Phase 8.8 T8 pre-push hook (section 7 —
# capability commit detection + Prior-art: trailer validation).
#
# Independence: tests instrument the hook through a subprocess in an
# isolated tmpdir; sub-tests do NOT exercise the hook against the test
# script's own commits. The hook file under test is the canonical one
# at $REPO_ROOT/.husky/pre-push (single source of truth — no inlined
# logic copy in this test).
#
# External commands invoked by sections 1-6 of the hook (actionlint,
# zizmor, npx, npm, packages/core/audit-self/audit-ai-docs.test.sh) are
# stubbed to noop exit 0 so the test isolates section 7's behaviour.
#
# Sub-tests:
#   1. positive: new dep + valid trailer  → exit 0
#   2. negative: new dep + no trailer     → exit 1 (capability flagged)
#   3. positive: new dep + valid escape hatch  → exit 0
#   4. negative: short escape hatch ("Prior-art: skipped — TODO") → exit 1
#   5. mutation: invert trailer regex → sub-test 1 must fail
#   6. mutation: drop capability detection → sub-test 2 must fail
#
# CI: invoked from .github/workflows/audit-self.yml#principles-meta-tests.

set -uo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
HOOK_FILE="$REPO_ROOT/.husky/pre-push"

PASS=0
FAIL=0

# ── Setup helpers ────────────────────────────────────────────────────────────

# make_test_repo: creates a tmp git repo with origin/main set up + stub
# binaries for sections 1-6 of the hook (actionlint/zizmor/npx/npm noops +
# audit-ai-docs.test.sh stub). Echoes the tmp path.
make_test_repo() {
  local tmp
  tmp=$(mktemp -d)
  git -C "$tmp" init --quiet --initial-branch=main >/dev/null
  git -C "$tmp" config user.email "test@example.com"
  git -C "$tmp" config user.name "test"
  echo '{"name":"test","version":"0.0.0"}' > "$tmp/package.json"
  git -C "$tmp" add package.json
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "init"
  # Synthesize origin/main pointing at the init commit so the hook's
  # `git rev-parse --verify origin/main` succeeds.
  git -C "$tmp" update-ref refs/remotes/origin/main HEAD

  # Stubs for external commands hooks 1-6 invoke unconditionally.
  mkdir -p "$tmp/_stub_bin"
  for cmd in actionlint zizmor npx npm; do
    cat > "$tmp/_stub_bin/$cmd" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
    chmod +x "$tmp/_stub_bin/$cmd"
  done
  # Stub the audit script invoked by section 3
  mkdir -p "$tmp/packages/core/audit-self"
  cat > "$tmp/packages/core/audit-self/audit-ai-docs.test.sh" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$tmp/packages/core/audit-self/audit-ai-docs.test.sh"

  echo "$tmp"
}

# run_hook: invokes the hook in the tmp repo, returns its exit code.
run_hook() {
  local repo="$1" hook="$2"
  (
    cd "$repo"
    PATH="$repo/_stub_bin:$PATH" bash "$hook" >/dev/null 2>&1
  )
}

# add_capability_commit: adds a new dep to package.json (multi-line JSON
# matching real package.json format — the hook's regex anchors on
# `^\+\s+"NAME":\s+"VERSION"` against indented dep entries) and commits
# with the given commit message (subject + optional body lines).
add_capability_commit() {
  local repo="$1"; shift
  cat > "$repo/package.json" <<'PKG'
{
  "name": "test",
  "version": "0.0.0",
  "dependencies": {
    "some-new-dep": "^1.0.0"
  }
}
PKG
  git -C "$repo" add package.json
  local args=()
  for msg in "$@"; do args+=("-m" "$msg"); done
  git -C "$repo" -c commit.gpgsign=false commit -q "${args[@]}"
}

# record: print PASS/FAIL counter line.
record() {
  local outcome="$1" desc="$2"
  if [ "$outcome" = "pass" ]; then
    PASS=$((PASS+1))
    printf 'PASS: %s\n' "$desc"
  else
    FAIL=$((FAIL+1))
    printf 'FAIL: %s\n' "$desc"
  fi
}

# ── Sub-tests ────────────────────────────────────────────────────────────────

# Test 1: capability change (new dep) + valid Prior-art trailer → hook exits 0
test_1_positive_dep_with_trailer() {
  local repo
  repo=$(make_test_repo)
  add_capability_commit "$repo" \
    "feat: add new-dep" \
    "Body explaining why we add new-dep." \
    "Prior-art: prior-art-evaluations.md#1 (Autogrep, verdict DEFER — different domain, no overlap)."
  if run_hook "$repo" "$HOOK_FILE"; then
    record pass "1 — capability + valid trailer → exit 0"
  else
    record fail "1 — capability + valid trailer expected exit 0, got $?"
  fi
  rm -rf "$repo"
}

# Test 2: capability change + NO trailer → hook exits non-zero
test_2_negative_dep_no_trailer() {
  local repo
  repo=$(make_test_repo)
  add_capability_commit "$repo" \
    "feat: add new-dep without trailer" \
    "Body explaining the change but no Prior-art line."
  if run_hook "$repo" "$HOOK_FILE"; then
    record fail "2 — capability + no trailer should have failed but exited 0"
  else
    record pass "2 — capability + no trailer → exit non-zero"
  fi
  rm -rf "$repo"
}

# Test 3: capability change + valid escape-hatch trailer → exit 0
test_3_positive_escape_hatch() {
  local repo
  repo=$(make_test_repo)
  add_capability_commit "$repo" \
    "chore: bump dep" \
    "Body." \
    "Prior-art: skipped — refactor only, no new capability"
  if run_hook "$repo" "$HOOK_FILE"; then
    record pass "3 — escape hatch (substantive rationale) → exit 0"
  else
    record fail "3 — escape hatch (substantive rationale) expected exit 0, got $?"
  fi
  rm -rf "$repo"
}

# Test 4: short escape-hatch rationale → exit non-zero
test_4_negative_short_escape() {
  local repo
  repo=$(make_test_repo)
  add_capability_commit "$repo" \
    "chore: bump dep" \
    "Body." \
    "Prior-art: skipped — TODO"
  if run_hook "$repo" "$HOOK_FILE"; then
    record fail "4 — short escape hatch should have failed but exited 0"
  else
    record pass "4 — short escape hatch (<20 chars rationale) → exit non-zero"
  fi
  rm -rf "$repo"
}

# Test 5 (mutation): replace `Prior-art:` matcher with one that never matches
# → sub-test 1's positive case should now fail (hook can't see the trailer).
test_5_mutation_invert_trailer_match() {
  local repo
  repo=$(make_test_repo)
  add_capability_commit "$repo" \
    "feat: add new-dep with valid trailer" \
    "Body." \
    "Prior-art: prior-art-evaluations.md#1 (valid trailer, ≥20 chars rationale)."
  # Mutate the hook: rewrite the Prior-art:* case head to a literal that
  # nothing ever matches. Copy the hook to a tmp file, sed-mutate, run.
  local mutated="$repo/_mutated_pre_push"
  sed 's/Prior-art:\*)/__NEVER_MATCH_LITERAL__)/' "$HOOK_FILE" > "$mutated"
  chmod +x "$mutated"
  if run_hook "$repo" "$mutated"; then
    record fail "5 — mutated hook (no-match) wrongly accepted a capability commit; the real hook's trailer-matching is therefore not load-bearing in test 1 (anti-tautology violation)"
  else
    record pass "5 — mutation (Prior-art:* → __NEVER_MATCH__) caused capability commit to fail; trailer-matching is load-bearing"
  fi
  rm -rf "$repo"
}

# Test 6 (mutation): break capability detection (force pa_detect_capability_reason
# to always return non-zero) → sub-test 2's negative case should pass through
# (hook never flags the capability commit, so trailer absence is invisible).
test_6_mutation_drop_capability_detection() {
  local repo
  repo=$(make_test_repo)
  add_capability_commit "$repo" \
    "feat: add new-dep, NO trailer" \
    "Body without trailer."
  local mutated="$repo/_mutated_pre_push"
  # Replace the body of pa_detect_capability_reason with a single `return 1`
  # so detection always reports "not capability".
  sed 's/pa_detect_capability_reason() {/pa_detect_capability_reason() { return 1;/' "$HOOK_FILE" > "$mutated"
  chmod +x "$mutated"
  if run_hook "$repo" "$mutated"; then
    record pass "6 — mutation (capability detection always-false) caused no-trailer commit to slip through; capability detection is load-bearing"
  else
    record fail "6 — mutated hook still rejected the no-trailer commit; capability detection is therefore not load-bearing in test 2 (anti-tautology violation)"
  fi
  rm -rf "$repo"
}

# ── Run all ──────────────────────────────────────────────────────────────────

test_1_positive_dep_with_trailer
test_2_negative_dep_no_trailer
test_3_positive_escape_hatch
test_4_negative_short_escape
test_5_mutation_invert_trailer_match
test_6_mutation_drop_capability_detection

printf '\n── Summary ──\n%d pass / %d fail\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
