#!/usr/bin/env bash
# cih-s2 F9 — "/aif-* command honesty". The framework intentionally does NOT vendor
# AI-Factory: install.sh ships skill-context SKILLs, never `.claude/commands/`, so no
# `/aif-*` slash command ever exists in a consumer project. Yet two shipped docs
# (AGENTS.md, checks-map.md) presented `/aif-verify` as the UNCONDITIONAL "required
# before commit" / Pre-PR gate — promising a command the installer never delivers.
# The honest, always-present gate is `./scripts/audit-ai-docs.sh` + the pre-push hook
# + CI. This probe asserts the reframe: `/aif-verify` survives only as an "if you use
# AI-Factory" enhancement, never as the named/required gate.
#
# SCOPE (intentional, per kickoff-s2 §2): F9 reframes ONLY AGENTS.md.template +
# checks-map.md. Other shipped docs (CLAUDE.md.template, DESCRIPTION.template.md,
# overview.md, SKILL.md, …) also mention `/aif-*` — those are a TRACKED FOLLOW-UP the
# orchestrator surfaces separately. A green probe here is therefore NOT "no doc anywhere
# lies"; it is "the 2 docs in scope no longer present /aif-* as the shipped gate" (T14).
#
# Of the 7 checks-map `/aif-verify` refs, only the 3 PRIMARY level-4 STAGE LABELS are
# MECHANICALLY asserted here (ASCII diagram PRE-PR column + table rows 44 / 106). The
# soft-conditional "AIF /aif-verify" refs (mature-pipeline + cheat-sheet rows) and the
# sub-agent prose are reframed by hand per the dispatch but not mechanically gated —
# a green probe must not be read as "every /aif ref is honest" (T14).
#
# PAIRED-NEGATIVE (umbrella discipline): each pos arm has a neg arm that re-introduces
# the exact dishonest phrasing into the rendered doc and re-runs the SAME grep — it MUST
# flip to a hit. If a neg arm does not bite, the pos check was vacuous → reported as bad.
#
# Runs the REAL pipeline: installs from THIS worktree's install.sh into a temp consumer.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# ── Install into a fresh temp consumer via the real install.sh ──
T=$(mktemp -d)
printf '{ "name":"t","version":"0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1

# ── 1. shipped-state: no /aif-* command is installed ──
[ ! -d "$T/.claude/commands" ] \
  && ok "shipped: no .claude/commands/ dir (no /aif-* command vendored)" \
  || bad "shipped: .claude/commands/ exists — installer vendored /aif-* commands?"

# ── 2. AGENTS.md honesty (pos + neg) ──
# The dishonest phrasings must be ABSENT after the reframe. No escape clause: a conditional
# reframe simply does not contain "required before commit" or "Skipping …/aif-verify".
# (An escape allowing the literal token `aif` would be vacuous — `/aif-verify` contains `aif`.)
A="$T/AGENTS.md"
[ -f "$A" ] || bad "AGENTS.md not installed at $A"

# pos: dishonest phrasings gone
out=$(grep -nE 'required before commit|Skipping[^|]*/aif-verify' "$A")
[ -z "$out" ] \
  && ok "AGENTS pos: no unconditional 'required before commit' / 'Skipping …/aif-verify'" \
  || bad "AGENTS pos: doc still presents /aif-verify as required gate:"$'\n'"$out"

# neg (LOAD-BEARING): re-inject the dishonest "Skipping /aif-verify" line → grep MUST bite
cp "$A" "$A.bak"
printf '\n- Skipping `/aif-verify` before PR.\n' >> "$A"
out=$(grep -nE 'required before commit|Skipping[^|]*/aif-verify' "$A")
[ -n "$out" ] \
  && ok "AGENTS neg: re-injected 'Skipping /aif-verify' → grep bites (non-vacuous)" \
  || bad "AGENTS neg: re-injected dishonest line but grep stayed empty → VACUOUS check"
mv "$A.bak" "$A"

# ── 3. checks-map honesty (pos + neg) ──
# Ships to consumers at .claude/skills/rules-as-tests/references/checks-map.md.
# Bite on the level-4 STAGE LABEL, not "is AIF mentioned anywhere on the line" (vacuous:
# row 44 already carries review-sidecar; a same-line audit-ai-docs already exists in prose).
C="$T/.claude/skills/rules-as-tests/references/checks-map.md"
[ -f "$C" ] || bad "checks-map not installed at $C"

# pos-A1: table row 44 stage-label parens no longer contain aif-verify (parens close first)
out=$(grep -nE 'Pre-PR\*\* \([^)]*aif-verify' "$C")
[ -z "$out" ] \
  && ok "checks-map pos-A1: row-44 stage-label parens have no /aif-verify" \
  || bad "checks-map pos-A1: row-44 stage label still labelled /aif-verify:"$'\n'"$out"

# pos-A2: doc-mapping row 106 stage-label cell no longer contains aif-verify before the |
out=$(grep -nE 'Pre-PR /[^|]*aif-verify' "$C")
[ -z "$out" ] \
  && ok "checks-map pos-A2: row-106 stage-label cell has no /aif-verify" \
  || bad "checks-map pos-A2: row-106 stage label still labelled /aif-verify:"$'\n'"$out"

# pos-B: the shipped gate now labels lvl-4 (non-vacuous: no line previously had Pre-PR + audit-ai-docs)
out=$(grep -nE 'Pre-PR[^|]*audit-ai-docs' "$C")
[ -n "$out" ] \
  && ok "checks-map pos-B: lvl-4 stage label now names the shipped gate (audit-ai-docs)" \
  || bad "checks-map pos-B: no Pre-PR stage label names audit-ai-docs (shipped gate missing)"

# pos-C: ASCII pipeline diagram PRE-PR tool no longer bare /aif-verify
dr=$(grep -nE 'IDE LSP.*full tests' "$C" || true)
printf '%s' "$dr" | grep -q '/aif-verify' \
  && bad "checks-map pos-C: diagram still lists /aif-verify as PRE-PR tool" \
  || ok "checks-map pos-C: diagram PRE-PR tool no longer bare /aif-verify"

# neg (LOAD-BEARING): re-inject a dishonest level-4 stage-label row → pos-A1 grep MUST bite
cp "$C" "$C.bak"
printf '\n| 4 | **Pre-PR** (`/aif-verify`) | x | x | x | x | x |\n' >> "$C"
out=$(grep -nE 'Pre-PR\*\* \([^)]*aif-verify' "$C")
[ -n "$out" ] \
  && ok "checks-map neg: re-injected '**Pre-PR** (\`/aif-verify\`)' → pos-A1 grep bites (non-vacuous)" \
  || bad "checks-map neg: re-injected dishonest stage label but pos-A1 stayed empty → VACUOUS check"
mv "$C.bak" "$C"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
