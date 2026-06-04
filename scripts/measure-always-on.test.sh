#!/usr/bin/env bash
# Test for measure-always-on.sh — runs the meter and asserts a valid, sane baseline.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
out="$("$DIR/measure-always-on.sh")" || { echo "FAIL: script errored"; exit 1; }
echo "$out" | jq -e . >/dev/null 2>&1 || { echo "FAIL: not valid JSON"; exit 1; }
total="$(echo "$out" | jq -r '.total_bytes')"
[[ "$total" =~ ^[0-9]+$ ]] || { echo "FAIL: total_bytes not integer"; exit 1; }
# Baseline must exceed 100k (11 rules ~151k + CLAUDE.md), guards an empty-manifest regression.
(( total > 100000 )) || { echo "FAIL: total_bytes $total <= 100000 (manifest empty?)"; exit 1; }
echo "PASS: total_bytes=$total"
