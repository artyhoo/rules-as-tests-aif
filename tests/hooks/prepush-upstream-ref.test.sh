#!/usr/bin/env bash
# Paired-negative for the PREPUSH_UPSTREAM_REF override added for the CI backstop
# (.github/workflows/pre-push-backstop.yml). pre-push.ts previously hard-coded the
# diff base as origin/main; the backstop overrides it with the PR base ref so it
# can gate PRs that target a non-main base (epic/staging, §13.40 automerge plan).
#
# This guard proves two load-bearing properties of upstreamRef() in pre-push.ts:
#   (a) the env var is actually READ (default vs override give different verdicts
#       on the same repo state), and
#   (b) it scopes the evaluated range correctly to <override-ref>..HEAD (a bad
#       commit at/below the override base is EXCLUDED; above it is INCLUDED).
#
# Driven through the §7 Prior-art section (PREPUSH_ONLY=prior-art) because a
# missing Prior-art trailer on a capability commit is an unconditional hard-fail
# (no warn-only arm) — the cleanest exit-1 signal. Sections 1–6 do not run under
# the seam, so no external-tool stubs are needed.
#
# CI: invoked from .github/workflows/audit-self.yml#principles-meta-tests.

set -uo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
TS_HOOK="$REPO_ROOT/packages/core/hooks/pre-push.ts"
PASS=0
FAIL=0

if [ -f "$REPO_ROOT/packages/core/node_modules/tsx/dist/esm/index.mjs" ]; then
  REAL_NODE_MODULES="$REPO_ROOT/packages/core/node_modules"
elif [ -f "$REPO_ROOT/node_modules/tsx/dist/esm/index.mjs" ]; then
  REAL_NODE_MODULES="$REPO_ROOT/node_modules"
else
  echo "❌ tsx loader not found in packages/core/node_modules or root node_modules"
  exit 1
fi
TSX_LOADER="$REAL_NODE_MODULES/tsx/dist/esm/index.mjs"

# build_repo: init repo with origin/staging (the upstreamRef() default) AND
# origin/main both at the initial (good) commit, then add a capability commit
# (new dep) WITHOUT a Prior-art trailer, then a third innocuous commit. Also
# synthesises an alt base ref origin/altbase. Echoes the tmp path.
# Layout (oldest → newest):
#   C1 init (origin/staging + origin/main)  →  C2 capability-no-trailer  →  C3 innocuous-doc
build_repo() {
  local tmp
  tmp=$(mktemp -d)
  git -C "$tmp" init --quiet --initial-branch=main >/dev/null
  git -C "$tmp" config user.email "test@example.com"
  git -C "$tmp" config user.name "test"
  echo '{"name":"test","version":"0.0.0"}' > "$tmp/package.json"
  git -C "$tmp" add package.json
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "init"
  git -C "$tmp" update-ref refs/remotes/origin/main HEAD       # C1
  git -C "$tmp" update-ref refs/remotes/origin/staging HEAD    # C1 — upstreamRef() default

  # Multi-line so the added dep is on its own `+` line (capability-detection
  # regex in prior-art.ts requires `^[+-]\s+"key": "version`).
  cat > "$tmp/package.json" <<'PKG'
{
  "name": "test",
  "version": "0.0.0",
  "dependencies": {
    "new-dep": "^1.0.0"
  }
}
PKG
  git -C "$tmp" add package.json
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "feat: add new-dep" -m "No Prior-art line."  # C2

  echo "doc" > "$tmp/README.md"
  git -C "$tmp" add README.md
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "docs: add readme" -m "Innocuous."  # C3

  echo "$tmp"
}

Z40="0000000000000000000000000000000000000000"

# run REPO [UPSTREAM_REF] [STDIN_LINE]: invoke §7.
#   UPSTREAM_REF '' = no env override (resolver falls to git stdin, then default).
#   STDIN_LINE   '' = pipe /dev/null (no pushed refs); else pipe that pre-push
#                     stdin line (`<local_ref> <local_sha> <remote_ref> <remote_sha>`).
# Always controls fd 0 explicitly so the resolver's stdin read is deterministic.
run() {
  local repo="$1" ref="${2:-}" stdin_line="${3:-}"
  (
    cd "$repo"
    if [ -n "$ref" ]; then export PREPUSH_UPSTREAM_REF="$ref"; fi
    if [ -n "$stdin_line" ]; then
      printf '%s\n' "$stdin_line" | NODE_PATH="$REAL_NODE_MODULES" \
        PREPUSH_ONLY="prior-art" node --import "$TSX_LOADER" "$TS_HOOK" >/dev/null 2>&1
    else
      NODE_PATH="$REAL_NODE_MODULES" \
        PREPUSH_ONLY="prior-art" node --import "$TSX_LOADER" "$TS_HOOK" </dev/null >/dev/null 2>&1
    fi
  )
}

# run_capture REPO: like run with no env / no stdin, but returns combined output
# (for asserting the §F2 visible-warning, NOT-silent-skip property).
run_capture() {
  local repo="$1"
  (
    cd "$repo"
    NODE_PATH="$REAL_NODE_MODULES" \
      PREPUSH_ONLY="prior-art" node --import "$TSX_LOADER" "$TS_HOOK" </dev/null 2>&1
  )
}

drop_staging() { git -C "$1" update-ref -d refs/remotes/origin/staging; }

record() {
  local outcome="$1" desc="$2"
  if [ "$outcome" = "pass" ]; then PASS=$((PASS+1)); printf 'PASS: %s\n' "$desc"
  else FAIL=$((FAIL+1)); printf 'FAIL: %s\n' "$desc"; fi
}

# Test 1 (baseline negative): default base origin/staging (= C1) → range C2..C3 incl.
# the trailer-less capability commit C2 → hard-fail (exit 1).
test_1_default_includes_bad() {
  local repo; repo=$(build_repo)
  if run "$repo"; then
    record fail "1 — default origin/staging should flag trailer-less capability C2 but exited 0"
  else
    record pass "1 — default origin/staging base → capability C2 flagged → exit non-zero"
  fi
  rm -rf "$repo"
}

# Test 2 (override READ + EXCLUDES): set origin/altbase = C2 (the bad commit), then
# PREPUSH_UPSTREAM_REF=origin/altbase → range = C3 only → no capability → exit 0.
# Same repo state as test 1; only the env differs → proves the var is consulted.
test_2_override_excludes_bad() {
  local repo; repo=$(build_repo)
  # altbase points at C2 (HEAD~1 = the capability commit).
  git -C "$repo" update-ref refs/remotes/origin/altbase "$(git -C "$repo" rev-parse HEAD~1)"
  if run "$repo" "origin/altbase"; then
    record pass "2 — override base above C2 excludes it → exit 0 (env honoured)"
  else
    record fail "2 — override base above C2 should exclude it but exited non-zero"
  fi
  rm -rf "$repo"
}

# Test 3 (override INCLUDES against non-main base): set origin/altbase = C1, then
# PREPUSH_UPSTREAM_REF=origin/altbase → range = C2..C3 incl. the bad C2 → exit 1.
# Proves correct scoping against a base that is NOT origin/main.
test_3_override_includes_bad() {
  local repo; repo=$(build_repo)
  # altbase points at C1 (= origin/main here, but referenced via a different ref
  # name to prove non-main bases are honoured, not just origin/main aliasing).
  git -C "$repo" update-ref refs/remotes/origin/altbase "$(git -C "$repo" rev-parse HEAD~2)"
  if run "$repo" "origin/altbase"; then
    record fail "3 — override base below C2 should flag it but exited 0"
  else
    record pass "3 — override base below C2 includes capability → exit non-zero"
  fi
  rm -rf "$repo"
}

# ── stdin base-ref detection (hook-base-ref-detection I-phase) ───────────────────

# Test 4 (stdin READ + scopes/EXCLUDES): no env; git stdin remote_sha = C2 (the bad
# capability commit). Resolver uses remote_sha as base → range C3 only → exit 0.
# Old code ignored stdin and used origin/staging (= C1) → would include C2 → exit 1.
# Same repo state as test 1; only stdin differs → proves git stdin is consulted.
test_4_stdin_remote_excludes_bad() {
  local repo; repo=$(build_repo)
  local c2 c3; c2=$(git -C "$repo" rev-parse HEAD~1); c3=$(git -C "$repo" rev-parse HEAD)
  if run "$repo" "" "refs/heads/feat ${c3} refs/heads/feat ${c2}"; then
    record pass "4 — stdin remote_sha=C2 base → excludes C2 → exit 0 (stdin honoured over default)"
  else
    record fail "4 — stdin remote_sha=C2 should exclude C2 but exited non-zero"
  fi
  rm -rf "$repo"
}

# Test 5 (consumer no-op FIX, Z40 new branch, NO staging): drop origin/staging
# (a typical consumer repo whose trunk is main). git stdin remote_sha = Z40 (new
# branch). Resolver → commits-not-on-remotes(HEAD) = C2,C3 → includes bad C2 → exit 1.
# Old code: origin/staging absent → upstreamExists false → SILENT skip → exit 0.
test_5_stdin_z40_newbranch_includes_bad() {
  local repo; repo=$(build_repo); drop_staging "$repo"
  local c3; c3=$(git -C "$repo" rev-parse HEAD)
  if run "$repo" "" "refs/heads/newbranch ${c3} refs/heads/newbranch ${Z40}"; then
    record fail "5 — Z40 new-branch with no staging should flag C2 but exited 0 (consumer no-op not fixed)"
  else
    record pass "5 — Z40 new-branch → checks commits-not-on-remotes incl. C2 → exit 1 (consumer no-op FIXED)"
  fi
  rm -rf "$repo"
}

# Test 6 (precedence: env BEATS stdin): git stdin remote_sha = C1 (would include the
# bad C2 → fail), but PREPUSH_UPSTREAM_REF=origin/altbase points at C2 → range C3 →
# exit 0. Guards that the CI override still wins over the stdin signal.
test_6_env_beats_stdin() {
  local repo; repo=$(build_repo)
  local c1 c2 c3; c1=$(git -C "$repo" rev-parse HEAD~2); c2=$(git -C "$repo" rev-parse HEAD~1); c3=$(git -C "$repo" rev-parse HEAD)
  git -C "$repo" update-ref refs/remotes/origin/altbase "$c2"
  if run "$repo" "origin/altbase" "refs/heads/feat ${c3} refs/heads/feat ${c1}"; then
    record pass "6 — env override beats conflicting stdin (env C2 base → exit 0)"
  else
    record fail "6 — env should win over stdin but the run exited non-zero"
  fi
  rm -rf "$repo"
}

# Test 7 (consumer no-op FIX, stdin non-Z40, NO staging): drop origin/staging; git
# stdin remote_sha = C1 → base C1 → range C2..C3 includes bad C2 → exit 1.
# Old code: no staging → silent skip → exit 0.
test_7_stdin_remote_no_staging_includes_bad() {
  local repo; repo=$(build_repo); drop_staging "$repo"
  local c1 c3; c1=$(git -C "$repo" rev-parse HEAD~2); c3=$(git -C "$repo" rev-parse HEAD)
  if run "$repo" "" "refs/heads/feat ${c3} refs/heads/feat ${c1}"; then
    record fail "7 — stdin remote_sha=C1 with no staging should flag C2 but exited 0"
  else
    record pass "7 — stdin remote_sha=C1 (no staging) → includes C2 → exit 1 (consumer no-op FIXED)"
  fi
  rm -rf "$repo"
}

# Test 8 (§F2 — VISIBLE warning, never a silent skip): no env, no stdin, no staging
# → base unresolvable. Must exit 0 (does not hard-block a push) AND emit a visible
# warning. Old code returned silently with no output at all.
test_8_unresolvable_warns_visibly() {
  local repo; repo=$(build_repo); drop_staging "$repo"
  local out; out=$(run_capture "$repo")
  if printf '%s' "$out" | grep -qiE 'could not determine|base ref|skipping'; then
    record pass "8 — unresolvable base → visible warning emitted (not a silent skip)"
  else
    record fail "8 — unresolvable base produced no warning output (silent skip not fixed): [${out}]"
  fi
  rm -rf "$repo"
}

test_1_default_includes_bad
test_2_override_excludes_bad
test_3_override_includes_bad
test_4_stdin_remote_excludes_bad
test_5_stdin_z40_newbranch_includes_bad
test_6_env_beats_stdin
test_7_stdin_remote_no_staging_includes_bad
test_8_unresolvable_warns_visibly

printf '\n── Summary ──\n%d pass / %d fail\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
