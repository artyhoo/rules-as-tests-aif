#!/usr/bin/env bash
# Test for probe-channels.sh — a known rule with a shipped principle-test must report gate=yes.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
out="$("$DIR/probe-channels.sh")" || { echo "FAIL: script errored"; exit 1; }
# ai-laziness-traps has principle 12 (verified present) → must be reported as gate-backed.
echo "$out" | grep -q "ai-laziness-traps.*gate=yes" || { echo "FAIL: ai-laziness-traps not gate=yes"; exit 1; }
# A rule with no principle-test/hook must be reported gate=no (judgment candidate).
echo "$out" | grep -q "reviewer-discipline.*gate=no" || { echo "FAIL: reviewer-discipline not gate=no"; exit 1; }
echo "PASS"
