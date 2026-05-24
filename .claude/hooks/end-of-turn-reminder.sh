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

# Already-recapped guard: if the current assistant turn already contains the
# canonical "## 🟢 Простыми словами" marker, the recap is done — re-firing would
# re-inject the recap instruction over an existing recap. Complements the
# built-in stop_hook_active guard (hook:7-10) for the case where the model
# proactively recaps in a fresh natural turn (stop_hook_active=false).
if [ -n "$text" ] && printf '%s' "$text" | grep -qF '## 🟢 Простыми словами'; then
  exit 0
fi

# --- Factual-claim scan (deterministic; no LLM, no external call — no-paid-llm-in-ci).
# spec: docs/meta-factory/research-patches/2026-05-21-autonomous-self-audit-triggering.md §11.1
# Targets the at-write-time factual class the recap nudge alone does NOT force a
# re-verify on: numeric counts (incident #1 "4+ files"), file:line citations
# (incident #5 ":30"), and negative-existence claims (incident #2). These can ride a
# SHORT turn that the long_text gate skips — so the scan fires on claim-PRESENCE
# regardless of length, and enumerates the exact hits so the re-verify ask is
# item-specific (Agent Verifier `[P]`-tier idea), not a generic "be careful".
# Honest limit: this raises salience, it does not structurally force compliance.
#
# Recall + precision fix (instruction-compliance-empirical R-phase §6.4/§9 Q-E4,
# maintainer decision 2026-05-21): the v1 numeric regex required the count-noun
# adjacent to the number, missing the majority of natural phrasings ("6 discipline
# rules", "11 distinct principles" — §6.4 measured recall ~0.43). The numeric scan
# now allows ≤2 intervening tokens. And precision: the v1 scan ran over raw text,
# over-firing on numbers/paths inside fenced code (drafted prompts), blockquotes
# (quoted material), and markdown link targets (§6.2 measured precision ~0.20-0.25,
# cry-wolf). The scan now runs over a cleaned copy with those three classes stripped.
# Inline `code` is KEPT so genuine `file:line` citations in prose still fire.
# NOTE: this scan's regexes + cleaning are kept identical to the eval scorer
# (tests/eval/claim-groundedness-scorer.py) so the eval measures the same surface.
claim_hits=""
if [ -n "$text" ]; then
  scan_text=$(printf '%s\n' "$text" \
    | awk 'BEGIN{f=0} /^[[:space:]]*```/{f=!f; next} f{next} {print}' \
    | grep -vE '^[[:space:]]*>' \
    | sed -E 's/\]\([^)]*\)/]/g')
  while IFS= read -r h; do [ -n "$h" ] && claim_hits+="  • число «${h}» — переrun команду подсчёта, процитируй вывод (не по памяти)"$'\n'; done \
    < <(echo "$scan_text" | grep -oiE '[0-9]+\+?( +[^[:space:]]+){0,2} +(files?|tests?|cases?|entries|entry|rules?|principles?|layers?|incidents?|candidates?|commits?|hooks?|lines?)' | head -5)
  while IFS= read -r h; do [ -n "$h" ] && claim_hits+="  • цитата «${h}» — переоткрой file:line, подтверди содержимое строки"$'\n'; done \
    < <(echo "$scan_text" | grep -oiE '[a-zA-Z0-9_./-]+\.(ts|tsx|js|jsx|md|sh|json|ya?ml):[0-9]+' | head -5)
  while IFS= read -r h; do [ -n "$h" ] && claim_hits+="  • negative-existence «${h}…» — назови, какие из 6 пунктов search-coverage прогнал"$'\n'; done \
    < <(echo "$scan_text" | grep -oiE 'no (production|existing|prod|known)[^.]{0,60}(exist|found|analog|implement)' | head -3)
fi
has_claims=false
[ -n "$claim_hits" ] && has_claims=true
claim_count=0
[ -n "$claim_hits" ] && claim_count=$(printf '%s' "$claim_hits" | grep -c '^  ' || true)


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


# -- MAJOR-1 idle-suppression guard -------------------------------------------
# Suppress Branch B (asked=true, long_text=false, has_claims=false) ONLY when
# ALL three hold:
#   (a) Previous assistant turn already produced a "## 🟢" recap block.
#   (b) Current turn text is NOT new -- its first 120 chars appear verbatim in
#       the previous turn text (same question repeated/re-ping after recap).
#   (c) has_claims=false -- a claim-bearing short turn always fires Branch D.
# A genuinely new question will NOT match (b) because it contains content the
# previous turn never had. Only idle re-pings are suppressed.
# Guard never fires if only one assistant turn exists in the transcript.
# B2 fix: NEVER suppress when text is empty (AskUserQuestion-only turn) or
# has_askuserquestion=true or current_short is empty — a tool-only turn asking a
# NEW question must always fire. Short-circuit BEFORE the grep -qF call.
idle_suppress=false
if [ "$asked" = "true" ] && [ "$long_text" = "false" ] && [ "$has_claims" = "false" ]; then
  # B2: if text is empty or it's an AskUserQuestion-only turn, never suppress
  if [ -z "$text" ] || [ "$has_askuserquestion" = "true" ]; then
    idle_suppress=false
  else
    prev_line=$(grep '"type":"assistant"' "$transcript" 2>/dev/null | tail -2 | head -1 || true)
    if [ -n "$prev_line" ] && [ "$prev_line" != "$last_line" ]; then
      prev_text=$(printf '%s' "$prev_line" | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null || true)
      if printf '%s\n' "${prev_text}" | grep -q '## 🟢'; then
        current_short=$(printf '%s' "$text" | head -c 120 | tr '\n' ' ')
        # B2: if current_short is empty, never suppress (empty grep -qF "" matches anything)
        if [ -n "$current_short" ] && printf '%s\n' "${prev_text}" | grep -qF "${current_short}"; then
          idle_suppress=true
        fi
      fi
    fi
  fi
fi

if [ "$idle_suppress" = "true" ]; then
  exit 0
fi

# -- P-user glance-line (systemMessage field) ---------------------------------
# Shown to the USER in CC UI (not to the model). Format:
# 🎯 <anchor truncated to 60 chars> [* N fact(s) to re-verify when N>0]
anchor_short=$(echo "${anchor}" | head -c 60 | tr '\n' ' ')
if [ "${claim_count}" -gt 0 ]; then
  glance_line="🎯 ${anchor_short} · ${claim_count} факт(ов) на перепроверку"
else
  glance_line="🎯 ${anchor_short}"
fi

# Three branches:
#   Branch C — long answer AND a trailing fork-question: needs BOTH the work
#     recap (+ goal drift verdict) AND the recommendation-first/fork-challenge.
#     A pure long-wins collapse would drop the recommendation nudge exactly when
#     a fork is on the table — the highest-value moment for it.
#     DECISION-1=B (gated): Branch C = whole-session recap, Branch A = lighter per-turn body;
#     maintainer may switch to A by extending the recap to Branch A.
#   Branch A — long substantive answer, no question: lighter per-turn work recap.
#   Branch B — a question with no long answer body: fork-challenge + recommend-first.
#   Branch D — claims present on a short, question-less turn: claim-only re-verify.
#   Neither (short chatter, bare tool call, no claim) — stay silent (no reminder).
if [ "$long_text" = "false" ] && [ "$asked" = "false" ] && [ "$has_claims" = "false" ]; then
  exit 0
fi

if [ "$long_text" = "true" ] && [ "$asked" = "true" ]; then
  # Branch C: whole-session recap + fork-challenge (DECISION-1=B full recap stays here)
  reminder=$(cat <<EOF
Стоп. Это и длинный ответ, И вопрос-развилка в конце — нужен и пересказ работы, и проверка вопроса. В первую очередь для себя.
ОБЯЗАТЕЛЬНО начни блок ровно со строки «## 🟢 Простыми словами» — чтобы человек опознал его с ходу.
(Не можешь сказать просто, конкретно и в общем — что/зачем/почему/как → сам не до конца понял; это диагностика, не отчёт.)

Цель сессии (из названия сессии / первого задания): «${anchor}».

Первые 2 строки — так, чтобы человек без контекста понял с ходу:
• Чем занята сессия В ЦЕЛОМ — одной фразой (не «что прям сейчас правил»).
• На той ли цели — выбери ОДНО: НА ЦЕЛИ / УВЕЛО В СТОРОНУ <тема> (и почему) / СОЗНАТЕЛЬНО СВЕРНУЛ на <тема> (и зачем). Не «вроде на цели».

Дальше — про всю сессию, НЕ про последний ход:
• Зачем мы это делаем — общая цель своими словами (не пересказ названия): какую задачу закрываем и почему она важна.
• Что уже сделано к этой цели — НАКОПИТЕЛЬНО, по шагам с именами (файл/PR/решение): всё значимое за сессию, а не только последнее изменение.
• Что впереди — ВСЁ что осталось до цели, по пунктам: не один следующий шаг, а весь хвост. Если близко к концу — так и скажи.
• В чём меньше всего уверен — одна вещь на перепроверку (или честно «таких нет»).
• Где сессия противоречит себе — назови разрыв между заявленной целью и тем, что вышло на деле, или место, где работа подрывает собственную предпосылку (как «проект против doc-bloat сам распух в doc-bloat»). Это «documents lie; tests don’t», наведённое на сам пересказ. Нет настоящего разрыва — пропусти: натянутая ирония хуже её отсутствия.

По вопросу:
1. Это настоящая развилка — или я перекладываю решение, которое могу принять сам? Один вариант явно лучше по существу (по целям сессии и дисциплине) → НЕ спрашивай: сделай его и скажи, что сделал.
2. Если правда развилка — сначала МОЯ обоснованная рекомендация: «Рекомендую <вариант>, потому что <причина против целей и трейдоффов>». Потом альтернативы коротко. Решает человек.
Любой пункт не выходит конкретным → скажи прямо, не заполняй водой.
EOF
)
elif [ "$long_text" = "true" ]; then
  # Branch A: lighter per-turn body (DECISION-1=B — whole-session recap stays in Branch C only)
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
jq -n --arg msg "$reminder" --arg gl "${glance_line}" '{
  decision: "block",
  reason: $msg,
  systemMessage: $gl
}'
exit 0
