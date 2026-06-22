#!/usr/bin/env bash
# S2 acceptance — relocated plugin hooks are extensionless, marked, and env-var-correct.
# spec: docs/superpowers/specs/2026-06-22-cc-plugin-packaging-design.md §5 (path-translation)
#       docs/superpowers/plans/plugin-hook-triage.md (the per-hook triage)
#
# Asserts, for every relocated hook script under plugin/hooks/ (i.e. every file that is
# NOT run-hook.cmd, NOT *.json, NOT *.md):
#   (a) extensionless filename            — dodges CC's Windows ".sh → prepend bash" quirk
#   (b) carries a delivery-channel marker — @dual-pair | @cc-only-rationale (dual-impl §6)
#   (c) no plugin-data path hardcodes "$CLAUDE_PROJECT_DIR/.claude/hooks/" (relocation bug)
#   (d) if it reads consumer rules (.claude/rules), it resolves them via CLAUDE_PROJECT_DIR
#   (e) if it sources siblings, it self-resolves its own dir
# Plus manifest sanity:
#   (f) plugin/hooks/hooks.json parses
#   (g) every command target named in hooks.json exists under plugin/hooks/
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
HOOKS_DIR="$REPO_ROOT/plugin/hooks"
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✓ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# --- collect the relocated hook scripts -------------------------------------
shopt -s nullglob
scripts=()
for f in "$HOOKS_DIR"/*; do
  base=$(basename "$f")
  case "$base" in
    run-hook.cmd|*.json|*.md) continue ;;
  esac
  [ -f "$f" ] && scripts+=("$f")
done

if [ "${#scripts[@]}" -eq 0 ]; then
  bad "no relocated hook scripts found under plugin/hooks/ (S2 ships ≥1)"
fi

# Guard the iteration: bash 3.2 + `set -u` aborts on "${empty[@]}".
for f in ${scripts[@]+"${scripts[@]}"}; do
  base=$(basename "$f")

  # (a) extensionless
  case "$base" in
    *.*) bad "$base has an extension (must be extensionless)";;
    *)   ok  "$base is extensionless";;
  esac

  # (b) delivery-channel marker
  if grep -qE '^# @(dual-pair|cc-only-rationale):' "$f"; then
    ok "$base carries a delivery-channel marker"
  else
    bad "$base missing @dual-pair / @cc-only-rationale marker"
  fi

  # (c) no plugin-data path rooted at $CLAUDE_PROJECT_DIR/.claude/hooks/
  if grep -qE 'CLAUDE_PROJECT_DIR[^[:space:]]*/\.claude/hooks/' "$f"; then
    bad "$base hardcodes \$CLAUDE_PROJECT_DIR/.claude/hooks/ (relocation bug)"
  else
    ok "$base has no mis-rooted plugin-data path"
  fi

  # (d) reads consumer rules → must go through CLAUDE_PROJECT_DIR
  if grep -qE '\.claude/rules' "$f"; then
    if grep -qE 'CLAUDE_PROJECT_DIR' "$f"; then
      ok "$base resolves consumer rules via CLAUDE_PROJECT_DIR"
    else
      bad "$base reads .claude/rules but never references CLAUDE_PROJECT_DIR (project-data misrooted)"
    fi
  fi

  # (e) sources siblings → self-resolves its dir
  if grep -qE '^[[:space:]]*(\.|source)[[:space:]]' "$f"; then
    if grep -qE 'dirname "?\$\{?(BASH_SOURCE|0)' "$f"; then
      ok "$base self-resolves its dir before sourcing siblings"
    else
      bad "$base sources siblings without self-resolving its dir"
    fi
  fi
done

# (f)(g) hooks.json sanity
HJ="$HOOKS_DIR/hooks.json"
if [ -f "$HJ" ] && python3 -c "import json;json.load(open('$HJ'))" 2>/dev/null; then
  ok "hooks.json parses"
  # every "run-hook.cmd <name>" target must exist as a sibling
  targets=$(python3 -c "
import json,re
d=json.load(open('$HJ'))
seen=set()
def walk(o):
    if isinstance(o,dict):
        for v in o.values(): walk(v)
    elif isinstance(o,list):
        for v in o: walk(v)
    elif isinstance(o,str):
        m=re.search(r'run-hook\.cmd\"?\s+([A-Za-z0-9_-]+)', o)
        if m: seen.add(m.group(1))
walk(d)
print('\n'.join(sorted(seen)))
" 2>/dev/null)
  if [ -z "$targets" ]; then
    bad "hooks.json names no run-hook.cmd targets"
  else
    for t in $targets; do
      [ -f "$HOOKS_DIR/$t" ] && ok "hooks.json target '$t' exists" || bad "hooks.json target '$t' missing under plugin/hooks/"
    done
  fi
else
  bad "hooks.json missing or invalid JSON"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
