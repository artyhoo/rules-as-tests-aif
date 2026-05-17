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
Твой основной ответ был профессиональным — это правильно, в своём словаре ты работаешь точно. Теперь два Feynman-слоя поверх (понимаешь = умеешь пересказать просто; если не можешь — значит на самом деле не понял, и это диагностика, не косметика).

Слой 1 — саммари того что ты сказал, простыми словами, 5 коротких блоков:
1. Что я сделал / показал
2. Главный вывод
3. Что это значит для пользователя сейчас
4. Что дальше
5. На что обратить внимание (или пропусти)

Слой 2 — объяснение вопроса, 1-2 предложения простыми словами:
- в чём суть выбора,
- что меняется между вариантами на простом примере.

Если какой-то из слоёв не складывается просто — НЕ имитируй: скажи «упростить вот эту часть не получается, давай пересоберём» и укажи где затык. Это и есть диагностический сигнал — Layer 1 либо неточный, либо паттерн-мэтч.
EOF
)
elif [ "$trigger_report" = "true" ]; then
  reminder=$(cat <<'EOF'
Твой основной ответ был профессиональным — это правильно, в своём словаре ты мыслишь точно. Теперь второй слой: пересказ простыми словами как Feynman-check «понимаешь = умеешь рассказать другу за кофе». Если пересказ не складывается — Layer 1 был паттерн-мэтчем, вернись и пересобери.
Формат — 5 коротких блоков, без жаргона, без терминов которые требуют объяснения:
1. Что я только что сделал / показал (1 строка)
2. Главный вывод одной фразой (1 строка)
3. Что это значит для пользователя прямо сейчас (1 строка)
4. Что осталось / следующий шаг (1 строка)
5. На что обратить внимание / риски (1 строка, или пропусти если нет)
Не повторяй детали Layer 1. Если ловишь себя на «упростить не получается, скажу как было» — это и есть сигнал что Layer 1 надо пересобрать, не пиши «упрощённую» копию.
EOF
)
else
  reminder=$(cat <<'EOF'
Ты только что задал пользователю вопрос в своём профессиональном словаре — это правильно, точность не теряется. Теперь Feynman-check: объясни тот же вопрос так, чтобы понял друг, не разбирающийся в коде.
1-2 предложения, без жаргона. Объясни:
- в чём суть выбора (не повторяя текст вопроса дословно),
- что меняется в итоге между вариантами — на простом примере или метафоре.
Если объяснение не складывается простыми словами — это сигнал что сам вопрос сформулирован неточно или ты не до конца понимаешь trade-off. В этом случае честно скажи «упростить не получается, давай я ещё подумаю» вместо имитации простоты.
EOF
)
fi

jq -n --arg msg "$reminder" '{
  decision: "block",
  reason: "End-of-turn reminder injected",
  systemMessage: $msg
}'
exit 0
