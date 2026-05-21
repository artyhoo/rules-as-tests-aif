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

# Session-goal anchor (deterministic, no LLM). Primary signal: CC's own session
# title (`{"type":"ai-title","aiTitle":...}`) — empirically present even when the
# first user message has no extractable text block. Fallback: head of the first
# user instruction. grep avoids a full-file jq slurp (cheap on large transcripts).
anchor=$(grep '"type":"ai-title"' "$transcript" 2>/dev/null | tail -1 | jq -r '.aiTitle // empty' 2>/dev/null || true)
if [ -z "$anchor" ]; then
  anchor=$(grep -m1 '"type":"user"' "$transcript" 2>/dev/null | jq -r 'if (.message.content|type=="array") then (.message.content[]? | select(.type=="text") | .text) else (.message.content // empty) end' 2>/dev/null | head -1 | tr "\n" " " | cut -c1-120 || true)
fi
[ -z "$anchor" ] && anchor="(цель сессии не извлеклась — назови её сам)"

# Last assistant line. `grep ... | tail -1` (portable: equivalent to BSD `tail -r |
# grep -m1` on macOS, and works on Linux/CI where `tail -r` is unavailable — lets the
# companion test exercise this hook in CI).
last_line=$(grep '"type":"assistant"' "$transcript" 2>/dev/null | tail -1 || true)
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

# --- Factual-claim scan (deterministic; no LLM, no external call — no-paid-llm-in-ci).
# spec: docs/meta-factory/research-patches/2026-05-21-autonomous-self-audit-triggering.md §11.1
# Targets the at-write-time factual class the recap nudge alone does NOT force a
# re-verify on: numeric counts (incident #1 "4+ files"), file:line citations
# (incident #5 ":30"), and negative-existence claims (incident #2). These can ride a
# SHORT turn that the long_text gate skips — so the scan fires on claim-PRESENCE
# regardless of length, and enumerates the exact hits so the re-verify ask is
# item-specific (Agent Verifier `[P]`-tier idea), not a generic "be careful".
# Honest limit: this raises salience, it does not structurally force compliance.
claim_hits=""
if [ -n "$text" ]; then
  while IFS= read -r h; do [ -n "$h" ] && claim_hits+="  • число «${h}» — переrun команду подсчёта, процитируй вывод (не по памяти)"$'\n'; done \
    < <(echo "$text" | grep -oiE '[0-9]+\+? *(files?|tests?|cases?|entries|entry|rules?|principles?|layers?|incidents?|candidates?|commits?|hooks?|lines?)' | head -5)
  while IFS= read -r h; do [ -n "$h" ] && claim_hits+="  • цитата «${h}» — переоткрой file:line, подтверди содержимое строки"$'\n'; done \
    < <(echo "$text" | grep -oiE '[a-zA-Z0-9_./-]+\.(ts|tsx|js|jsx|md|sh|json|ya?ml):[0-9]+' | head -5)
  while IFS= read -r h; do [ -n "$h" ] && claim_hits+="  • negative-existence «${h}…» — назови, какие из 6 пунктов search-coverage прогнал"$'\n'; done \
    < <(echo "$text" | grep -oiE 'no (production|existing|prod|known)[^.]{0,60}(exist|found|analog|implement)' | head -3)
fi
has_claims=false
[ -n "$claim_hits" ] && has_claims=true

# Trigger ONLY on (a) a substantial structured answer ("много текста"),
# (b) a question, or (c) factual claims detected by the scan above.
# Tool calls alone do NOT trigger — a short "готово, поправил X" turn with no
# claim and no question needs no recap.
long_text=false
if [ "$text_length" -gt 500 ]; then
  if echo "$text" | grep -qE '^#|^- |^\* |\*\*|```|\[[^]]+\]\([^)]+\)'; then
    long_text=true
  fi
fi

# Did the turn end in a question?
asked=false
if [ "$has_askuserquestion" = "true" ]; then
  asked=true
elif [ -n "$text" ]; then
  tail_chunk=$(echo "$text" | tail -c 500)
  if echo "$tail_chunk" | grep -qE '\?[[:space:]]*$'; then
    asked=true
  elif echo "$tail_chunk" | grep -qiE 'Option [AB]|выбирай|decide|хочешь чтобы|which (option|approach)'; then
    asked=true
  fi
fi

# Three branches:
#   Branch C — long answer AND a trailing fork-question: needs BOTH the work
#     recap (+ goal drift verdict) AND the recommendation-first/fork-challenge.
#     A pure long-wins collapse would drop the recommendation nudge exactly when
#     a fork is on the table — the highest-value moment for it.
#   Branch A — long substantive answer, no question: work recap + drift verdict.
#   Branch B — a question with no long answer body: fork-challenge + recommend-first.
#   Branch D — claims present on a short, question-less turn: claim-only re-verify.
#   Neither (short chatter, bare tool call, no claim) — stay silent (no reminder).
if [ "$long_text" = "false" ] && [ "$asked" = "false" ] && [ "$has_claims" = "false" ]; then
  exit 0
fi

if [ "$long_text" = "true" ] && [ "$asked" = "true" ]; then
  reminder=$(cat <<EOF
Стоп. Это и длинный ответ, И вопрос-развилка в конце — нужен и пересказ работы, и проверка вопроса. В первую очередь для себя.
ОБЯЗАТЕЛЬНО начни блок ровно со строки «## 🟢 Простыми словами» — чтобы человек опознал его с ходу.
(Не можешь сказать просто, конкретно и в общем — что/зачем/почему/как → сам не до конца понял; это диагностика, не отчёт.)

Цель сессии (из названия сессии / первого задания): «${anchor}».

Первые 2 строки — так, чтобы человек без контекста понял с ходу:
• Чем я сейчас занят — одной фразой, простым языком.
• На той ли я цели — выбери ОДНО: НА ЦЕЛИ / УВЕЛО В СТОРОНУ <тема> (и почему) / СОЗНАТЕЛЬНО СВЕРНУЛ на <тема> (и зачем). Не «вроде на цели».

Что сделал — коротко, с именами (файл/функция/решение): конкретное изменение + ОДНА вещь, в которой меньше всего уверен и которую стоит перепроверить.

По вопросу:
1. Это настоящая развилка — или я перекладываю решение, которое могу принять сам? Один вариант явно лучше по существу (по целям сессии и дисциплине) → НЕ спрашивай: сделай его и скажи, что сделал.
2. Если правда развилка — сначала МОЯ обоснованная рекомендация: «Рекомендую <вариант>, потому что <причина против целей и трейдоффов>». Потом альтернативы коротко. Решает человек.
Любой пункт не выходит конкретным → скажи прямо, не заполняй водой.
EOF
)
elif [ "$long_text" = "true" ]; then
  reminder=$(cat <<EOF
Стоп. Прежде чем закончить — пересказ простыми словами, в первую очередь для себя.
ОБЯЗАТЕЛЬНО начни блок ровно со строки «## 🟢 Простыми словами» — чтобы человек опознал его с ходу.
(Не можешь сказать просто, конкретно и в общем — что/зачем/почему/как → сам не до конца понял; это диагностика, не отчёт.)

Цель сессии (из названия сессии / первого задания): «${anchor}».

Первые 2 строки — так, чтобы человек без контекста понял с ходу:
• Чем я сейчас занят — одной фразой, простым языком.
• На той ли я цели — выбери ОДНО: НА ЦЕЛИ / УВЕЛО В СТОРОНУ <тема> (и почему) / СОЗНАТЕЛЬНО СВЕРНУЛ на <тема> (и зачем). Не «вроде на цели».

Дальше для себя, по пункту, с именами (файл/функция/решение), без воды:
• Что я только что сделал — конкретное изменение, не пересказ задачи.
• Нетривиальные решения — «выбрал X вместо Y потому что Z», или честно «решений не было».
• В чём меньше всего уверен — назови ОДНУ вещь, которую стоит перепроверить.
• Следующий шаг и почему он следующий.
Любой пункт не выходит конкретным → скажи прямо, не заполняй водой.
EOF
)
elif [ "$asked" = "true" ]; then
  reminder=$(cat <<EOF
Ты остановился на вопросе. Прежде чем ждать — проверь сам вопрос, для себя в первую очередь.
ОБЯЗАТЕЛЬНО начни блок ровно со строки «## 🟢 Простыми словами».

Цель сессии: «${anchor}».

1. Это настоящая развилка — или я перекладываю решение, которое могу принять сам? Если один вариант явно лучше по существу (по целям сессии и дисциплине проекта) — НЕ спрашивай: сделай его и скажи, что сделал. Вопрос резервируй для развилок, где честно не выбрать на мерилах.
2. Если это правда развилка — сначала МОЯ обоснованная рекомендация: «Рекомендую <вариант>, потому что <причина против целей и трейдоффов>». Потом альтернативы коротко. Решает человек.
3. Простыми словами: что именно решаем и почему это блокирует — на простом примере, не повтор текста вопроса.
Суть выбора не объясняется просто → сам вопрос сформулирован неточно: скажи об этом.
EOF
)
else
  # Branch D — claims present, but short turn with no question and no long body.
  reminder=$(cat <<EOF
Короткий ход — но в нём есть фактические утверждения. Прежде чем «готово», перепроверь их сам, для себя, по источнику, а не по памяти.
EOF
)
fi

# Append the enumerated factual-claim re-verify block to whatever reminder fired
# (Branch A/B/C/D) — the item-specific salience upgrade over the generic nudge.
if [ "$has_claims" = "true" ]; then
  reminder+=$'\n\n'"Фактические утверждения в этом ходе — перепроверь КАЖДОЕ перед «готово» (проверка источника, не пересказ):"$'\n'"${claim_hits}"
fi

# `reason` is the field delivered to the MODEL when decision=block on a Stop hook
# (the agent does not stop and gets one more turn with `reason` injected — so the
# recap instruction MUST go here). `systemMessage` is user-UI only and does NOT
# reach the model. Verified dual-channel 2026-05-21: Claude Code hooks docs (Stop
# decision-control: "reason must be provided for Claude to know how to proceed")
# + WebSearch corroboration; #81's systemMessage-delivery never reached the model.
jq -n --arg msg "$reminder" '{
  decision: "block",
  reason: $msg,
  systemMessage: "End-of-turn recap requested"
}'
exit 0
