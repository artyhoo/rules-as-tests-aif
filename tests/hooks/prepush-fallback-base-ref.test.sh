#!/usr/bin/env bash
# Paired-negative for the bash fallback's base-ref detection
# (packages/core/hooks/pre-push.fallback.sh) — the CONSUMER-FACING channel that
# install.sh actually ships. The fallback previously hard-coded the diff base as
# origin/staging, which silently no-op'd on any consumer repo lacking a `staging`
# branch (the headline finding of the hook-base-ref-detection R-phase). This guard
# proves the fallback now resolves the base the SAME way as the TS hook
# (dual-implementation-discipline.md §5): env override > git pre-push stdin
# remote_sha > default origin/staging > visible-skip — never a silent pass.
#
# Driven through §7 Prior-art PRESENCE (the fallback hard-fails any in-range commit
# missing a `Prior-art:` trailer). Fixture: C1 base (with trailer) → C2 BAD (no
# trailer) → C3 GOOD (with trailer). A range that includes C2 fails; one scoped
# above C2 passes.
#
# CI: invoked from .github/workflows/audit-self.yml#principles-meta-tests
# (alongside prepush-upstream-ref.test.sh).

set -uo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
FALLBACK="$REPO_ROOT/packages/core/hooks/pre-push.fallback.sh"
Z40="0000000000000000000000000000000000000000"
PASS=0
FAIL=0

# build_repo: C1 init (origin/main + origin/staging, WITH trailer) → C2 capability
# WITHOUT a Prior-art trailer (the offender) → C3 doc WITH a trailer. All commits
# dated after the fallback's 2026-05-12 historical cutoff so none are bypassed.
build_repo() {
  local tmp; tmp=$(mktemp -d)
  export GIT_AUTHOR_DATE="2026-05-29T12:00:00" GIT_COMMITTER_DATE="2026-05-29T12:00:00"
  git -C "$tmp" init --quiet --initial-branch=main >/dev/null
  git -C "$tmp" config user.email "test@example.com"
  git -C "$tmp" config user.name "test"
  echo '{"name":"test","version":"0.0.0"}' > "$tmp/package.json"
  git -C "$tmp" add package.json
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "init" -m "Prior-art: skipped — bootstrap fixture base."
  git -C "$tmp" update-ref refs/remotes/origin/main HEAD       # C1
  git -C "$tmp" update-ref refs/remotes/origin/staging HEAD    # C1 — fallback default

  cat > "$tmp/package.json" <<'PKG'
{
  "name": "test",
  "version": "0.0.0",
  "dependencies": { "new-dep": "^1.0.0" }
}
PKG
  git -C "$tmp" add package.json
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "feat: add new-dep" -m "No Prior-art line."  # C2 BAD

  echo "doc" > "$tmp/README.md"
  git -C "$tmp" add README.md
  git -C "$tmp" -c commit.gpgsign=false commit -q -m "docs: add readme" -m "Prior-art: skipped — innocuous doc, no capability."  # C3 GOOD
  unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE
  echo "$tmp"
}

drop_staging() { git -C "$1" update-ref -d refs/remotes/origin/staging; }

# fb REPO [ENV_REF] [STDIN_LINE]: run the fallback; returns its exit code.
fb() {
  local repo="$1" ref="${2:-}" stdin_line="${3:-}"
  (
    cd "$repo"
    if [ -n "$ref" ]; then export PREPUSH_UPSTREAM_REF="$ref"; fi
    if [ -n "$stdin_line" ]; then
      printf '%s\n' "$stdin_line" | bash "$FALLBACK" >/dev/null 2>&1
    else
      bash "$FALLBACK" </dev/null >/dev/null 2>&1
    fi
  )
}

fb_capture() {
  local repo="$1"
  ( cd "$repo"; bash "$FALLBACK" </dev/null 2>&1 )
}

record() {
  if [ "$1" = pass ]; then PASS=$((PASS+1)); printf 'PASS: %s\n' "$2"
  else FAIL=$((FAIL+1)); printf 'FAIL: %s\n' "$2"; fi
}

# FB0 (baseline): default origin/staging (= C1) → range C2..C3 incl. BAD C2 → exit 1.
test_fb0_default_includes_bad() {
  local r; r=$(build_repo)
  if fb "$r"; then record fail "FB0 — default origin/staging should flag C2 but exited 0"
  else record pass "FB0 — default origin/staging → includes BAD C2 → exit 1"; fi
  rm -rf "$r"
}

# FB1 (stdin READ + EXCLUDES): stdin remote_sha=C2 → range C3 only (GOOD) → exit 0.
test_fb1_stdin_excludes_bad() {
  local r; r=$(build_repo)
  local c2 c3; c2=$(git -C "$r" rev-parse HEAD~1); c3=$(git -C "$r" rev-parse HEAD)
  if fb "$r" "" "refs/heads/feat ${c3} refs/heads/feat ${c2}"; then
    record pass "FB1 — stdin remote_sha=C2 → excludes BAD C2 → exit 0 (stdin honoured)"
  else record fail "FB1 — stdin remote_sha=C2 should exclude C2 but exited non-zero"; fi
  rm -rf "$r"
}

# FB2 (consumer no-op FIX): no staging + Z40 new branch → commits-not-on-remotes
# (C2,C3) incl. BAD C2 → exit 1. Old fallback: no staging → silent skip → exit 0.
test_fb2_z40_no_staging_includes_bad() {
  local r; r=$(build_repo); drop_staging "$r"
  local c3; c3=$(git -C "$r" rev-parse HEAD)
  if fb "$r" "" "refs/heads/newbranch ${c3} refs/heads/newbranch ${Z40}"; then
    record fail "FB2 — Z40 + no staging should flag C2 but exited 0 (consumer no-op not fixed)"
  else record pass "FB2 — Z40 + no staging → commits-not-on-remotes incl. C2 → exit 1 (FIXED)"; fi
  rm -rf "$r"
}

# FB3 (env BEATS stdin): env=origin/altbase@C2 (→ range C3, exit 0) wins over stdin
# remote_sha=C1 (→ would include BAD C2 → exit 1).
test_fb3_env_beats_stdin() {
  local r; r=$(build_repo)
  local c1 c2 c3; c1=$(git -C "$r" rev-parse HEAD~2); c2=$(git -C "$r" rev-parse HEAD~1); c3=$(git -C "$r" rev-parse HEAD)
  git -C "$r" update-ref refs/remotes/origin/altbase "$c2"
  if fb "$r" "origin/altbase" "refs/heads/feat ${c3} refs/heads/feat ${c1}"; then
    record pass "FB3 — env override beats conflicting stdin → exit 0"
  else record fail "FB3 — env should win over stdin but exited non-zero"; fi
  rm -rf "$r"
}

# FB4 (VISIBLE skip): no env, no stdin, no staging → visible warning + exit 0
# (never a silent skip). Old fallback DID print on staging-absent; this guards parity.
test_fb4_unresolvable_warns() {
  local r; r=$(build_repo); drop_staging "$r"
  local out; out=$(fb_capture "$r")
  if printf '%s' "$out" | grep -qiE 'could not determine|not found|skipping'; then
    record pass "FB4 — unresolvable base → visible warning (not silent)"
  else record fail "FB4 — unresolvable base produced no warning: [${out}]"; fi
  rm -rf "$r"
}

test_fb0_default_includes_bad
test_fb1_stdin_excludes_bad
test_fb2_z40_no_staging_includes_bad
test_fb3_env_beats_stdin
test_fb4_unresolvable_warns

printf '\n── Summary ──\n%d pass / %d fail\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
