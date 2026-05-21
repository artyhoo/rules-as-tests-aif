#!/usr/bin/env bash
# Behaviour test for the factual-claim scan added to .claude/hooks/end-of-turn-reminder.sh
# (spec: docs/meta-factory/research-patches/2026-05-21-autonomous-self-audit-triggering.md §11.1).
#
# Independence: the canonical hook at $REPO_ROOT/.claude/hooks/end-of-turn-reminder.sh is
# the single source of truth — exercised through a subprocess against synthetic transcript
# fixtures in an isolated tmpdir. No inlined logic copy.
#
# Sub-tests:
#   1. positive numeric        — short turn "поправил 4 files" → fires, reason enumerates "4 files"
#   2. positive file:line      — "foo.ts:42" → fires, reason enumerates "foo.ts:42"
#   3. positive neg-existence  — "no production tool exists" → fires, reason enumerates it
#   4. negative (silent)       — short, no claim, no question → exit 0, empty stdout
#   5. valid JSON              — every fire emits jq-parseable JSON with decision=block
#   6. mutation                — break the numeric regex → sub-test 1 must STOP enumerating (kills test)
#
# CI: invoked from .github/workflows/audit-self.yml.

set -uo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
HOOK_FILE="$REPO_ROOT/.claude/hooks/end-of-turn-reminder.sh"

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# make_transcript <text>  → echoes path to a JSONL transcript whose last assistant
# message carries <text>. Built with jq so arbitrary text is safely escaped.
make_transcript() {
  local text="$1" dir
  dir=$(mktemp -d)
  jq -cn '{type:"user",message:{content:"test goal anchor"}}'                 >  "$dir/t.jsonl"
  jq -cn --arg t "$text" '{type:"assistant",message:{content:[{type:"text",text:$t}]}}' >> "$dir/t.jsonl"
  echo "$dir/t.jsonl"
}

# run_hook <hook> <transcript>  → echoes hook stdout (exit code not propagated across
# command substitution; sub-test 4 captures rc inline where it needs it).
run_hook() {
  local hook="$1" tr="$2" stdin
  stdin=$(jq -cn --arg p "$tr" '{stop_hook_active:false, transcript_path:$p}')
  printf '%s' "$stdin" | bash "$hook" 2>/dev/null
}

echo "eot-claim-scan.test.sh"

# ── 1. positive numeric ──────────────────────────────────────────────────────
tr=$(make_transcript "готово, поправил 4 files")
out=$(run_hook "$HOOK_FILE" "$tr")
reason=$(printf '%s' "$out" | jq -r '.reason // ""' 2>/dev/null)
if printf '%s' "$reason" | grep -qiE '4 files'; then ok "numeric claim enumerated on short turn"; else bad "numeric claim NOT enumerated (out: ${out:0:80})"; fi

# ── 2. positive file:line ────────────────────────────────────────────────────
tr=$(make_transcript "смотри foo.ts:42 там всё")
out=$(run_hook "$HOOK_FILE" "$tr")
reason=$(printf '%s' "$out" | jq -r '.reason // ""' 2>/dev/null)
if printf '%s' "$reason" | grep -qiE 'foo\.ts:42'; then ok "file:line citation enumerated"; else bad "file:line NOT enumerated (out: ${out:0:80})"; fi

# ── 3. positive negative-existence ───────────────────────────────────────────
tr=$(make_transcript "выяснил: no production tool exists for this")
out=$(run_hook "$HOOK_FILE" "$tr")
reason=$(printf '%s' "$out" | jq -r '.reason // ""' 2>/dev/null)
if printf '%s' "$reason" | grep -qiE 'negative-existence'; then ok "negative-existence claim enumerated"; else bad "negative-existence NOT enumerated (out: ${out:0:80})"; fi

# ── 4. negative (silent on a claim-free short turn) — capture rc inline ──────
tr=$(make_transcript "готово, поправил конфиг")
stdin=$(jq -cn --arg p "$tr" '{stop_hook_active:false, transcript_path:$p}')
out=$(printf '%s' "$stdin" | bash "$HOOK_FILE" 2>/dev/null); rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then ok "claim-free short turn stays silent"; else bad "fired on a claim-free short turn (rc=$rc out: ${out:0:80})"; fi

# ── 5. valid JSON on fire ────────────────────────────────────────────────────
tr=$(make_transcript "поправил 10 tests")
out=$(run_hook "$HOOK_FILE" "$tr")
if printf '%s' "$out" | jq -e '.decision=="block" and (.reason|length>0)' >/dev/null 2>&1; then ok "fire emits valid block JSON with non-empty reason"; else bad "fire JSON invalid/incomplete (out: ${out:0:80})"; fi

# ── 6. mutation — break numeric regex; sub-test 1 must now FAIL to enumerate ──
mut=$(mktemp)
# Drop the count-noun alternation list so the numeric pattern can no longer match.
sed -E "s/\[0-9\]\+\\\\\+\? \*\(files\?\|tests\?\|cases\?\|entries\|entry\|rules\?\|principles\?\|layers\?\|incidents\?\|candidates\?\|commits\?\|hooks\?\|lines\?\)/ZZZ_NO_MATCH_ZZZ/" "$HOOK_FILE" > "$mut"
if ! grep -q 'ZZZ_NO_MATCH_ZZZ' "$mut"; then
  bad "mutation sed did not apply (regex shape changed?) — review test"
else
  tr=$(make_transcript "готово, поправил 4 files")
  out=$(run_hook "$mut" "$tr")
  reason=$(printf '%s' "$out" | jq -r '.reason // ""' 2>/dev/null)
  if printf '%s' "$reason" | grep -qiE '4 files'; then bad "MUTATION SURVIVED — numeric regex broken but '4 files' still enumerated (test has no substance)"; else ok "mutation killed — broken numeric regex stops enumeration"; fi
fi
rm -f "$mut"

echo "── eot-claim-scan: $PASS passed, $FAIL failed ──"
[ "$FAIL" -eq 0 ]
