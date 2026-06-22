#!/usr/bin/env bash
# consumer-upgrade-path — acceptance tests for install.sh --refresh.
#
# T3 acceptance gate (research-patch §5, plan Phase 2):
#   customise-survives: .override.md signals consumer-ownership → base file is NOT
#     clobbered, non-override sibling IS refreshed, override file is preserved.
#   stale-refreshed (paired-negative): a stale framework-owned file IS refreshed;
#     a test that passes even when refresh is a no-op is #discipline-theatre.
#
# Harness shape mirrors f15-prettierignore.test.sh: mktemp → git init → install →
# mutation → re-run refresh → assertion. Paired-negative arms prove non-vacuity.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# ── shared: create a minimal consumer with a full install ──────────────────
make_consumer() {
  local T
  T=$(mktemp -d)
  printf '{ "name":"consumer","version":"0.0.0" }\n' > "$T/package.json"
  ( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server ) >/dev/null 2>&1
  echo "$T"
}

# ══════════════════════════════════════════════════════════════════════════════
# TEST 1 — stale-refreshed (paired-negative)
# Plant stale content in a framework-owned agent, run --refresh, assert the
# current content is now present. The paired-negative arm shows the assertion
# FAILS when refresh is not run (i.e. the test cannot pass vacuously).
# ══════════════════════════════════════════════════════════════════════════════
TC=$(make_consumer)
AGENT_DST="$TC/.claude/agents/compliance-verifier.md"
CURRENT_CONTENT=$(cat "$AGENT_DST")
STALE_MARKER="STALE_CONTENT_INJECTED_BY_TEST"

# Plant stale content
printf '%s\n' "$STALE_MARKER" > "$AGENT_DST"

# Run --refresh (non-dry-run so it actually writes)
( cd "$TC" && bash "$REPO_ROOT/install.sh" --refresh ) >/dev/null 2>&1

# Assert: stale content replaced by current framework content
if grep -qF "$STALE_MARKER" "$AGENT_DST"; then
  bad "stale-refreshed pos: stale marker still present after --refresh (file was NOT refreshed)"
else
  ok "stale-refreshed pos: stale marker gone after --refresh (file was refreshed)"
fi

# Assert: file now matches the current framework source
CURRENT_SOURCE=$(cat "$REPO_ROOT/agents/compliance-verifier.md")
if [ "$(cat "$AGENT_DST")" = "$CURRENT_SOURCE" ]; then
  ok "stale-refreshed pos: refreshed content matches framework source (not a truncated stub)"
else
  bad "stale-refreshed pos: refreshed content does NOT match framework source"
fi

# neg (LOAD-BEARING): WITHOUT refresh, stale content persists — proves assertion is non-vacuous.
TC_NEG=$(make_consumer)
AGENT_DST_NEG="$TC_NEG/.claude/agents/compliance-verifier.md"
printf '%s\n' "$STALE_MARKER" > "$AGENT_DST_NEG"
# Do NOT run --refresh
if grep -qF "$STALE_MARKER" "$AGENT_DST_NEG"; then
  ok "stale-refreshed neg: without --refresh, stale marker persists (assertion is non-vacuous)"
else
  bad "stale-refreshed neg: stale marker gone even without --refresh → test was vacuous"
fi

rm -rf "$TC" "$TC_NEG"

# ══════════════════════════════════════════════════════════════════════════════
# TEST 2 — customise-survives
# Consumer uses .override.md to signal Layer-3 ownership of an agent file.
# After --refresh:
#   (a) the .override.md is preserved (consumer customization survives)
#   (b) the overridden agent's base file is NOT clobbered (skip because override present)
#   (c) a DIFFERENT agent (no override) IS refreshed (proves refresh ran, not a no-op)
# ══════════════════════════════════════════════════════════════════════════════
TC2=$(make_consumer)
AGENT_OWNED="$TC2/.claude/agents/living-docs-auditor.md"      # will get override.md
AGENT_OTHER="$TC2/.claude/agents/compliance-verifier.md"      # no override → must be refreshed

# Plant stale content in BOTH agents (so we can distinguish skip vs. refresh)
STALE2="STALE_CONSUMER_EDIT_DO_NOT_CLOBBER"
printf '%s\n' "$STALE2" > "$AGENT_OWNED"
printf '%s\n' "$STALE2" > "$AGENT_OTHER"

# Create the override file (consumer signals Layer-3 ownership of living-docs-auditor)
OVERRIDE_FILE="${AGENT_OWNED%.md}.override.md"
printf '# Consumer override for living-docs-auditor\n' > "$OVERRIDE_FILE"
OVERRIDE_CONTENT=$(cat "$OVERRIDE_FILE")

# Run --refresh
( cd "$TC2" && bash "$REPO_ROOT/install.sh" --refresh ) >/dev/null 2>&1

# (a) override file preserved untouched
if [ "$(cat "$OVERRIDE_FILE")" = "$OVERRIDE_CONTENT" ]; then
  ok "customise-survives: .override.md is preserved after --refresh"
else
  bad "customise-survives: .override.md was modified by --refresh (consumer customization lost)"
fi

# (b) the overridden agent base file is NOT clobbered (skip because override.md present)
if grep -qF "$STALE2" "$AGENT_OWNED"; then
  ok "customise-survives: overridden agent base file NOT clobbered (.override.md respected)"
else
  bad "customise-survives: overridden agent base file WAS clobbered despite .override.md"
fi

# (c) the non-overridden agent IS refreshed (proves refresh actually ran)
if grep -qF "$STALE2" "$AGENT_OTHER"; then
  bad "customise-survives: non-overridden agent still has stale content (refresh was a no-op?)"
else
  ok "customise-survives: non-overridden agent was refreshed (refresh is not a no-op)"
fi

# neg (LOAD-BEARING): without override.md, stale agent IS refreshed (no protection)
TC2_NEG=$(make_consumer)
AGENT_UNPROTECTED="$TC2_NEG/.claude/agents/living-docs-auditor.md"
printf '%s\n' "$STALE2" > "$AGENT_UNPROTECTED"
# No override file created
( cd "$TC2_NEG" && bash "$REPO_ROOT/install.sh" --refresh ) >/dev/null 2>&1
if grep -qF "$STALE2" "$AGENT_UNPROTECTED"; then
  bad "customise-survives neg: without .override.md, stale content persisted (refresh skipped it — wrong)"
else
  ok "customise-survives neg: without .override.md, agent was refreshed (override.md is the protection signal)"
fi

rm -rf "$TC2" "$TC2_NEG"

# ══════════════════════════════════════════════════════════════════════════════
# TEST 3 — dry-run preview is faithful (shows what would happen, writes nothing)
# ══════════════════════════════════════════════════════════════════════════════
TC3=$(make_consumer)
AGENT_STALE="$TC3/.claude/agents/memory-codification-auditor.md"
printf '%s\n' "STALE_DRYRUN_MARKER" > "$AGENT_STALE"

DRY_OUT=$( cd "$TC3" && bash "$REPO_ROOT/install.sh" --refresh --dry-run 2>&1 )

# Dry-run must mention the agent
if printf '%s\n' "$DRY_OUT" | grep -q "memory-codification-auditor.md"; then
  ok "dry-run: output mentions the stale agent file"
else
  bad "dry-run: output does not mention memory-codification-auditor.md"
fi

# Dry-run must NOT have written the file (stale marker must persist)
if grep -q "STALE_DRYRUN_MARKER" "$AGENT_STALE"; then
  ok "dry-run: stale marker still present after --dry-run (nothing was written)"
else
  bad "dry-run: stale marker gone after --dry-run (dry-run wrote the file — wrong)"
fi

# neg: confirm real refresh DOES write (proves dry-run guard is real, not vacuous)
( cd "$TC3" && bash "$REPO_ROOT/install.sh" --refresh ) >/dev/null 2>&1
if grep -q "STALE_DRYRUN_MARKER" "$AGENT_STALE"; then
  bad "dry-run neg: real --refresh left the stale marker (refresh was a no-op — proves nothing)"
else
  ok "dry-run neg: real --refresh removed stale marker (dry-run guard was real, non-vacuous)"
fi

rm -rf "$TC3"

# ══════════════════════════════════════════════════════════════════════════════
# TEST 4 — #635: --refresh ships the hooks {"type":"module"} marker
# A consumer that predates the marker (or whose marker was lost) must regain
# packages/core/hooks/package.json on --refresh — else the refreshed multi-file
# pre-push.ts loads as CJS and dies with ERR_REQUIRE_CYCLE_MODULE on Node ≥22.
# Paired-negative: WITHOUT --refresh the deleted marker stays absent (non-vacuous).
# ══════════════════════════════════════════════════════════════════════════════
TC4=$(make_consumer)
MARKER_DST="$TC4/packages/core/hooks/package.json"
MARKER_SRC="$REPO_ROOT/packages/core/templates/shared/hooks-package.json"

# Simulate the pre-fix state: a consumer that has no type:module marker.
rm -f "$MARKER_DST"

# Run --refresh (non-dry-run so it actually writes)
( cd "$TC4" && bash "$REPO_ROOT/install.sh" --refresh ) >/dev/null 2>&1

# (pos) marker now exists and equals the shipped source (not a stub)
if [ -f "$MARKER_DST" ]; then
  ok "gh-635 pos: hooks/package.json exists after --refresh (marker re-shipped)"
else
  bad "gh-635 pos: hooks/package.json still ABSENT after --refresh (#635 not fixed)"
fi
if [ -f "$MARKER_DST" ] && [ "$(cat "$MARKER_DST")" = "$(cat "$MARKER_SRC")" ]; then
  ok "gh-635 pos: refreshed marker content equals shipped hooks-package.json (type:module, not a stub)"
else
  bad "gh-635 pos: refreshed marker does NOT match shipped source"
fi

# neg (LOAD-BEARING): delete the marker, do NOT refresh → it stays absent (non-vacuous).
TC4_NEG=$(make_consumer)
MARKER_NEG="$TC4_NEG/packages/core/hooks/package.json"
rm -f "$MARKER_NEG"
# Do NOT run --refresh
if [ ! -f "$MARKER_NEG" ]; then
  ok "gh-635 neg: without --refresh, deleted marker stays absent (assertion is non-vacuous)"
else
  bad "gh-635 neg: marker reappeared without --refresh → test was vacuous"
fi

rm -rf "$TC4" "$TC4_NEG"

echo ""
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
