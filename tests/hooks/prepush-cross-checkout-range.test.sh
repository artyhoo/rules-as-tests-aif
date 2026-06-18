#!/usr/bin/env bash
# Paired-negative for the cross-checkout range bug (2026-06-17): the §7 / §1.7 /
# §6 / §8 base-scoped sections evaluated `<base>..HEAD` instead of
# `<base>..<pushed-local-sha>`. When you push a feature branch from a checkout
# sitting on a *different* branch (e.g. on `staging`, `git push origin feat`),
# HEAD is the staging tip — NOT the pushed branch's tip — so the hook validated
# unrelated staging commits.
#
# The sibling harness prepush-upstream-ref.test.sh exercises stdin base
# resolution, but in every one of its cases the temp repo's HEAD coincidentally
# EQUALS the pushed local_sha (it pushes the branch it is checked out on), so the
# `..HEAD` vs `..<local_sha>` divergence is invisible there. This guard is the
# missing cross-checkout case: HEAD ≠ local_sha.
#
# Two load-bearing properties of resolveBase()/getCommits() in pre-push.ts:
#   (A) a bad capability commit reachable from HEAD but NOT from the pushed branch
#       is EXCLUDED (range follows the pushed local_sha, not HEAD), and
#   (B) a bad capability commit on the pushed branch (but NOT reachable from HEAD)
#       is still INCLUDED (the gate keeps working on the branch's own commits).
#
# Plus the §7 C1 SSOT-existence-arm tree-source fix: the cited entry's existence
# is checked against the *commit's own tree* (via `git show <sha>:<ssot>`), not
# the possibly-dirty working tree of whatever branch is checked out:
#   (C) a citation that exists in the commit's tree passes even when the working
#       tree's SSOT has it removed (uncommitted edit / cross-checkout), and
#   (D) a citation that exists in NEITHER tree is still caught (no false-pass).
#
# Driven through §7 (PREPUSH_ONLY=prior-art): a missing Prior-art trailer (or a
# broken SSOT citation) on a capability commit is an unconditional hard-fail —
# the cleanest exit-1 signal. Sections 1–6 do not run under the seam.
#
# CI: invoked from .github/workflows/audit-self.yml#principles-meta-tests
# (alongside prepush-upstream-ref.test.sh).

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
SSOT_REL="docs/meta-factory/prior-art-evaluations.md"

git_q() { git -C "$1" -c commit.gpgsign=false "${@:2}"; }

# add_cap_commit TMP TAG [TRAILER]: add a NEW dep to package.json (a capability
# commit per prior-art.ts detection) and commit it. TRAILER (optional) is the
# commit-body line; omit for a trailer-less (hard-fail) capability commit.
add_cap_commit() {
  local tmp="$1" tag="$2" trailer="${3:-No Prior-art line.}"
  cat > "$tmp/package.json" <<PKG
{
  "name": "test",
  "version": "0.0.0",
  "dependencies": {
    "dep-${tag}": "^1.0.0"
  }
}
PKG
  git -C "$tmp" add package.json
  git_q "$tmp" commit -q -m "feat(${tag}): add dep-${tag}" -m "${trailer}"
}

# add_doc_commit TMP TAG: an innocuous (non-capability) commit.
add_doc_commit() {
  local tmp="$1" tag="$2"
  echo "doc on ${tag}" > "$tmp/${tag}.md"
  git -C "$tmp" add "${tag}.md"
  git_q "$tmp" commit -q -m "docs(${tag}): note" -m "Innocuous."
}

# build_cross_repo BAD_SIDE: C1 init; feat off C1 → F2; staging off C1 → S2.
# Exactly one of {feat,staging} tip is a trailer-less capability commit (BAD_SIDE);
# the other is innocuous. origin/feat is left at C1 (the push remote_sha). HEAD is
# left on `staging` — the cross-checkout condition (HEAD = S2 ≠ feat tip F2).
build_cross_repo() {
  local bad="$1" tmp
  tmp=$(mktemp -d)
  git -C "$tmp" init --quiet --initial-branch=main >/dev/null
  git -C "$tmp" config user.email "test@example.com"
  git -C "$tmp" config user.name "test"
  echo '{"name":"test","version":"0.0.0"}' > "$tmp/package.json"
  git -C "$tmp" add package.json
  git_q "$tmp" commit -q -m "init"
  git -C "$tmp" update-ref refs/remotes/origin/main HEAD
  git -C "$tmp" update-ref refs/remotes/origin/feat HEAD   # remote_sha for the feat push = C1

  git -C "$tmp" checkout -q -b feat
  if [ "$bad" = "feat" ]; then add_cap_commit "$tmp" "feat"; else add_doc_commit "$tmp" "feat"; fi

  git -C "$tmp" checkout -q main
  git -C "$tmp" checkout -q -b staging
  if [ "$bad" = "staging" ]; then add_cap_commit "$tmp" "staging"; else add_doc_commit "$tmp" "staging"; fi
  # HEAD now on staging (S2) — NOT on the feat branch being pushed.
  echo "$tmp"
}

# build_ssot_repo CITE: C1 has the SSOT (entries #5,#7,#777) + package.json base.
# feat off C1 → F2 = capability commit citing prior-art-evaluations.md#CITE. HEAD
# left on feat (so range == {F2} regardless of the range bug — this ISOLATES the
# §7 C1-existence-arm tree-source fix from the range fix). origin/feat = C1.
#
# #777 is the discriminator: it is present in the temp repo's committed tree but
# absent from the *real* repo's SSOT (which the BUGGY code read via a path resolved
# from the hook file's own location, not from the pushed commit's tree). So a #777
# citation passes only when the existence arm reads `git show <sha>:<ssot>`
# (cwd = temp repo) — the fix — and fails when it reads the real-repo working tree.
# This is the real incident's shape: the cited entry lived in the commit's tree but
# not in the (mismatched) tree the check actually consulted.
build_ssot_repo() {
  local cite="$1" tmp
  tmp=$(mktemp -d)
  git -C "$tmp" init --quiet --initial-branch=main >/dev/null
  git -C "$tmp" config user.email "test@example.com"
  git -C "$tmp" config user.name "test"
  mkdir -p "$tmp/docs/meta-factory"
  printf '| ID | x |\n|---|---|\n| 5 | entry five |\n| 7 | entry seven |\n| 777 | high entry |\n' > "$tmp/$SSOT_REL"
  echo '{"name":"test","version":"0.0.0"}' > "$tmp/package.json"
  git -C "$tmp" add package.json "$SSOT_REL"
  git_q "$tmp" commit -q -m "init"
  git -C "$tmp" update-ref refs/remotes/origin/feat HEAD   # remote_sha = C1

  git -C "$tmp" checkout -q -b feat
  add_cap_commit "$tmp" "feat" \
    "Prior-art: prior-art-evaluations.md#${cite} (verdict ADAPT — rationale long enough)."
  # HEAD on feat (F2).
  echo "$tmp"
}

# run REPO STDIN_LINE: invoke §7 with the given pre-push stdin line, controlling
# fd 0 explicitly. cwd = repo so HEAD is whatever the repo is checked out on.
run() {
  local repo="$1" stdin_line="$2"
  (
    cd "$repo"
    printf '%s\n' "$stdin_line" | NODE_PATH="$REAL_NODE_MODULES" \
      PREPUSH_ONLY="prior-art" node --import "$TSX_LOADER" "$TS_HOOK" >/dev/null 2>&1
  )
}

record() {
  local outcome="$1" desc="$2"
  if [ "$outcome" = "pass" ]; then PASS=$((PASS+1)); printf 'PASS: %s\n' "$desc"
  else FAIL=$((FAIL+1)); printf 'FAIL: %s\n' "$desc"; fi
}

# Test A (range EXCLUDES HEAD-only commit): HEAD=staging(S2=trailer-less capability),
# push feat whose tip F2 is innocuous. remote_sha=C1, local_sha=F2. Correct range is
# C1..F2={F2} (clean) → exit 0. The bug evaluated C1..HEAD=C1..S2={S2}(bad) → exit 1.
test_A_excludes_head_only_bad() {
  local repo; repo=$(build_cross_repo "staging")
  local c1 f2; c1=$(git -C "$repo" rev-parse origin/feat); f2=$(git -C "$repo" rev-parse feat)
  if run "$repo" "refs/heads/feat ${f2} refs/heads/feat ${c1}"; then
    record pass "A — staging-only capability EXCLUDED from feat push range → exit 0"
  else
    record fail "A — staging-only capability wrongly validated (range used HEAD, not pushed local_sha)"
  fi
  rm -rf "$repo"
}

# Test B (range INCLUDES the pushed branch's own commit): HEAD=staging(S2=innocuous),
# push feat whose tip F2 IS a trailer-less capability. Correct range C1..F2={F2}(bad)
# → exit 1. The bug evaluated C1..S2={S2}(good) → exit 0 (missed the real violation).
test_B_includes_pushed_branch_bad() {
  local repo; repo=$(build_cross_repo "feat")
  local c1 f2; c1=$(git -C "$repo" rev-parse origin/feat); f2=$(git -C "$repo" rev-parse feat)
  if run "$repo" "refs/heads/feat ${f2} refs/heads/feat ${c1}"; then
    record fail "B — feat's own capability commit NOT validated (range used HEAD, not pushed local_sha)"
  else
    record pass "B — feat's own capability commit INCLUDED in push range → exit 1"
  fi
  rm -rf "$repo"
}

# Test C (C1 existence arm reads the COMMIT's tree, not a mismatched tree): F2 cites
# #777, which IS in F2's committed tree but NOT in the tree the buggy code consulted
# (the real-repo SSOT, via a hook-file-relative path). Per-commit-tree read finds
# #777 → exit 0. The bug read the wrong tree (no #777) → broken-citation → exit 1.
test_C_existence_arm_uses_commit_tree() {
  local repo; repo=$(build_ssot_repo "777")
  local c1 f2; c1=$(git -C "$repo" rev-parse origin/feat); f2=$(git -C "$repo" rev-parse feat)
  if run "$repo" "refs/heads/feat ${f2} refs/heads/feat ${c1}"; then
    record pass "C — citation present in the commit's own tree passes (tree-scoped existence) → exit 0"
  else
    record fail "C — existence arm read a mismatched tree, not the commit tree (false broken-citation)"
  fi
  rm -rf "$repo"
}

# Test D (existence arm still catches a genuinely-missing citation): F2 cites #999,
# absent from F2's tree AND the working tree → broken citation → exit 1. Guards that
# the tree-source fix did not disable the arm.
test_D_existence_arm_still_catches_missing() {
  local repo; repo=$(build_ssot_repo "999")
  local c1 f2; c1=$(git -C "$repo" rev-parse origin/feat); f2=$(git -C "$repo" rev-parse feat)
  if run "$repo" "refs/heads/feat ${f2} refs/heads/feat ${c1}"; then
    record fail "D — citation to a non-existent SSOT entry NOT caught (arm disabled by the fix?)"
  else
    record pass "D — citation to a non-existent SSOT entry still flagged → exit 1"
  fi
  rm -rf "$repo"
}

test_A_excludes_head_only_bad
test_B_includes_pushed_branch_bad
test_C_existence_arm_uses_commit_tree
test_D_existence_arm_still_catches_missing

printf '\n── Summary ──\n%d pass / %d fail\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
