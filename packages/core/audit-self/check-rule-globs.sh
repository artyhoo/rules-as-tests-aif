#!/usr/bin/env bash
# check-rule-globs.sh — the "+V" verify-gate for cih-s3 F3 (glob liveness).
#
# The custom ESLint rules (R2/R7/R8) only fire on files their `files` globs match. If those
# globs match ZERO of the project's source files the rule is SILENTLY INERT — "looks armed,
# checks nothing", the worst failure for a "no check → no rule" framework. F3 broadened the
# globs to be layout-agnostic (flat / layered / monorepo), but no glob set covers every
# layout — so this gate is the ALARM: it FAILS if an ACTIVE custom rule matches no source
# file, telling the consumer to widen RULE_GLOBS in eslint.config.mjs before the silent gap
# ships. (Maintainer DN-1 = "A+V": parameterize globs AND ship the verify-gate regardless.)
#
# Active rules: R2 (boundary) is always checked; R7 (appCode) + R8 (application) are checked
# only when AIF_STRICT_RUNTIME=1 (they are opt-in per F7 — see eslint.config.mjs).
#
# Dependency-free (pure bash + find): runnable pre-PR with no node/eslint install. Reads the
# RULE_GLOBS block from eslint.config.mjs so it can never drift from the actual rule scopes.
#
# Exit: 0 = every active rule matches ≥1 source file (or the project has no source yet);
#       1 = an active rule's globs match zero existing source files (silent-inertness alarm).
set -uo pipefail

CFG="${ESLINT_CONFIG:-eslint.config.mjs}"
[ -f "$CFG" ] || { echo "check-rule-globs: $CFG not found (run from the project root)" >&2; exit 2; }

PRUNE=( -name node_modules -o -name dist -o -name coverage -o -name .stryker-tmp -o -name reports -o -name .next -o -name .git )

# Any source files at all? A fresh skeleton with no code yet → nothing to check (not an alarm).
any_src=$(find . \( "${PRUNE[@]}" \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print 2>/dev/null | head -1)
if [ -z "$any_src" ]; then
  echo "check-rule-globs: no .ts/.tsx source files yet — nothing to verify (skipped)."
  exit 0
fi

# Extract the quoted globs for a RULE_GLOBS key (boundary|appCode|application).
# Prints one glob per line. Reads the multi-line array from `<key>: [ ... ]`.
extract_key() {
  awk -v key="$1" '
    $0 ~ ("^[[:space:]]*" key ":[[:space:]]*\\[") { grab=1 }
    grab {
      while (match($0, /'"'"'[^'"'"']*'"'"'/)) {
        g=substr($0, RSTART+1, RLENGTH-2); print g
        $0=substr($0, RSTART+RLENGTH)
      }
      if ($0 ~ /\]/) grab=0
    }
  ' "$CFG"
}

# Does at least one glob in the given list match ≥1 existing source file?
# Translates `**/<token>/**/*.{ts,tsx}` (or `**/*.{ts,tsx}`) → a `find -path` probe.
any_glob_matches() {
  local glob token found
  for glob in "$@"; do
    # strip leading **/ and the trailing file pattern → the dir token (may be empty)
    token="${glob#'**/'}"
    token="${token%%/'**'/*}"        # drop /**/*.{ts,tsx} tail
    token="${token%%/'*'.*}"          # drop /*.{ts,tsx} tail
    [ "$token" = "$glob" ] && token=""   # glob was just **/*.{ts,tsx} → no dir token
    case "$glob" in '**/*.'*) token="";; esac
    if [ -z "$token" ]; then
      found=$(find . \( "${PRUNE[@]}" \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print 2>/dev/null | head -1)
    else
      found=$(find . \( "${PRUNE[@]}" \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -path "*/$token/*" -print 2>/dev/null | head -1)
    fi
    [ -n "$found" ] && return 0
  done
  return 1
}

FAIL=0
check_rule() { # $1 = human name, $2 = RULE_GLOBS key
  local globs=(); local line
  while IFS= read -r line; do [ -n "$line" ] && globs+=("$line"); done < <(extract_key "$2")
  if [ "${#globs[@]}" -eq 0 ]; then
    echo "  ⚠  $1: no globs found under RULE_GLOBS.$2 in $CFG (check the config)"; FAIL=1; return
  fi
  if any_glob_matches "${globs[@]}"; then
    echo "  ✓ $1 (RULE_GLOBS.$2): matches ≥1 source file"
  else
    echo "  ✗ $1 (RULE_GLOBS.$2): matches ZERO source files — rule is SILENTLY INERT."
    echo "     Widen RULE_GLOBS.$2 in $CFG to cover your layout (globs: ${globs[*]})"
    FAIL=1
  fi
}

echo "▶ check-rule-globs: verifying custom-rule globs match real source files"
check_rule "R2 no-unsafe-zod-parse" boundary
if [ "${AIF_STRICT_RUNTIME:-}" = "1" ]; then
  check_rule "R7 no-direct-time-randomness" appCode
  check_rule "R8 require-otel-span" application
else
  echo "  · R7/R8 skipped (AIF_STRICT_RUNTIME≠1 — runtime-discipline rules are opt-in)"
fi

[ "$FAIL" -eq 0 ] && echo "check-rule-globs: OK" || echo "check-rule-globs: FAILED — a custom rule is inert against this layout." >&2
exit "$FAIL"
