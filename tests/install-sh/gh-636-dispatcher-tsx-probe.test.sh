#!/usr/bin/env bash
# gh-636-dispatcher-tsx-probe.test.sh — the pre-push dispatcher must DEGRADE, not CRASH, when tsx is
# unresolvable.
#
# BUG (#636): the dispatcher exec'd `node --import tsx/esm "$TS_HOOK"` with no check that the tsx ESM
# loader actually resolves. On a pnpm monorepo tsx can live in a sub-package and not resolve from the
# repo root, so `--import tsx/esm` throws and the hook HARD-CRASHES — `git push` blocked by a crash,
# never reaching the `elif [ -x "$FALLBACK" ]` bash fallback (that elif is only taken when pre-push.ts
# is ABSENT, never when the TS runtime is broken). The fix adds a `node --import tsx/esm -e ''` probe
# as the last `if` condition; a failing probe falls through to the bash fallback.
#
# This test EXECUTES the dispatcher's bash routing (the existing vitest pre-push.test.ts is a static
# `toMatch(/--import tsx\/esm/)` over the source string — it never runs the branch). We drive the
# dispatcher with a stubbed `node` on PATH so the probe's exit code is controllable:
#   - probe FAILS (tsx unresolvable) → assert routing reaches the bash FALLBACK, no import crash.
#   - probe SUCCEEDS (tsx works)     → assert routing reaches the TS hook (paired-negative, non-vacuous
#                                       per ai-laziness-traps T1/T14 — proves the test isn't vacuously
#                                       green on the fallback path).
#
# Deterministic, no network. Tests the SHIPPED template dispatcher (packages/core/templates/shared/
# husky-pre-push.sh), which is byte-identical in its gate to .husky/pre-push.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
DISPATCHER="$REPO_ROOT/packages/core/templates/shared/husky-pre-push.sh"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

[ -f "$DISPATCHER" ] || { echo "FATAL: dispatcher not found at $DISPATCHER"; exit 1; }

# Build a throwaway git repo carrying a marker-emitting TS_HOOK + FALLBACK so we can tell which branch
# the dispatcher took purely from stdout — without running the real hook logic.
mk_repo() {
  local d; d=$(mktemp -d)
  ( cd "$d" && git init -q )
  mkdir -p "$d/packages/core/hooks"
  # pre-push.ts present so the `[ -f "$TS_HOOK" ]` guard passes; content is irrelevant (our stub node
  # never actually runs it — it only echoes a marker for the real exec, see node stub below).
  printf '// ts hook\n' > "$d/packages/core/hooks/pre-push.ts"
  cat > "$d/packages/core/hooks/pre-push.fallback.sh" <<'FB'
#!/usr/bin/env bash
echo "ROUTE=FALLBACK"
exit 0
FB
  chmod +x "$d/packages/core/hooks/pre-push.fallback.sh"
  echo "$d"
}

# Stubbed `node` on PATH. PROBE_RC controls the probe (`node --import tsx/esm -e ''`) exit code;
# any other `node` invocation (the real exec of TS_HOOK) echoes a TS-route marker.
mk_nodebin() {
  local probe_rc="$1" d; d=$(mktemp -d)
  cat > "$d/node" <<EOF
#!/usr/bin/env bash
# node_major() calls: node -p 'process.versions.node.split(".")[0]'
case "\$*" in
  *"process.versions.node"*) echo 22; exit 0 ;;
esac
# the probe: node --import tsx/esm -e ''
if printf '%s\n' "\$@" | grep -q -- "--import" && printf '%s\n' "\$@" | grep -q -- "-e"; then
  exit $probe_rc
fi
# real exec: node --import tsx/esm <TS_HOOK>
echo "ROUTE=TSHOOK"
exit 0
EOF
  chmod +x "$d/node"
  echo "$d"
}

run_dispatcher() { # <repo> <nodebin-dir>
  local repo="$1" nb="$2"
  ( cd "$repo" && PATH="$nb:$PATH" bash "$DISPATCHER" 2>&1 )
}

# ── POSITIVE (#636 fix): unresolvable tsx (probe rc=1) → degrade to bash FALLBACK, no crash ──
REPO_A=$(mk_repo)
NB_FAIL=$(mk_nodebin 1)
OUT_A=$(run_dispatcher "$REPO_A" "$NB_FAIL"); RC_A=$?
if [ "$RC_A" -eq 0 ] && printf '%s' "$OUT_A" | grep -q "ROUTE=FALLBACK"; then
  ok "pos: broken/unresolvable tsx (probe fails) → routes to bash FALLBACK, controlled exit (no crash)"
else
  bad "pos: broken tsx did NOT degrade to fallback — rc=$RC_A out=[$OUT_A]"
fi
if ! printf '%s' "$OUT_A" | grep -q "ROUTE=TSHOOK"; then
  ok "pos: broken tsx did NOT take the TS-hook path (crash path avoided)"
else
  bad "pos: broken tsx still exec'd the TS hook (would crash on the real loader)"
fi

# ── NEG (LOAD-BEARING, non-vacuity T1/T14): working tsx (probe rc=0) → routes to TS hook ──
REPO_B=$(mk_repo)
NB_OK=$(mk_nodebin 0)
OUT_B=$(run_dispatcher "$REPO_B" "$NB_OK"); RC_B=$?
if [ "$RC_B" -eq 0 ] && printf '%s' "$OUT_B" | grep -q "ROUTE=TSHOOK"; then
  ok "neg: working tsx (probe succeeds) → routes to TS hook (proves probe doesn't force fallback always)"
else
  bad "neg: working tsx did NOT route to TS hook — rc=$RC_B out=[$OUT_B] (test would be vacuous)"
fi

# ── Source-shape: both dispatcher copies carry the probe (parity guard) ──
for f in "$REPO_ROOT/packages/core/templates/shared/husky-pre-push.sh" "$REPO_ROOT/.husky/pre-push"; do
  grep -q "node --import tsx/esm -e" "$f" \
    && ok "parity: probe present in $(basename "$f")" \
    || bad "parity: probe MISSING in $f"
done

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
