#!/usr/bin/env bash
# SubagentStop WARN hook — scan the finishing subagent's output for canonical
# REPORT sections; if any are missing, print a warning to stderr and exit 0
# (non-blocking). Maintainer chose WARN over block (exit 2) — judgment target,
# not mechanically gateable (#gate-where-judgment-needed). SSOT #108 candidate-3.
#
# @cc-only-rationale: internal orchestrator hook, maintainer-env only, no portable fire-point
#
# Contract verified DUAL-CHANNEL 2026-06-01:
#   Channel 1 — WebFetch code.claude.com/docs/en/hooks:
#     SubagentStop stdin fields include agent_type, agent_id. Exit 0 = non-blocking;
#     exit 2 = blocking (NOT used here). Stderr is surfaced to the user.
#   Channel 2 — DeepWiki anthropics/claude-code:
#     "agent_transcript_path: The file path to the subagent's transcript."
#     "last_assistant_message: The final message from the assistant (subagent).
#      This field is crucial for hooks that need to analyze the subagent's final output."
#     "exit 0: Non-blocking" / "exit 2: Blocking"
#
# Read-path priority (B1 — scan-nothing trap avoidance):
#   1. If last_assistant_message is non-empty → scan it directly (no disk I/O).
#   2. Else open agent_transcript_path as JSONL and extract the final assistant
#      text — reuses the exact grep|tail|jq pattern from end-of-turn-reminder.sh:30-41.
#   3. If BOTH yield empty → silent exit 0 (genuinely nothing to scan; capability
#      to scan was verified — this is NOT theatre).
#
# Noise guard (M1) — warn ONLY when BOTH hold:
#   (1) agent_type NOT in the skip-set: skip entirely when agent_type = "Explore"
#       (reliable negative filter from the payload; extend only with named types).
#   (2) scanned text carries a REPORT cue as a STANDALONE label on its own line,
#       matched by:
#         grep -qE '^(#{1,3} *VERIFY|VERIFY:|Confidence:|ATTN:|Commit:)'
#       grep works line-by-line — ^ anchors to start of line, not start of string.
#       Bare prose words like "confidence in my analysis" do NOT match (no line-start
#       anchor hit). This is the key distinction from scanning arbitrary text.
#
# Required REPORT sections checked: VERIFY, Confidence, ATTN
#   (load-bearing three; small set chosen to minimize false-positives while covering
#   the substantive completeness signal the orchestrator needs).
set -uo pipefail

command -v jq >/dev/null 2>&1 || exit 0   # graceful no-op without jq

INPUT="$(cat)"

# ── Noise guard part 1: skip read-only agent types ──────────────────────────
AGENT_TYPE="$(printf '%s' "$INPUT" | jq -r '.agent_type // ""' 2>/dev/null || true)"
case "$AGENT_TYPE" in
  Explore)
    # Known read-only type — no REPORT schema expected; silent exit.
    exit 0
    ;;
esac

# ── Read the subagent's final output (B1 — two read paths) ──────────────────
TEXT=""

# Path 1: last_assistant_message (available since CC 2.1.47 per DeepWiki)
TEXT="$(printf '%s' "$INPUT" | jq -r '.last_assistant_message // ""' 2>/dev/null || true)"

# Path 2: agent_transcript_path JSONL — reuses end-of-turn-reminder.sh:30-41 pattern
if [ -z "$TEXT" ]; then
  TRANSCRIPT="$(printf '%s' "$INPUT" | jq -r '.agent_transcript_path // ""' 2>/dev/null || true)"
  if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
    LAST_LINE="$(grep '"type":"assistant"' "$TRANSCRIPT" 2>/dev/null | tail -1 || true)"
    if [ -n "$LAST_LINE" ]; then
      TEXT="$(printf '%s' "$LAST_LINE" | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null || true)"
    fi
  fi
fi

# Nothing to scan — genuinely empty (not theatre; capability verified above)
[ -z "$TEXT" ] && exit 0

# ── Noise guard part 2: is this actually a REPORT? ──────────────────────────
# grep works line-by-line, so ^ anchors to start of each line. A REPORT-cue label
# must appear at line start (e.g. "VERIFY:" or "## VERIFY"). Bare prose words
# mid-sentence do NOT match — this is what separates noise-guard from noise.
REPORT_CUE_RE='^(#{1,3} *VERIFY|VERIFY:|Confidence:|ATTN:|Commit:)'
if ! printf '%s' "$TEXT" | grep -qE "$REPORT_CUE_RE"; then
  # Not a REPORT-shaped output — silent exit (noise guard holds)
  exit 0
fi

# ── Check for required REPORT sections ──────────────────────────────────────
# Required sections: VERIFY, Confidence, ATTN
# Each pattern anchors with ^ (line-start) so it only matches a standalone label.
MISSING=()

if ! printf '%s' "$TEXT" | grep -qE '^(#{1,3} *VERIFY|VERIFY:)'; then
  MISSING+=("VERIFY")
fi
if ! printf '%s' "$TEXT" | grep -qE '^Confidence:'; then
  MISSING+=("Confidence")
fi
if ! printf '%s' "$TEXT" | grep -qE '^(#{1,3} *ATTN|ATTN:)'; then
  MISSING+=("ATTN")
fi

# ── Emit warning if any sections missing ────────────────────────────────────
if [ "${#MISSING[@]}" -gt 0 ]; then
  MISSING_LIST="$(IFS=', '; echo "${MISSING[*]}")"
  printf '⚠ SubagentStop: REPORT missing section(s): %s\n' "$MISSING_LIST" >&2
fi

exit 0
