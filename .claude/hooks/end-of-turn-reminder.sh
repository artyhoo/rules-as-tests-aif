#!/usr/bin/env bash
# @cc-only-rationale: internal dev tooling — end-of-turn reminder injection for maintainer's CC session; not shipped to consumer projects via install.sh
set -euo pipefail

input=$(cat)

stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
[ "$stop_hook_active" = "true" ] && exit 0

transcript=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)
if [ -z "$transcript" ] || [ ! -f "$transcript" ]; then
  exit 0
fi

last_line=$(tail -r "$transcript" 2>/dev/null | grep -m1 '"type":"assistant"' || true)
[ -z "$last_line" ] && exit 0

tool_names=$(echo "$last_line" | jq -r '.message.content[]? | select(.type=="tool_use") | .name' 2>/dev/null || true)
if echo "$tool_names" | grep -qx 'AskUserQuestion'; then
  exit 0
fi

text=$(echo "$last_line" | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null || true)
[ -z "$text" ] && exit 0

text_length=${#text}
trigger_report=false
if [ "$text_length" -gt 500 ]; then
  if echo "$text" | grep -qE '^#|^- |^\* |\*\*|```|\[[^]]+\]\([^)]+\)'; then
    trigger_report=true
  fi
fi

tail_chunk=$(echo "$text" | tail -c 500)
trigger_question=false
if echo "$tail_chunk" | grep -qE '\?[[:space:]]*$'; then
  trigger_question=true
elif echo "$tail_chunk" | grep -qiE 'Option [AB]|выбирай|decide|хочешь чтобы|which (option|approach)'; then
  trigger_question=true
fi

if [ "$trigger_report" = "false" ] && [ "$trigger_question" = "false" ]; then
  exit 0
fi

if [ "$trigger_report" = "true" ] && [ "$trigger_question" = "true" ]; then
  reminder='Тебе нужно сейчас сделать две вещи, обе простым языком (без жаргона, как другу):
1. Короткое саммари того что ты только что сказал — в 5 блоках (что сделал / главный вывод / что важно сейчас / следующий шаг / на что обратить внимание).
2. Объяснение вопроса который ты задал — в 1-2 предложениях, чтобы пользователь точно понимал суть выбора и последствия вариантов.
Не повторяй детали основного ответа в саммари. Не повторяй текст вопроса — только пояснение.'
elif [ "$trigger_report" = "true" ]; then
  reminder='Тебе в твоём предыдущем сообщении дали подробный ответ. Дай теперь короткое саммари в 5 блоках простым языком — как будто рассказываешь коллеге за чашкой кофе, без жаргона:
1. Что было сделано / показано (1 строка)
2. Главный вывод (1 строка)
3. Что важно для пользователя прямо сейчас (1 строка)
4. Что осталось / следующий шаг (1 строка)
5. На что обратить внимание / риски (1 строка, если есть — иначе пропусти)
Только саммари — не повторяй детали из основного ответа.'
else
  reminder='Ты только что задал пользователю вопрос. Прежде чем ждать ответ — объясни в 1-2 предложениях простым языком, в чём суть выбора, как будто рассказываешь другу, не разбирающемуся в коде. Без жаргона. Цель: чтобы пользователь точно понимал, что выбирает и какие будут последствия каждого варианта.'
fi

jq -nc --arg msg "$reminder" '{
  decision: "block",
  reason: "End-of-turn reminder injected",
  systemMessage: $msg
}'
exit 0
