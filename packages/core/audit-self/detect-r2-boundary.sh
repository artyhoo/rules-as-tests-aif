#!/usr/bin/env bash
# detect-r2-boundary.sh — C1 of install auto-wire R2 (GH #547 Point 2).
#
# Classifies a repo into exactly one R2-boundary verdict by READING it (pure bash + find/grep, no
# node/eslint). The installer (C2, install.sh §6b-bis) and BOTH inertness gates (C4: check-rule-
# globs.sh + check-rule-enforced.sh via r2-na-marker.sh) consume the verdict to decide whether R2
# must be wired, may be recorded N/A, or stays the red alarm.
#
# Verdicts (the FIRST stdout line is exactly one of):
#   boundary-present       — a manual-parse HTTP boundary exists: ≥1 file under a RULE_GLOBS.boundary
#                            token folder (handlers/routes/controllers/app·api/actions) OR a zod parse
#                            call (`.safeParse(` anywhere, or `<ident>.parse(` where <ident> ∉
#                            JSON/Date/Number/parseInt/parseFloat) in NON-TEST source. R2 must be
#                            active. Subsequent `glob:<pattern>` lines list the covering globs the
#                            installer should ensure RULE_GLOBS.boundary holds.
#   no-boundary-confident  — declarative-validation framework (allowlist) present AND zero boundary
#                            signals. Safe to record a conditional R2 N/A.
#   ambiguous              — anything else. Stay red (today's behaviour). No auto-green on doubt.
#
# Conservative invariant (LOAD-BEARING): no-boundary-confident requires a POSITIVE allowlist match
# AND zero boundary signals. Every uncertain case degrades to `ambiguous`. A false `no-boundary-
# confident` (silently un-guarding a real boundary) is therefore structurally unlikely; the worst
# realistic outcome is a false `ambiguous` (a red the human reconciles) — the same cost as today.
#
# Exit: always 0 (a classifier, not a gate). The verdict is on stdout.
set -uo pipefail

ROOT="${R2_DETECT_ROOT:-.}"
PKG_JSON="${R2_PKG_JSON:-$ROOT/package.json}"

# Declarative-validation frameworks whose presence + zero boundary signals → confident N/A. SEED:
# @hono/zod-openapi only (timeliner's stack). Extensible: comma-separated env override. Other
# declarative stacks (tRPC, Fastify schema, TypeBox) deliberately stay `ambiguous` (red) until added
# here — the safe default (spec §9 risk 3 / kickoff risk 3).
DECLARATIVE_ALLOWLIST="${R2_DECLARATIVE_ALLOWLIST:-@hono/zod-openapi}"

PRUNE=( -name node_modules -o -name dist -o -name coverage -o -name .stryker-tmp -o -name reports -o -name .next -o -name .git )
BOUNDARY_TOKENS=( handlers routes controllers actions )   # app/api is two-segment → path-probed below

# A file is "test" (excluded from boundary signals) if it is *.test.* / *.spec.* / under __tests__ / under tests/.
is_test_path() { case "$1" in *.test.*|*.spec.*|*/__tests__/*|*/tests/*) return 0 ;; esac; return 1; }

# (1) Files under a boundary-token folder (one path per line, non-test only).
boundary_token_files() {
  local t f
  for t in "${BOUNDARY_TOKENS[@]}"; do
    while IFS= read -r f; do is_test_path "$f" || printf '%s\n' "$f"; done < <(
      find "$ROOT" \( "${PRUNE[@]}" \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -path "*/$t/*" -print 2>/dev/null)
  done
  while IFS= read -r f; do is_test_path "$f" || printf '%s\n' "$f"; done < <(
    find "$ROOT" \( "${PRUNE[@]}" \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -path "*/app/api/*" -print 2>/dev/null)
}

# (2) zod-parse call sites in non-test source (one path per line). `.safeParse(` anywhere, OR
# `<ident>.parse(` where <ident> is not a stdlib parser. BSD grep lacks -P (no negative lookbehind),
# so match `.parse(` first then exclude stdlib idents on the captured token.
parse_site_files() {
  local f
  while IFS= read -r f; do
    is_test_path "$f" && continue
    if grep -qE '\.safeParse\(' "$f" 2>/dev/null; then printf '%s\n' "$f"; continue; fi
    if grep -oE '[A-Za-z_$][A-Za-z0-9_$]*\.parse\(' "$f" 2>/dev/null \
         | grep -qvE '^(JSON|Date|Number|parseInt|parseFloat)\.parse\('; then
      printf '%s\n' "$f"
    fi
  done < <(find "$ROOT" \( "${PRUNE[@]}" \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print 2>/dev/null)
}

# (3) Is an allowlisted declarative-validation framework declared in package.json (deps or devDeps)?
declarative_framework_present() {
  [ -f "$PKG_JSON" ] || return 1
  local dep esc
  while IFS= read -r dep; do
    [ -z "$dep" ] && continue
    esc=$(printf '%s' "$dep" | sed 's/[.[\*^$/]/\\&/g')   # escape ERE metachars (/, ., etc.)
    grep -qE "\"$esc\"[[:space:]]*:" "$PKG_JSON" && return 0
  done < <(printf '%s\n' "$DECLARATIVE_ALLOWLIST" | tr ',' '\n')
  return 1
}

BT_FILES="$(boundary_token_files)"
PS_FILES="$(parse_site_files)"

if [ -n "$BT_FILES" ] || [ -n "$PS_FILES" ]; then
  echo "boundary-present"
  # Default RULE_GLOBS.boundary globs always cover the token folders.
  for g in '**/handlers/**/*.{ts,tsx}' '**/routes/**/*.{ts,tsx}' '**/controllers/**/*.{ts,tsx}' '**/app/api/**/*.{ts,tsx}' '**/actions/**/*.{ts,tsx}'; do
    echo "glob:$g"
  done
  # For every parse-site OUTSIDE a token folder, emit a parent-dir-token glob so a hand-rolled parse
  # boundary (e.g. src/api/x.ts) gets R2 coverage (spec fixture B). Dedup the extras.
  printf '%s\n' "$PS_FILES" | while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in */handlers/*|*/routes/*|*/controllers/*|*/app/api/*|*/actions/*) continue ;; esac
    tok=$(basename "$(dirname "$f")")
    [ -n "$tok" ] && [ "$tok" != "." ] && echo "glob:**/$tok/**/*.{ts,tsx}"
  done | sort -u
  exit 0
fi

if declarative_framework_present; then
  echo "no-boundary-confident"
  exit 0
fi

echo "ambiguous"
exit 0
