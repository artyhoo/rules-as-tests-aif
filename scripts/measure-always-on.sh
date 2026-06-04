#!/usr/bin/env bash
# Measure the always-on context baseline (bytes) — the ai-doc-audit exit-criterion meter.
# Always-on sources = files CC loads at session start. The manifest below is the DECLARED
# set; the channel probe (probe-channels.sh) confirms membership. Emits per-file + total JSON.
# spec: docs/superpowers/specs/2026-06-04-ai-doc-audit-design.md §Success-criteria
set -uo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

files=( "CLAUDE.md" )
while IFS= read -r r; do files+=( "$r" ); done < <(find .claude/rules -maxdepth 1 -name '*.md' | sort)

total=0
printf '{\n  "sources": [\n'
first=1
for f in "${files[@]}"; do
  [[ -f "$f" ]] || continue
  b=$(wc -c < "$f" | tr -d ' ')
  total=$(( total + b ))
  [[ $first -eq 0 ]] && printf ',\n'
  printf '    {"path": "%s", "bytes": %s}' "$f" "$b"
  first=0
done
printf '\n  ],\n  "total_bytes": %s\n}\n' "$total"
