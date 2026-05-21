#!/usr/bin/env bash
# @cc-only-rationale: internal dev tooling — pre-question fork-challenge for the maintainer's CC session; not shipped to consumer projects via install.sh
#
# Companion to .claude/hooks/end-of-turn-reminder.sh (Stop hook). Division of labour:
#   • end-of-turn-reminder.sh (Stop)      → END-OF-TURN recap + goal-drift verdict.
#   • this hook (PreToolUse:AskUserQuestion) → PRE-QUESTION fork-challenge, fired the
#     moment the model is about to ask the user.
# Why a separate hook: a Stop event does NOT reliably fire when a turn ends in
# AskUserQuestion (the CC harness treats AUQ as an interaction-pending tool, so the
# Stop-hook recap never reached the model). The Stop+AUQ interaction is undocumented;
# the PreToolUse path IS documented. Verified dual-channel 2026-05-21
# (claude-code-guide built-in + DeepWiki anthropics/claude-code): PreToolUse blocks via
# hookSpecificOutput.permissionDecision="deny" + permissionDecisionReason; exit 0 → JSON parsed.
#
# Loop-safety: PreToolUse has NO stop_hook_active equivalent. A blanket deny on every
# AskUserQuestion would loop (deny → regenerate → ask → deny …). Guard = a session-scoped
# recency flag: challenge once, then let the immediate retry (and any AUQ within the
# window) through. A genuinely-new question moment (>window since the last reminder) is
# challenged afresh. Worst case if any assumption is wrong: malformed JSON → CC falls back
# to normal flow → the question proceeds (benign, no block).
set -euo pipefail

input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name // empty' 2>/dev/null || echo "")
# Defensive: the settings.json matcher already restricts to AskUserQuestion, but never
# act on anything else if the matcher is ever broadened.
if [ "$tool_name" != "AskUserQuestion" ]; then
  exit 0
fi

session_id=$(echo "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo "nosession")
flag="${TMPDIR:-/tmp}/aif-ask-reminded-${session_id}"
window=45

# Recency guard: if we reminded within the window, this AUQ is the retry (or a
# closely-following question) — let it through to avoid the deny→retry loop.
if [ -f "$flag" ]; then
  now=$(date +%s)
  mtime=$(stat -f %m "$flag" 2>/dev/null || stat -c %Y "$flag" 2>/dev/null || echo 0)
  if [ "$(( now - mtime ))" -lt "$window" ]; then
    exit 0
  fi
fi

# Fresh challenge: record the moment, then deny once so the model reconsiders before asking.
touch "$flag"

reminder=$(cat <<'EOF'
Стоп — ты собираешься задать вопрос. Сначала проверь сам вопрос, в первую очередь для себя.
1. Это настоящая развилка — или ты перекладываешь решение, которое можешь принять сам? Если один вариант явно лучше по существу (по целям сессии и дисциплине проекта) — НЕ спрашивай: сделай его и скажи, что сделал.
2. Если это правда развилка — сначала ТВОЯ обоснованная рекомендация: «Рекомендую <вариант>, потому что <причина против целей и трейдоффов>», потом альтернативы коротко. Решает человек.
3. Простыми словами: что именно решаем и почему это блокирует — на конкретном примере, не повтор текста вопроса.
Если всё это уже сделано в твоём ответе — просто задай вопрос снова: повтор не блокируется.
EOF
)

jq -n --arg r "$reminder" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $r
  }
}'
exit 0
