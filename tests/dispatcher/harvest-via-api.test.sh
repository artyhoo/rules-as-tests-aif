#!/usr/bin/env bash
# Paired-negative for .claude/skills/dispatcher/helpers/harvest-via-api.sh — the
# Git Data API push fallback used when the git transport to github.com is down.
#
# Positives (must PASS):
#   - file modes are derived per path (git index → HEAD → filesystem bits), not
#     hardcoded 100644: executables keep 100755, symlinks keep 120000 with the
#     blob content being the link TARGET, plain files stay 100644, and untracked
#     files fall back to filesystem bits;
#   - an existing branch ref fast-forwards cleanly (PATCH force:false).
# Negatives (must FAIL loudly):
#   - a non-fast-forward ref PATCH (remote ref moved) exits non-zero with an
#     explicit fast-forward diagnosis and does NOT auto-force;
#   - a gitlink (160000) path is rejected as unsupported;
#   - a missing source file and missing required flags fail fast.
#
# All GitHub traffic is stubbed via a fake `gh` on PATH — no network, no token.
# Origin: one-click-installer S4 (#449-#451) + S5 (#452) pushes, 2026-06-10 —
# both needed manual mode/ref hand-holding that this test pins down.
# CI: invoked from .github/workflows/audit-self.yml#principles-meta-tests.
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
SCRIPT="$ROOT/.claude/skills/dispatcher/helpers/harvest-via-api.sh"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FAKE_BIN="$TMP/bin"
FAKE_LOG="$TMP/log"
mkdir -p "$FAKE_BIN" "$FAKE_LOG"

# ── fake gh: answers the exact Git Data API sequence the script issues ──────
# Scenario knobs (env): FAKE_BRANCH_EXISTS=1 → branch ref GET resolves;
#                       FAKE_PATCH_NONFF=1   → ref PATCH fails 422 non-fast-forward.
# Captures: blob bodies → $FAKE_LOG/blob-<n>.json (sha "blobsha-<n>"),
#           tree body   → $FAKE_LOG/tree.json.
cat > "$FAKE_BIN/gh" <<'FAKEGH'
#!/usr/bin/env bash
set -uo pipefail
args=("$@")
url="" method="" has_input=0
for ((i = 0; i < ${#args[@]}; i++)); do
  case "${args[$i]}" in
    /repos/*) url="${args[$i]}" ;;
    -X) method="${args[$((i + 1))]}" ;;
    --input) has_input=1 ;;
  esac
done
if [ -z "$method" ]; then
  [ "$has_input" = 1 ] && method="POST" || method="GET"
fi
case "$method $url" in
  "GET /repos/"*"/git/ref/heads/${FAKE_BASE:?}")
    echo "basesha0000"; exit 0 ;;
  "GET /repos/"*"/git/ref/heads/"*)
    if [ "${FAKE_BRANCH_EXISTS:-0}" = "1" ]; then echo "branchtip999"; exit 0; fi
    # real gh prints the error body to STDOUT (even with --jq) and exits 1 —
    # an existence check keyed on non-empty stdout takes the wrong branch
    echo '{"message":"Not Found","status":"404"}'
    echo "gh: Not Found (HTTP 404)" >&2; exit 1 ;;
  "GET /repos/"*"/git/commits/basesha0000")
    echo "basetree0000"; exit 0 ;;
  "POST /repos/"*"/git/blobs")
    n=$(($(cat "${FAKE_LOG:?}/blob.count" 2>/dev/null || echo 0) + 1))
    echo "$n" > "$FAKE_LOG/blob.count"
    cat > "$FAKE_LOG/blob-$n.json"
    echo "blobsha-$n"; exit 0 ;;
  "POST /repos/"*"/git/trees")
    cat > "${FAKE_LOG:?}/tree.json"
    echo "treesha111"; exit 0 ;;
  "POST /repos/"*"/git/commits")
    cat > "${FAKE_LOG:?}/commit.json"
    echo "newcommit111"; exit 0 ;;
  "PATCH /repos/"*"/git/refs/heads/"*)
    cat > /dev/null
    if [ "${FAKE_PATCH_NONFF:-0}" = "1" ]; then
      echo "gh: Update is not a fast forward (HTTP 422)" >&2; exit 1
    fi
    echo "newcommit111"; exit 0 ;;
  "POST /repos/"*"/git/refs")
    cat > /dev/null
    echo "newcommit111"; exit 0 ;;
  *)
    echo "fake-gh: unexpected call: $method $url" >&2; exit 99 ;;
esac
FAKEGH
chmod +x "$FAKE_BIN/gh"

# ── srcdir: a small git repo mirroring repo paths, with one of each mode ────
SRC="$TMP/src"
mkdir -p "$SRC/scripts"
echo "plain content" > "$SRC/scripts/plain.txt"                      # 100644 tracked
printf '#!/bin/sh\necho hi\n' > "$SRC/setup"; chmod +x "$SRC/setup"  # 100755 tracked
ln -s scripts/plain.txt "$SRC/link.md"                               # 120000 tracked
git -C "$SRC" init -q
git -C "$SRC" add scripts/plain.txt setup link.md
printf '#!/bin/sh\n' > "$SRC/untracked-exec.sh"                      # 100755 via fs fallback
chmod +x "$SRC/untracked-exec.sh"

PASS=0
FAIL=0
check() { # $1 = desc, rest = command; PASS iff the command exits 0
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then PASS=$((PASS + 1)); printf 'PASS: %s\n' "$desc"
  else FAIL=$((FAIL + 1)); printf 'FAIL: %s\n' "$desc"; fi
}
# shellcheck disable=SC2329  # invoked indirectly via check "$@"
out_has() { printf '%s' "$out" | grep -qi -- "$1"; } # case-insensitive match on last run's output

run_script() { # all remaining args forwarded; scenario env set by caller
  env PATH="$FAKE_BIN:$PATH" FAKE_BASE=staging FAKE_LOG="$FAKE_LOG" \
    FAKE_BRANCH_EXISTS="${FAKE_BRANCH_EXISTS:-0}" FAKE_PATCH_NONFF="${FAKE_PATCH_NONFF:-0}" \
    bash "$SCRIPT" --repo example-owner/example-repo --base staging "$@" 2>&1
}

reset_log() { rm -f "$FAKE_LOG"/blob.count "$FAKE_LOG"/blob-*.json "$FAKE_LOG"/tree.json "$FAKE_LOG"/commit.json; }

tree_mode() { jq -r --arg p "$1" '.tree[] | select(.path == $p) | .mode' "$FAKE_LOG/tree.json"; }

# ── 1. POSITIVE: per-path modes survive (the S4/S5 incident class) ──────────
reset_log
out=$(run_script --branch t-modes --message "test: modes" --srcdir "$SRC" \
  scripts/plain.txt setup link.md untracked-exec.sh)
rc=$?
check "happy push exits 0" test "$rc" -eq 0
check "plain file → 100644"            test "$(tree_mode scripts/plain.txt)" = "100644"
check "tracked executable → 100755"    test "$(tree_mode setup)" = "100755"
check "symlink → 120000"               test "$(tree_mode link.md)" = "120000"
check "untracked exec (fs fallback) → 100755" test "$(tree_mode untracked-exec.sh)" = "100755"
# symlink blob content must be the link TARGET, not the target file's content
link_sha=$(jq -r '.tree[] | select(.path == "link.md") | .sha' "$FAKE_LOG/tree.json")
link_n=${link_sha#blobsha-}
link_target=$(jq -r '.content' "$FAKE_LOG/blob-$link_n.json" | base64 -d)
check "symlink blob = link target string" test "$link_target" = "scripts/plain.txt"
check "created new branch ref" out_has 'created ref refs/heads/t-modes'

# ── 2. POSITIVE: existing branch fast-forwards via PATCH force:false ────────
reset_log
FAKE_BRANCH_EXISTS=1
out=$(run_script --branch t-ff --message "test: ff" --srcdir "$SRC" scripts/plain.txt)
rc=$?
FAKE_BRANCH_EXISTS=0
check "fast-forward update exits 0" test "$rc" -eq 0
check "reports updated ref" out_has 'updated ref refs/heads/t-ff'

# ── 3. NEGATIVE: non-fast-forward PATCH → loud diagnosis, no auto-force ─────
reset_log
FAKE_BRANCH_EXISTS=1 FAKE_PATCH_NONFF=1
out=$(run_script --branch t-nonff --message "test: nonff" --srcdir "$SRC" scripts/plain.txt)
rc=$?
FAKE_BRANCH_EXISTS=0 FAKE_PATCH_NONFF=0
check "non-fast-forward exits non-zero" test "$rc" -ne 0
check "diagnosis names the fast-forward rejection" out_has 'fast.forward'
check "diagnosis shows the moved remote tip" out_has 'branchtip999'
check "explicitly refuses to auto-force" out_has 'not auto-forcing'

# ── 4. NEGATIVE: gitlink (160000) is not a pushable blob ────────────────────
reset_log
echo "gitlink placeholder" > "$SRC/sub"
git -C "$SRC" update-index --add --cacheinfo 160000,1234567890123456789012345678901234567890,sub
out=$(run_script --branch t-gitlink --message "test: gitlink" --srcdir "$SRC" sub)
rc=$?
check "gitlink exits non-zero" test "$rc" -ne 0
check "gitlink names unsupported mode 160000" out_has 'UNSUPPORTED mode 160000'

# ── 5. NEGATIVE: missing source file ────────────────────────────────────────
reset_log
out=$(run_script --branch t-missing --message "test: missing" --srcdir "$SRC" no/such/file.txt)
rc=$?
check "missing src exits non-zero" test "$rc" -ne 0
check "missing src names the path" out_has 'MISSING src'

# ── 6. NEGATIVE: missing required flags ─────────────────────────────────────
out=$(env PATH="$FAKE_BIN:$PATH" FAKE_BASE=staging FAKE_LOG="$FAKE_LOG" bash "$SCRIPT" --repo x/y 2>&1)
rc=$?
check "missing flags exit 2" test "$rc" -eq 2

printf '\n── harvest-via-api: %d pass / %d fail ──\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
