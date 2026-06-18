#!/usr/bin/env bash
# r2-na-marker.sh — shared C3-marker reader for the R2 inertness gates (GH #547 Point 2).
#
# SOURCED by check-rule-globs.sh AND check-rule-enforced.sh so the two gates can NEVER diverge on
# whether/how they honor a recorded `R2 N/A` decision (spec §9 risk 2 — "two gates, one marker").
# Defines two functions; sourcing has no side effects.
#
#   r2_na_marker_present  → rc 0 if .ai-factory/tool-decisions.md carries the aif:r2-na block.
#   r2_na_recheck         → re-runs the C1 boundary probe and echoes exactly one of:
#                              holds  — precondition still no-boundary-confident (N/A legitimately holds)
#                              broke  — boundary now present OR ambiguous (the N/A no longer holds → red)
#
# The detector is a SIBLING of this helper (both ship to scripts/ in a consumer and both live in
# packages/core/audit-self/ in the framework repo) → ONE path resolves in both homes.

_R2NA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
R2_DECISIONS_FILE="${AIF_TOOL_DECISIONS:-.ai-factory/tool-decisions.md}"
R2_DETECT_SCRIPT="${R2_DETECT_SCRIPT:-$_R2NA_DIR/detect-r2-boundary.sh}"

r2_na_marker_present() {
  [ -f "$R2_DECISIONS_FILE" ] && grep -qF '<!-- aif:r2-na:begin -->' "$R2_DECISIONS_FILE"
}

r2_na_recheck() {
  local v
  v="$(bash "$R2_DETECT_SCRIPT" 2>/dev/null | head -1)"
  if [ "$v" = "no-boundary-confident" ]; then echo holds; else echo broke; fi
}
