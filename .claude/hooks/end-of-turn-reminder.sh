#!/usr/bin/env bash
# @cc-only-rationale: internal dev tooling — end-of-turn reminder injection for maintainer's CC session; not shipped to consumer projects via install.sh
set -euo pipefail

input=$(cat)

stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
if [ "$stop_hook_active" = "true" ]; then
  exit 0
fi

transcript=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")
if [ -z "$transcript" ] || [ ! -f "$transcript" ]; then
  exit 0
fi

last_line=$(tail -r "$transcript" 2>/dev/null | grep -m1 '"type":"assistant"' || true)
if [ -z "$last_line" ]; then
  exit 0
fi

tool_names=$(echo "$last_line" | jq -r '.message.content[]? | select(.type=="tool_use") | .name' 2>/dev/null || true)
has_askuserquestion=false
if echo "$tool_names" | grep -qx 'AskUserQuestion'; then
  has_askuserquestion=true
fi

text=$(echo "$last_line" | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null || true)
if [ -z "$text" ] && [ "$has_askuserquestion" != "true" ]; then
  exit 0
fi

text_length=${#text}
trigger_report=false
if [ "$text_length" -gt 500 ]; then
  if echo "$text" | grep -qE '^#|^- |^\* |\*\*|```|\[[^]]+\]\([^)]+\)'; then
    trigger_report=true
  fi
fi

trigger_question=false
if [ "$has_askuserquestion" = "true" ]; then
  trigger_question=true
elif [ -n "$text" ]; then
  tail_chunk=$(echo "$text" | tail -c 500)
  if echo "$tail_chunk" | grep -qE '\?[[:space:]]*$'; then
    trigger_question=true
  elif echo "$tail_chunk" | grep -qiE 'Option [AB]|выбирай|decide|хочешь чтобы|which (option|approach)'; then
    trigger_question=true
  fi
fi

if [ "$trigger_report" = "false" ] && [ "$trigger_question" = "false" ]; then
  exit 0
fi

if [ "$trigger_report" = "true" ] && [ "$trigger_question" = "true" ]; then
  reminder=$(cat <<'EOF'
ОБЯЗАТЕЛЬНО допиши в конец ответа ВИДИМЫЙ блок — начни его ровно со строки «## 🟢 Простыми словами» (без этого заголовка блок не считается выполненным; пользователь должен его увидеть). Это Feynman-check: понимаешь = умеешь пересказать просто; если не складывается — это диагностика, а не косметика.

В блоке два слоя.

Слой 1 — что ты сказал, простыми словами, 5 коротких строк:
1. Что я сделал / показал
2. Главный вывод
3. Что это значит для тебя сейчас
4. Что дальше
5. На что обратить внимание (или пропусти)

Слой 2 — суть вопроса, 1-2 предложения без жаргона: в чём выбор и что меняется между вариантами на простом примере.

Если слой не складывается просто — НЕ имитируй: напиши «упростить вот эту часть не получается» и укажи где затык. Это и есть сигнал — Layer 1 был неточным или паттерн-мэтчем.
EOF
)
elif [ "$trigger_report" = "true" ]; then
  reminder=$(cat <<'EOF'
ОБЯЗАТЕЛЬНО допиши в конец ответа ВИДИМЫЙ блок — начни его ровно со строки «## 🟢 Простыми словами» (без этого заголовка блок не считается; пользователь должен его увидеть). Feynman-check: понимаешь = умеешь рассказать другу за кофе. Если пересказ не складывается — Layer 1 был паттерн-мэтчем, вернись и пересобери.
Формат — 5 коротких строк, без жаргона и без терминов, требующих объяснения:
1. Что я только что сделал / показал
2. Главный вывод одной фразой
3. Что это значит для тебя прямо сейчас
4. Что осталось / следующий шаг
5. На что обратить внимание / риски (или пропусти если нет)
Не повторяй детали выше. Если ловишь себя на «упростить не получается, скажу как было» — это сигнал пересобрать сам ответ, а не писать «упрощённую» копию.
EOF
)
else
  reminder=$(cat <<'EOF'
ОБЯЗАТЕЛЬНО допиши ВИДИМЫЙ блок — начни его ровно со строки «## 🟢 Простыми словами» (без этого заголовка блок не считается; пользователь должен его увидеть). Объясни заданный вопрос так, чтобы понял друг, не разбирающийся в коде.
1-2 предложения, без жаргона: в чём суть выбора (не повторяя вопрос дословно) и что меняется между вариантами — на простом примере или метафоре.
Если просто не складывается — это сигнал, что вопрос сформулирован неточно или ты не до конца понимаешь trade-off. Тогда честно напиши «упростить не получается, давай ещё подумаю» вместо имитации простоты.
EOF
)
fi

jq -n --arg msg "$reminder" '{
  decision: "block",
  reason: "End-of-turn reminder injected",
  systemMessage: $msg
}'
exit 0
